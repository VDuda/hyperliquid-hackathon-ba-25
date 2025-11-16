'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign, Percent, Shield } from 'lucide-react';
import type { VaultState } from '@/lib/boring';

interface VaultOverviewProps {
  state?: VaultState;
}

export function VaultOverview({ state }: VaultOverviewProps) {
  if (!state) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vault Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Loading vault data...</div>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    {
      title: 'Total Value Locked',
      value: formatCurrency(state.tvlUsd),
      icon: DollarSign,
      trend: state.tvlUsd > 1000000 ? 'up' : 'down',
      trendValue: '+5.2%',
    },
    {
      title: 'Share Price',
      value: formatNumber(state.sharePrice),
      icon: TrendingUp,
      trend: state.sharePrice > 1 ? 'up' : 'down',
      trendValue: '+2.1%',
    },
    {
      title: 'Collateral Ratio',
      value: formatNumber(state.collateralRatio),
      icon: Shield,
      trend: state.collateralRatio > 1.5 ? 'up' : 'down',
      trendValue: state.collateralRatio > 1.5 ? 'Healthy' : 'Low',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vault Overview</CardTitle>
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date(state.timestamp).toLocaleTimeString()}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            const TrendIcon = metric.trend === 'up' ? TrendingUp : TrendingDown;
            const trendColor = metric.trend === 'up' ? 'text-green-600' : 'text-red-600';

            return (
              <div
                key={metric.title}
                className="flex flex-col space-y-2 rounded-lg border p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </span>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold">{metric.value}</span>
                  <div className={`flex items-center text-xs ${trendColor}`}>
                    <TrendIcon className="mr-1 h-3 w-3" />
                    {metric.trendValue}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          Block: #{state.block.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}
