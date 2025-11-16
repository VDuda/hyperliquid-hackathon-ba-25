'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle, CheckCircle, Loader2, TrendingUp } from 'lucide-react';
import type { YieldOpportunity } from '@/lib/gluex';
import { formatCurrency } from '@/lib/utils';

interface OptimizeModalProps {
  open: boolean;
  onClose: () => void;
  opportunity: YieldOpportunity | null;
  currentTvl?: number;
  onExecute: (calldata: `0x${string}`, targetVault: `0x${string}`) => Promise<void>;
}

export function OptimizeModal({
  open,
  onClose,
  opportunity,
  currentTvl = 0,
  onExecute,
}: OptimizeModalProps) {
  const [loading, setLoading] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [route, setRoute] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [percentage, setPercentage] = useState(20);

  // Prepare transaction when modal opens
  useEffect(() => {
    if (open && opportunity) {
      prepareTransaction();
    }
  }, [open, opportunity, percentage]);

  const prepareTransaction = async () => {
    setPreparing(true);
    setError(null);

    try {
      const res = await fetch(`/api/execute/prepare?percentage=${percentage}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to prepare transaction');
      }

      setRoute(data.route);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPreparing(false);
    }
  };

  const handleExecute = async () => {
    if (!route || !opportunity) return;

    setLoading(true);
    setError(null);

    try {
      await onExecute(route.calldata, opportunity.vaultAddress as `0x${string}`);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const rebalanceAmount = currentTvl * (percentage / 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Optimize Vault Allocation</CardTitle>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Opportunity Details */}
          {opportunity && (
            <div className="rounded-lg border bg-blue-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">{opportunity.strategy}</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Protocol</p>
                  <p className="font-medium">{opportunity.protocol}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">APY</p>
                  <p className="font-semibold text-green-600">
                    {opportunity.apy.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Risk Level</p>
                  <p className="font-medium capitalize">{opportunity.risk}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">TVL</p>
                  <p className="font-medium">{formatCurrency(opportunity.tvl)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Rebalance Amount Slider */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Rebalance Amount: {percentage}% ({formatCurrency(rebalanceAmount)})
            </label>
            <input
              type="range"
              min="10"
              max="50"
              step="5"
              value={percentage}
              onChange={(e) => setPercentage(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>10%</span>
              <span>50%</span>
            </div>
          </div>

          {/* Route Simulation */}
          {preparing && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Simulating transaction...
            </div>
          )}

          {route && !preparing && (
            <div className="space-y-3 rounded-lg border p-4">
              <h4 className="font-medium">Transaction Preview</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expected APY Gain</span>
                  <span className="font-semibold text-green-600">
                    +{route.quote.apyGain.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated Gas</span>
                  <span>{route.quote.estimatedGas.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Slippage Tolerance</span>
                  <span>{route.quote.slippage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Simulation Status</span>
                  <span className="flex items-center gap-1">
                    {route.simulation.success ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">Success</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-red-600">Failed</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {route.quote.route && route.quote.route.length > 0 && (
                <div className="mt-3 border-t pt-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Route Path:
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    {route.quote.route.map((step: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="rounded bg-gray-100 px-2 py-1">{step}</span>
                        {idx < route.quote.route.length - 1 && (
                          <span className="text-muted-foreground">→</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Warning */}
          <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p>
              This will rebalance {percentage}% of vault assets to the selected strategy.
              Ensure you understand the risks before proceeding.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleExecute}
              disabled={loading || preparing || !route || !!error}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executing...
                </>
              ) : (
                'Sign & Execute'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
