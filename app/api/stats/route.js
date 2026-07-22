import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Runs a command and, on failure, captures the *actual* stderr/error text
// instead of discarding it. vcgencmd in particular can fail for several
// different reasons (not installed, not on a Pi, permission denied because
// the process user isn't in the `video` group, etc.) and silently returning
// null makes those indistinguishable from the dashboard. Callers get the
// real reason back in an `error` field so it can be surfaced in the UI.
async function safeExec(cmd) {
  try {
    const { stdout } = await execPromise(cmd);
    return { stdout, error: null };
  } catch (error) {
    const message = (error.stderr || error.message || 'Unknown error').toString().trim();
    return { stdout: null, error: message };
  }
}

async function getCPUTemperature() {
  try {
    const { stdout } = await execPromise('cat /sys/class/thermal/thermal_zone0/temp');
    return (parseInt(stdout) / 1000).toFixed(1);
  } catch (error) {
    return 'N/A';
  }
}

// Parses the bitmask returned by `vcgencmd get_throttled` into human-readable flags.
// Bit reference: https://www.raspberrypi.com/documentation/computers/os.html#get_throttled
async function getThrottledStatus() {
  const { stdout, error } = await safeExec('vcgencmd get_throttled');
  if (error) return { data: null, error };

  const match = stdout.match(/0x([0-9a-fA-F]+)/);
  if (!match) return { data: null, error: `Unexpected vcgencmd output: "${stdout.trim()}"` };

  const value = parseInt(match[1], 16);
  return {
    data: {
      raw: `0x${match[1]}`,
      undervoltageNow: !!(value & 0x1),
      freqCappedNow: !!(value & 0x2),
      throttledNow: !!(value & 0x4),
      tempLimitNow: !!(value & 0x8),
      undervoltageOccurred: !!(value & 0x10000),
      freqCappedOccurred: !!(value & 0x20000),
      throttledOccurred: !!(value & 0x40000),
      tempLimitOccurred: !!(value & 0x80000)
    },
    error: null
  };
}

async function getCoreVoltage() {
  const { stdout, error } = await safeExec('vcgencmd measure_volts core');
  if (error) return { data: null, error };

  const match = stdout.match(/volt=([\d.]+)V/);
  if (!match) return { data: null, error: `Unexpected vcgencmd output: "${stdout.trim()}"` };

  return { data: parseFloat(match[1]), error: null };
}

async function getClockSpeeds() {
  const [armResult, gpuResult] = await Promise.all([
    safeExec('vcgencmd measure_clock arm'),
    safeExec('vcgencmd measure_clock core')
  ]);

  const parseHz = (stdout) => {
    const match = stdout.match(/=(\d+)/);
    return match ? Math.round(parseInt(match[1], 10) / 1e6) : null;
  };

  return {
    data: {
      armMHz: armResult.error ? null : parseHz(armResult.stdout),
      gpuMHz: gpuResult.error ? null : parseHz(gpuResult.stdout)
    },
    error: armResult.error || gpuResult.error || null
  };
}

// Checks the status of a systemd-managed service (e.g. cloudflared, webhook).
// `systemctl is-active` exits non-zero for inactive/failed services, so the
// status text still needs to be read off stdout in the error case.
async function getSystemdServiceStatus(serviceName) {
  try {
    const { stdout } = await execPromise(`systemctl is-active ${serviceName}`);
    return stdout.trim();
  } catch (error) {
    if (error.stdout) return error.stdout.trim();
    return 'unknown';
  }
}

// Reads process info from PM2 (used to run the Next.js app itself per the README).
async function getPM2Processes() {
  try {
    const { stdout } = await execPromise('pm2 jlist');
    const list = JSON.parse(stdout);
    return list.map((proc) => ({
      name: proc.name,
      status: proc.pm2_env?.status || 'unknown',
      cpu: proc.monit?.cpu ?? null,
      memoryMB: proc.monit?.memory ? +(proc.monit.memory / (1024 ** 2)).toFixed(1) : null,
      restarts: proc.pm2_env?.restart_time ?? null,
      uptimeMs: proc.pm2_env?.pm_uptime ? Date.now() - proc.pm2_env.pm_uptime : null
    }));
  } catch (error) {
    return [];
  }
}

// Reads cumulative per-interface counters from /proc/net/dev and pairs them with
// the IP addresses Node already knows about via os.networkInterfaces(). Counters
// are cumulative since boot — the client computes throughput (bytes/sec) itself
// by diffing consecutive polls, so no rate state needs to be kept on the server.
async function getNetworkStats() {
  try {
    const { stdout } = await execPromise('cat /proc/net/dev');
    const osInterfaces = os.networkInterfaces();

    const lines = stdout.trim().split('\n').slice(2); // drop the two header lines
    return lines
      .map((line) => {
        const [ifaceRaw, statsRaw] = line.split(':');
        const name = ifaceRaw.trim();
        const fields = statsRaw.trim().split(/\s+/).map(Number);

        // /proc/net/dev columns (in order):
        // rx: bytes packets errs drop fifo frame compressed multicast
        // tx: bytes packets errs drop fifo colls carrier compressed
        const [
          rxBytes, rxPackets, rxErrors, rxDropped, , , , ,
          txBytes, txPackets, txErrors, txDropped
        ] = fields;

        const addresses = (osInterfaces[name] || [])
          .filter((addr) => !addr.internal)
          .map((addr) => ({ family: addr.family, address: addr.address }));

        return {
          name,
          addresses,
          rxBytes,
          rxPackets,
          rxErrors,
          rxDropped,
          txBytes,
          txPackets,
          txErrors,
          txDropped
        };
      })
      .filter((iface) => iface.name !== 'lo');
  } catch (error) {
    return [];
  }
}

async function getDiskUsage() {
  try {
    const { stdout } = await execPromise("df -h / | tail -1 | awk '{print $2, $3, $5}'");
    const [total, used, percent] = stdout.trim().split(' ');
    return { total, used, percent };
  } catch (error) {
    return { total: 'N/A', used: 'N/A', percent: 'N/A' };
  }
}

function getCPUUsage() {
  const cpus = os.cpus();
  return cpus.map((cpu, index) => {
    const total = Object.values(cpu.times).reduce((acc, time) => acc + time, 0);
    const idle = cpu.times.idle;
    const usage = ((total - idle) / total * 100).toFixed(1);
    return {
      core: index,
      model: cpu.model,
      usage: parseFloat(usage)
    };
  });
}

function getMemoryUsage() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  const usagePercent = (used / total * 100).toFixed(1);

  return {
    total: (total / (1024 ** 3)).toFixed(2),
    used: (used / (1024 ** 3)).toFixed(2),
    free: (free / (1024 ** 3)).toFixed(2),
    usagePercent: parseFloat(usagePercent)
  };
}

function getSystemInfo() {
  return {
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    uptime: os.uptime(),
    loadAverage: os.loadavg()
  };
}

export async function GET() {
  try {
    const [
      cpuTemp,
      diskUsage,
      throttledResult,
      coreVoltageResult,
      clockSpeedsResult,
      pm2Processes,
      cloudflaredStatus,
      webhookStatus,
      network
    ] = await Promise.all([
      getCPUTemperature(),
      getDiskUsage(),
      getThrottledStatus(),
      getCoreVoltage(),
      getClockSpeeds(),
      getPM2Processes(),
      getSystemdServiceStatus('cloudflared'),
      getSystemdServiceStatus('webhook'),
      getNetworkStats()
    ]);

    const stats = {
      timestamp: new Date().toISOString(),
      system: getSystemInfo(),
      cpu: {
        cores: getCPUUsage(),
        temperature: cpuTemp,
        loadAverage: os.loadavg()
      },
      memory: getMemoryUsage(),
      disk: diskUsage,
      network,
      health: {
        throttled: throttledResult.data,
        coreVoltage: coreVoltageResult.data,
        clockSpeeds: clockSpeedsResult.data,
        // Real error text (e.g. "vcgencmd: command not found" vs a
        // permission error) so the dashboard can tell you *why* a value is
        // missing instead of just showing N/A.
        diagnostics: {
          throttledError: throttledResult.error,
          coreVoltageError: coreVoltageResult.error,
          clockSpeedsError: clockSpeedsResult.error
        }
      },
      services: {
        systemd: [
          { name: 'cloudflared', label: 'Cloudflare Tunnel', status: cloudflaredStatus },
          { name: 'webhook', label: 'GitHub Webhook Listener', status: webhookStatus }
        ],
        pm2: pm2Processes
      }
    };

    return Response.json(stats);
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch system stats', details: error.message },
      { status: 500 }
    );
  }
}
