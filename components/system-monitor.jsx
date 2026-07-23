'use client';

import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Clock } from 'lucide-react';
import OverviewTab from '@/components/stats/overview-tab';
import HealthTab from '@/components/stats/health-tab';
import TrendsTab from '@/components/stats/trends-tab';
import ServicesTab from '@/components/stats/services-tab';
import NetworkTab from '@/components/stats/network-tab';

const HISTORY_LIMIT = 40; // ~80s of history at a 2s poll interval

// Computes bytes/sec for each interface by diffing against the previous poll's
// cumulative counters. Counters reset to 0 on interface restart/reboot, so a
// negative delta is treated as "no data yet" rather than a huge negative rate.
function computeInterfaceRates(currentInterfaces, prevSnapshot, nowMs) {
  if (!prevSnapshot) return currentInterfaces.map((iface) => ({ ...iface, rxRate: null, txRate: null }));

  const dtSeconds = (nowMs - prevSnapshot.timestamp) / 1000;
  if (dtSeconds <= 0) return currentInterfaces.map((iface) => ({ ...iface, rxRate: null, txRate: null }));

  return currentInterfaces.map((iface) => {
    const prev = prevSnapshot.interfaces[iface.name];
    if (!prev) return { ...iface, rxRate: null, txRate: null };

    const rxDelta = iface.rxBytes - prev.rxBytes;
    const txDelta = iface.txBytes - prev.txBytes;

    return {
      ...iface,
      rxRate: rxDelta >= 0 ? rxDelta / dtSeconds : null,
      txRate: txDelta >= 0 ? txDelta / dtSeconds : null
    };
  });
}

export default function SystemMonitor() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [networkHistory, setNetworkHistory] = useState([]);
  const [networkInterfaces, setNetworkInterfaces] = useState([]);
  const prevNetworkRef = useRef(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        if (!response.ok) throw new Error('Failed to fetch stats');
        const data = await response.json();
        setStats(data);
        setError(null);

        const cpuAvg =
          data.cpu.cores.reduce((sum, core) => sum + core.usage, 0) / data.cpu.cores.length;

        const timeLabel = new Date(data.timestamp).toLocaleTimeString([], { hour12: false });

        setHistory((prev) => {
          const next = [
            ...prev,
            {
              time: timeLabel,
              cpuAvg: Number(cpuAvg.toFixed(1)),
              temp: parseFloat(data.cpu.temperature) || null,
              mem: data.memory.usagePercent
            }
          ];
          return next.length > HISTORY_LIMIT ? next.slice(next.length - HISTORY_LIMIT) : next;
        });

        // Network throughput is derived client-side by diffing cumulative
        // counters against the previous poll (the API only reports totals).
        const rawInterfaces = data.network || [];
        const nowMs = Date.now();
        const withRates = computeInterfaceRates(rawInterfaces, prevNetworkRef.current, nowMs);
        setNetworkInterfaces(withRates);

        prevNetworkRef.current = {
          timestamp: nowMs,
          interfaces: Object.fromEntries(
            rawInterfaces.map((iface) => [iface.name, { rxBytes: iface.rxBytes, txBytes: iface.txBytes }])
          )
        };

        const hasRates = withRates.some((iface) => iface.rxRate != null || iface.txRate != null);
        if (hasRates) {
          const totalRx = withRates.reduce((sum, iface) => sum + (iface.rxRate || 0), 0);
          const totalTx = withRates.reduce((sum, iface) => sum + (iface.txRate || 0), 0);

          setNetworkHistory((prev) => {
            const next = [
              ...prev,
              { time: timeLabel, rx: Number(totalRx.toFixed(0)), tx: Number(totalTx.toFixed(0)) }
            ];
            return next.length > HISTORY_LIMIT ? next.slice(next.length - HISTORY_LIMIT) : next;
          });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 2000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-pulse mx-auto mb-4" />
          <p className="text-lg">Loading system stats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">System Monitor</h1>
          <p className="text-muted-foreground mt-2">Real-time Raspberry Pi stats</p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Clock className="w-3 h-3 mr-1" />
          Updated: {new Date(stats.timestamp).toLocaleTimeString()}
        </Badge>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          {/* <TabsTrigger value="trends">Trends</TabsTrigger> */}
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab stats={stats} />
        </TabsContent>

        <TabsContent value="health">
          <HealthTab health={stats.health} />
        </TabsContent>

        <TabsContent value="trends">
          <TrendsTab history={history} />
        </TabsContent>

        <TabsContent value="network">
          <NetworkTab interfaces={networkInterfaces} history={networkHistory} />
        </TabsContent>

        <TabsContent value="services">
          <ServicesTab services={stats.services} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
