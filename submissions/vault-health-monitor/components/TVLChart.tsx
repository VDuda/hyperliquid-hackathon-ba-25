'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';

export function TVLChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['vault-history'],
    queryFn: () => fetch('/api/vault/history?days=7').then(r => r.json()),
    refetchInterval: 60_000, // Refresh every minute
  });

  if (isLoading || !data?.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>TVL History (7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            Loading chart data...
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.data.map((point: any) => ({
    date: new Date(point.timestamp).toLocaleDateString(),
    tvl: point.tvl,
    deposits: point.deposits,
    withdrawals: point.withdrawals,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>TVL History (7 Days)</CardTitle>
        <p className="text-sm text-muted-foreground">
          Total Value Locked over time with deposit and withdrawal activity
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              labelStyle={{ color: '#000' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="tvl" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="TVL"
              dot={{ r: 3 }}
            />
            <Line 
              type="monotone" 
              dataKey="deposits" 
              stroke="#10b981" 
              strokeWidth={1}
              name="Deposits"
              strokeDasharray="5 5"
            />
            <Line 
              type="monotone" 
              dataKey="withdrawals" 
              stroke="#ef4444" 
              strokeWidth={1}
              name="Withdrawals"
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
