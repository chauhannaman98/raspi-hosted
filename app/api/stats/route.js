import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function getCPUTemperature() {
  try {
    const { stdout } = await execPromise('cat /sys/class/thermal/thermal_zone0/temp');
    return (parseInt(stdout) / 1000).toFixed(1);
  } catch (error) {
    return 'N/A';
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
    const [cpuTemp, diskUsage] = await Promise.all([
      getCPUTemperature(),
      getDiskUsage()
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
      disk: diskUsage
    };

    return Response.json(stats);
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch system stats', details: error.message },
      { status: 500 }
    );
  }
}
