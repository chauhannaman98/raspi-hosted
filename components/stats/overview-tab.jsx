import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SimpleProgress } from '@/components/simple-progress';
import { Badge } from '@/components/ui/badge';
import { Cpu, HardDrive, MemoryStick, Thermometer, Server } from 'lucide-react';

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}

function getTempColor(temp) {
  const tempNum = parseFloat(temp);
  if (isNaN(tempNum)) return 'bg-gray-500';
  if (tempNum < 60) return 'bg-green-500';
  if (tempNum < 75) return 'bg-yellow-500';
  return 'bg-red-500';
}

export default function OverviewTab({ stats }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Info</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Hostname:</span>
                <span className="text-sm font-medium">{stats.system.hostname}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Platform:</span>
                <span className="text-sm font-medium">{stats.system.platform}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Architecture:</span>
                <span className="text-sm font-medium">{stats.system.arch}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Uptime:</span>
                <span className="text-sm font-medium">{formatUptime(stats.system.uptime)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Temperature</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.cpu.temperature}°C</div>
            <div className="mt-4">
              <div className={`h-2 rounded-full ${getTempColor(stats.cpu.temperature)}`}
                   style={{ width: `${Math.min((parseFloat(stats.cpu.temperature) / 85) * 100, 100)}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Load Avg: {stats.cpu.loadAverage.map((l) => l.toFixed(2)).join(', ')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.memory.usagePercent}%</div>
            <SimpleProgress value={Number(stats.memory.usagePercent)} className="mt-4" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.memory.used} GB / {stats.memory.total} GB used
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Cpu className="w-5 h-5 mr-2" />
            CPU Cores
          </CardTitle>
          <CardDescription>Per-core CPU usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {stats.cpu.cores.map((core) => (
              <div key={core.core} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Core {core.core}</span>
                  <Badge variant={core.usage > 80 ? 'destructive' : 'secondary'}>
                    {core.usage}%
                  </Badge>
                </div>
                <SimpleProgress value={Number(core.usage)} />
                <p className="text-xs text-muted-foreground truncate">{core.model}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <HardDrive className="w-5 h-5 mr-2" />
            Disk Usage
          </CardTitle>
          <CardDescription>Root filesystem usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stats.disk.percent}</p>
                <p className="text-sm text-muted-foreground">
                  {stats.disk.used} / {stats.disk.total}
                </p>
              </div>
            </div>
            <SimpleProgress value={Number(parseFloat(stats.disk.percent))} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
