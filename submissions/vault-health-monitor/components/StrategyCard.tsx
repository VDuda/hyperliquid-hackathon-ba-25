'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import type { HedgingStrategy } from '@/lib/gluex';

interface StrategyCardProps {
  strategies: HedgingStrategy[];
}

export function StrategyCard({ strategies }: StrategyCardProps) {
  if (!strategies || strategies.length === 0) {
    return null;
  }

  const getStrategyIcon = (type: HedgingStrategy['type']) => {
    switch (type) {
      case 'long':
        return TrendingUp;
      case 'short':
        return TrendingDown;
      case 'neutral':
        return Minus;
      default:
        return TrendingUp;
    }
  };

  const getStrategyColor = (type: HedgingStrategy['type']) => {
    switch (type) {
      case 'long':
        return 'text-green-600 bg-green-50';
      case 'short':
        return 'text-red-600 bg-red-50';
      case 'neutral':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskColor = (risk: string) => {
    const riskLower = risk.toLowerCase();
    if (riskLower === 'low') return 'text-green-600';
    if (riskLower === 'medium') return 'text-yellow-600';
    if (riskLower === 'high') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <Card id="strategies">
      <CardHeader>
        <CardTitle>Recommended Hedging Strategies</CardTitle>
        <p className="text-sm text-muted-foreground">
          GlueX-powered yield optimization opportunities
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {strategies.map((strategy) => {
          const Icon = getStrategyIcon(strategy.type);
          const colorClass = getStrategyColor(strategy.type);
          const riskColor = getRiskColor(strategy.risk);

          return (
            <div
              key={strategy.id}
              className="rounded-lg border p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`rounded-full p-2 ${colorClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold capitalize">
                        {strategy.type}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {strategy.asset}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {strategy.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="font-medium">
                        Expected Return:{' '}
                        <span className="text-green-600">
                          {strategy.expectedReturn.toFixed(2)}%
                        </span>
                      </span>
                      <span className="font-medium">
                        Risk:{' '}
                        <span className={riskColor}>{strategy.risk}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <ExternalLink className="mr-1 h-3 w-3" />
                  View
                </Button>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <span>Target Vault:</span>
                <code className="rounded bg-muted px-1 py-0.5 font-mono">
                  {strategy.targetVault.slice(0, 10)}...
                </code>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
