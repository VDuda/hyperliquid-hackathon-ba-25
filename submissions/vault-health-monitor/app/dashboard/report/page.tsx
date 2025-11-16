'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TVLChart } from '@/components/TVLChart';
import { useAlertStore } from '@/lib/store';
import { formatCurrency, formatTimestamp } from '@/lib/utils';
import { Download, ArrowLeft, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import Link from 'next/link';

export default function ReportPage() {
  const { alerts } = useAlertStore();

  const { data: historyData } = useQuery({
    queryKey: ['vault-history-30'],
    queryFn: () => fetch('/api/vault/history?days=30').then(r => r.json()),
  });

  const { data: currentState } = useQuery({
    queryKey: ['vault'],
    queryFn: () => fetch('/api/vault/state').then(r => r.json()),
  });

  // Calculate summary stats
  const calculateStats = () => {
    if (!historyData?.data || historyData.data.length === 0) {
      return { totalDeposits: 0, totalWithdrawals: 0, netFlow: 0, avgTvl: 0 };
    }

    const data = historyData.data;
    const totalDeposits = data.reduce((sum: number, d: any) => sum + d.deposits, 0);
    const totalWithdrawals = data.reduce((sum: number, d: any) => sum + d.withdrawals, 0);
    const netFlow = totalDeposits - totalWithdrawals;
    const avgTvl = data.reduce((sum: number, d: any) => sum + d.tvl, 0) / data.length;

    return { totalDeposits, totalWithdrawals, netFlow, avgTvl };
  };

  const stats = calculateStats();

  // Get recent alerts (last 7 days)
  const recentAlerts = alerts.filter(
    a => a.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000
  );

  const handleExport = () => {
    // In production, implement PDF/PNG export using html2canvas or similar
    alert('Export functionality would generate a PDF/PNG report here');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="mb-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-4xl font-bold text-gray-900">Weekly Report</h1>
            <p className="mt-2 text-gray-600">
              Comprehensive vault health analysis
            </p>
          </div>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Current TVL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentState ? formatCurrency(currentState.tvlUsd) : '...'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Deposits (30d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-2xl font-bold text-green-600">
                <TrendingUp className="mr-2 h-5 w-5" />
                {formatCurrency(stats.totalDeposits)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Withdrawals (30d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-2xl font-bold text-red-600">
                <TrendingDown className="mr-2 h-5 w-5" />
                {formatCurrency(stats.totalWithdrawals)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Net Flow (30d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-2xl font-bold">
                <Activity className="mr-2 h-5 w-5" />
                {formatCurrency(stats.netFlow)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* TVL Chart */}
        <div className="mb-6">
          <TVLChart />
        </div>

        {/* Alerts Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Alert History (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {recentAlerts.length === 0 ? (
              <p className="text-muted-foreground">No alerts in the last 7 days</p>
            ) : (
              <div className="space-y-3">
                {recentAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className="flex items-start justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatTimestamp(alert.timestamp)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        alert.severity === 'high'
                          ? 'bg-red-100 text-red-700'
                          : alert.severity === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  Monitor collateral ratio closely - currently at{' '}
                  {currentState?.collateralRatio.toFixed(2) || 'N/A'}
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  Consider rebalancing if TVL volatility exceeds 15% over 24h period
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  Review GlueX hedging strategies for yield optimization opportunities
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
