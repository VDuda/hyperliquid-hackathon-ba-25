'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, ExternalLink, Zap } from 'lucide-react';
import type { YieldOpportunity } from '@/lib/gluex';

interface YieldRankingProps {
  opportunities: YieldOpportunity[];
  onOptimize: (opp: YieldOpportunity) => void;
  currentApy?: number;
}

export function YieldRanking({ opportunities, onOptimize, currentApy = 0 }: YieldRankingProps) {
  if (!opportunities || opportunities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top GlueX Yield Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No yield opportunities available at the moment.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low':
        return 'text-green-600 bg-green-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'high':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Top GlueX Yield Opportunities</span>
          <span className="text-sm font-normal text-muted-foreground">
            Whitelisted vaults only
          </span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Highest APY opportunities from GlueX Yields API
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                  Strategy
                </th>
                <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                  Protocol
                </th>
                <th className="pb-3 text-right text-sm font-medium text-muted-foreground">
                  APY
                </th>
                <th className="pb-3 text-right text-sm font-medium text-muted-foreground">
                  Gain vs Current
                </th>
                <th className="pb-3 text-center text-sm font-medium text-muted-foreground">
                  Risk
                </th>
                <th className="pb-3 text-right text-sm font-medium text-muted-foreground">
                  TVL
                </th>
                <th className="pb-3 text-right text-sm font-medium text-muted-foreground">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((opp, idx) => {
                const gain = opp.apy - currentApy;
                const gainColor = gain > 0 ? 'text-green-600' : 'text-gray-600';

                return (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="font-medium">{opp.strategy}</p>
                          <p className="text-xs text-muted-foreground">
                            {opp.asset}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-sm">{opp.protocol}</td>
                    <td className="py-4 text-right">
                      <span className="font-semibold text-blue-600">
                        {opp.apy.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <span className={`font-medium ${gainColor}`}>
                        {gain > 0 ? '+' : ''}
                        {gain.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getRiskColor(
                          opp.risk
                        )}`}
                      >
                        {opp.risk}
                      </span>
                    </td>
                    <td className="py-4 text-right text-sm text-muted-foreground">
                      ${(opp.tvl / 1_000_000).toFixed(2)}M
                    </td>
                    <td className="py-4 text-right">
                      <Button
                        size="sm"
                        onClick={() => onOptimize(opp)}
                        className="gap-1"
                      >
                        <Zap className="h-3 w-3" />
                        Optimize
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile view */}
        <div className="mt-4 space-y-3 md:hidden">
          {opportunities.map((opp, idx) => {
            const gain = opp.apy - currentApy;
            const gainColor = gain > 0 ? 'text-green-600' : 'text-gray-600';

            return (
              <div key={idx} className="rounded-lg border p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <p className="font-medium">{opp.strategy}</p>
                    <p className="text-sm text-muted-foreground">{opp.protocol}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${getRiskColor(
                      opp.risk
                    )}`}
                  >
                    {opp.risk}
                  </span>
                </div>
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">APY:</span>
                  <span className="font-semibold text-blue-600">
                    {opp.apy.toFixed(2)}%
                  </span>
                </div>
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Gain:</span>
                  <span className={`font-medium ${gainColor}`}>
                    {gain > 0 ? '+' : ''}
                    {gain.toFixed(2)}%
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={() => onOptimize(opp)}
                  className="w-full gap-1"
                >
                  <Zap className="h-3 w-3" />
                  Optimize Now
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
