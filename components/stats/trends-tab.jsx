import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

function TrendChart({ data, dataKey, unit, color, domain }) {
  if (data.length < 2) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
        Collecting data...
      </div>
    );
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="time" tick={{ fontSize: 11 }} minTickGap={30} />
          <YAxis tick={{ fontSize: 11 }} domain={domain} unit={unit} width={45} />
          <Tooltip
            formatter={(value) => [`${value}${unit}`, undefined]}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function TrendsTab({ history }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            CPU Usage (avg. across cores)
          </CardTitle>
          <CardDescription>Last {history.length} readings</CardDescription>
        </CardHeader>
        <CardContent>
          <TrendChart data={history} dataKey="cpuAvg" unit="%" color="#3b82f6" domain={[0, 100]} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            CPU Temperature
          </CardTitle>
          <CardDescription>Last {history.length} readings</CardDescription>
        </CardHeader>
        <CardContent>
          <TrendChart data={history} dataKey="temp" unit="°C" color="#f97316" domain={['auto', 'auto']} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Memory Usage
          </CardTitle>
          <CardDescription>Last {history.length} readings</CardDescription>
        </CardHeader>
        <CardContent>
          <TrendChart data={history} dataKey="mem" unit="%" color="#22c55e" domain={[0, 100]} />
        </CardContent>
      </Card>
    </div>
  );
}
