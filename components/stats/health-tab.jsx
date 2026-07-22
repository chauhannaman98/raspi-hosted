import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Gauge, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';

const FLAG_LABELS = {
  undervoltageNow: 'Under-voltage detected',
  freqCappedNow: 'ARM frequency capped',
  throttledNow: 'CPU currently throttled',
  tempLimitNow: 'Soft temperature limit active',
  undervoltageOccurred: 'Under-voltage has occurred',
  freqCappedOccurred: 'Frequency capping has occurred',
  throttledOccurred: 'Throttling has occurred',
  tempLimitOccurred: 'Soft temp limit has been hit'
};

function FlagRow({ label, tripped }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      {tripped ? (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="w-3 h-3" />
          Yes
        </Badge>
      ) : (
        <Badge variant="secondary" className="gap-1">
          <CheckCircle2 className="w-3 h-3" />
          No
        </Badge>
      )}
    </div>
  );
}

export default function HealthTab({ health }) {
  const { throttled, coreVoltage, clockSpeeds } = health || {};
  const vcgencmdAvailable = !!throttled;

  const anyIssueNow =
    throttled &&
    (throttled.undervoltageNow || throttled.freqCappedNow || throttled.throttledNow || throttled.tempLimitNow);

  return (
    <div className="space-y-6">
      {!vcgencmdAvailable && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              <code className="text-xs bg-muted px-1 py-0.5 rounded">vcgencmd</code> isn&apos;t available on this
              system, so under-voltage/throttling, core voltage, and clock speed can&apos;t be read. These
              diagnostics only work when running directly on a Raspberry Pi.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Power Status</CardTitle>
            <ShieldAlert className={`h-4 w-4 ${anyIssueNow ? 'text-red-500' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {!vcgencmdAvailable ? 'N/A' : anyIssueNow ? 'Issue Detected' : 'Healthy'}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {vcgencmdAvailable ? `Raw: ${throttled.raw}` : 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Core Voltage</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {coreVoltage != null ? `${coreVoltage.toFixed(4)}V` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Nominal core rail voltage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clock Speeds</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">ARM:</span>
                <span className="text-sm font-medium">
                  {clockSpeeds?.armMHz != null ? `${clockSpeeds.armMHz} MHz` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">GPU/Core:</span>
                <span className="text-sm font-medium">
                  {clockSpeeds?.gpuMHz != null ? `${clockSpeeds.gpuMHz} MHz` : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {vcgencmdAvailable && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Status</CardTitle>
              <CardDescription>Live power/thermal condition right now</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              <FlagRow label={FLAG_LABELS.undervoltageNow} tripped={throttled.undervoltageNow} />
              <FlagRow label={FLAG_LABELS.freqCappedNow} tripped={throttled.freqCappedNow} />
              <FlagRow label={FLAG_LABELS.throttledNow} tripped={throttled.throttledNow} />
              <FlagRow label={FLAG_LABELS.tempLimitNow} tripped={throttled.tempLimitNow} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Since Boot</CardTitle>
              <CardDescription>Whether these issues have ever occurred</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              <FlagRow label={FLAG_LABELS.undervoltageOccurred} tripped={throttled.undervoltageOccurred} />
              <FlagRow label={FLAG_LABELS.freqCappedOccurred} tripped={throttled.freqCappedOccurred} />
              <FlagRow label={FLAG_LABELS.throttledOccurred} tripped={throttled.throttledOccurred} />
              <FlagRow label={FLAG_LABELS.tempLimitOccurred} tripped={throttled.tempLimitOccurred} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
