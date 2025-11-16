'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTimestamp } from '@/lib/utils';
import { AlertTriangle, TrendingDown, Activity, Bell } from 'lucide-react';
import type { Alert } from '@/lib/store';

interface AlertFeedProps {
  alerts: Alert[];
}

export function AlertFeed({ alerts }: AlertFeedProps) {
  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'TVL_DROP':
        return TrendingDown;
      case 'COLLATERAL_LOW':
        return AlertTriangle;
      case 'HIGH_VOLATILITY':
        return Activity;
      default:
        return Bell;
    }
  };

  const getAlertColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Alert Feed</span>
          <span className="text-sm font-normal text-muted-foreground">
            {alerts.length} alerts
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Bell className="mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">No alerts yet</p>
            <p className="text-xs">System is monitoring vault health</p>
          </div>
        ) : (
          <div className="max-h-[600px] space-y-2 overflow-y-auto">
            {alerts.map((alert) => {
              const Icon = getAlertIcon(alert.type);
              const colorClass = getAlertColor(alert.severity);

              return (
                <div
                  key={alert.id}
                  className={`rounded-lg border p-3 ${colorClass} ${
                    alert.read ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{alert.message}</p>
                      <p className="text-xs opacity-75">
                        {formatTimestamp(alert.timestamp)}
                      </p>
                      {alert.strategies && alert.strategies.length > 0 && (
                        <p className="text-xs font-medium">
                          {alert.strategies.length} hedging strategies available
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
