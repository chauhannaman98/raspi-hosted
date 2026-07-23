import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowDown, ArrowUp, Wifi } from 'lucide-react';

function formatBytesPerSec(bytesPerSec) {
  if (bytesPerSec == null || Number.isNaN(bytesPerSec)) return 'N/A';
  const abs = Math.abs(bytesPerSec);
  if (abs < 1024) return `${bytesPerSec.toFixed(0)} B/s`;
  if (abs < 1024 ** 2) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
  return `${(bytesPerSec / 1024 ** 2).toFixed(2)} MB/s`;
}

function formatBytesTotal(bytes) {
  if (bytes == null || Number.isNaN(bytes)) return 'N/A';
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function ThroughputChart({ data }) {
  if (data.length < 2) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
        Collecting data...
      </div>
    );
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={150} debounce={50}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="time" tick={{ fontSize: 11 }} minTickGap={30} />
          <YAxis
            tick={{ fontSize: 11 }}
            width={55}
            tickFormatter={(v) => formatBytesPerSec(v)}
          />
          <Tooltip
            formatter={(value, name) => [formatBytesPerSec(value), name]}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Line type="monotone" dataKey="rx" name="Download" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="tx" name="Upload" stroke="#a855f7" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function NetworkTab({ interfaces, history }) {
  console.log(history);
  const hasInterfaces = interfaces && interfaces.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wifi className="w-5 h-5 mr-2" />
            Throughput
          </CardTitle>
          <CardDescription>Combined upload/download rate across all interfaces</CardDescription>
        </CardHeader>
        <CardContent>
          <ThroughputChart data={history} />
        </CardContent>
      </Card>

      {!hasInterfaces && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">No network interfaces found.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {interfaces.map((iface) => (
          <Card key={iface.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{iface.name}</CardTitle>
              <div className="flex gap-2">
                {iface.addresses.map((addr) => (
                  <Badge key={addr.address} variant="outline" className="text-xs font-mono">
                    {addr.address}
                  </Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ArrowDown className="w-3 h-3 text-blue-500" />
                    Download
                  </div>
                  <p className="text-lg font-semibold">{formatBytesPerSec(iface.rxRate)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytesTotal(iface.rxBytes)} total · {iface.rxPackets ?? 0} pkts
                    {iface.rxErrors > 0 || iface.rxDropped > 0
                      ? ` · ${iface.rxErrors ?? 0} err / ${iface.rxDropped ?? 0} drop`
                      : ''}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ArrowUp className="w-3 h-3 text-purple-500" />
                    Upload
                  </div>
                  <p className="text-lg font-semibold">{formatBytesPerSec(iface.txRate)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytesTotal(iface.txBytes)} total · {iface.txPackets ?? 0} pkts
                    {iface.txErrors > 0 || iface.txDropped > 0
                      ? ` · ${iface.txErrors ?? 0} err / ${iface.txDropped ?? 0} drop`
                      : ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
