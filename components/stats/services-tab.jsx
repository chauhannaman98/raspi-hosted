import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Boxes, Radio, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';

function statusBadge(status) {
  const normalized = (status || 'unknown').toLowerCase();
  if (normalized === 'active' || normalized === 'online') {
    return (
      <Badge className="gap-1 bg-green-500 hover:bg-green-500/90">
        <CheckCircle2 className="w-3 h-3" />
        {status}
      </Badge>
    );
  }
  if (normalized === 'unknown') {
    return (
      <Badge variant="outline" className="gap-1">
        <HelpCircle className="w-3 h-3" />
        Unknown
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="gap-1">
      <XCircle className="w-3 h-3" />
      {status}
    </Badge>
  );
}

function formatDuration(ms) {
  if (ms == null) return 'N/A';
  const seconds = Math.floor(ms / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function ServicesTab({ services }) {
  const systemdServices = services?.systemd || [];
  const pm2Processes = services?.pm2 || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Radio className="w-5 h-5 mr-2" />
            System Services
          </CardTitle>
          <CardDescription>systemd units this deployment relies on</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {systemdServices.map((svc) => (
              <div key={svc.name} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{svc.label}</p>
                  <p className="text-xs text-muted-foreground">{svc.name}.service</p>
                </div>
                {statusBadge(svc.status)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Boxes className="w-5 h-5 mr-2" />
            PM2 Processes
          </CardTitle>
          <CardDescription>Node processes managed by PM2</CardDescription>
        </CardHeader>
        <CardContent>
          {pm2Processes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No PM2 processes found. Either PM2 isn&apos;t installed here, or nothing is currently running under
              it.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">CPU</TableHead>
                  <TableHead className="text-right">Memory</TableHead>
                  <TableHead className="text-right">Restarts</TableHead>
                  <TableHead className="text-right">Uptime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pm2Processes.map((proc) => (
                  <TableRow key={proc.name}>
                    <TableCell className="font-medium">{proc.name}</TableCell>
                    <TableCell>{statusBadge(proc.status)}</TableCell>
                    <TableCell className="text-right">{proc.cpu != null ? `${proc.cpu}%` : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      {proc.memoryMB != null ? `${proc.memoryMB} MB` : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">{proc.restarts ?? 'N/A'}</TableCell>
                    <TableCell className="text-right">{formatDuration(proc.uptimeMs)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
