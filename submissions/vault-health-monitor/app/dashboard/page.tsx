'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAlertStore } from '@/lib/store';
import { VaultOverview } from '@/components/VaultOverview';
import { TVLChart } from '@/components/TVLChart';
import { AlertFeed } from '@/components/AlertFeed';
import { StrategyCard } from '@/components/StrategyCard';
import { YieldRanking } from '@/components/YieldRanking';
import { OptimizeModal } from '@/components/OptimizeModal';
import { Button } from '@/components/ui/button';
import { FileText, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import type { YieldOpportunity } from '@/lib/gluex';

export default function Dashboard() {
  const { alerts, addAlert } = useAlertStore();
  const [showModal, setShowModal] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState<YieldOpportunity | null>(null);

  // Poll vault state every 20 seconds
  const { data: state, refetch: refetchState } = useQuery({
    queryKey: ['vault'],
    queryFn: () => fetch('/api/vault/state').then(r => r.json()),
    refetchInterval: 20_000,
  });

  // Check for anomalies every 60 seconds
  const { data: anomaly, refetch: refetchAnomaly } = useQuery({
    queryKey: ['anomaly'],
    queryFn: () => fetch('/api/anomaly/check').then(r => r.json()),
    refetchInterval: 60_000,
  });

  // Fetch yield opportunities
  const { data: yields, refetch: refetchYields } = useQuery({
    queryKey: ['yields'],
    queryFn: () => fetch('/api/gluex/yields?inputToken=USDC&currentApy=8.5').then(r => r.json()),
    refetchInterval: 120_000, // Every 2 minutes
  });

  // Handle new anomalies
  useEffect(() => {
    if (anomaly?.type && !alerts.find(a => a.id === anomaly.id)) {
      addAlert(anomaly);
      toast.error(anomaly.message, {
        duration: 15000,
        action: anomaly.strategies?.length
          ? {
              label: 'View Strategies',
              onClick: () => {
                document.getElementById('strategies')?.scrollIntoView({
                  behavior: 'smooth',
                });
              },
            }
          : undefined,
      });
    }
  }, [anomaly, alerts, addAlert]);

  const handleOptimize = (opp: YieldOpportunity) => {
    setSelectedOpp(opp);
    setShowModal(true);
  };

  const handleExecute = async (calldata: `0x${string}`, targetVault: `0x${string}`) => {
    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetVault, calldata }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`Rebalance executed! Tx: ${data.hash?.slice(0, 10)}...`);
        setShowModal(false);
        // Refresh data
        refetchState();
        refetchAnomaly();
        refetchYields();
      } else {
        toast.error(data.message || 'Execution failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Transaction failed');
    }
  };

  const handleRefresh = () => {
    refetchState();
    refetchAnomaly();
    refetchYields();
    toast.success('Data refreshed');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Vault Health Monitor Pro
            </h1>
            <p className="mt-2 text-gray-600">
              Real-time monitoring with GlueX yield optimization
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Link href="/dashboard/report">
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                View Report
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Main Content */}
          <div className="space-y-6 lg:col-span-2">
            <VaultOverview state={state} />
            <TVLChart />
            
            {/* Yield Opportunities */}
            {yields?.topOpportunities && yields.topOpportunities.length > 0 && (
              <YieldRanking
                opportunities={yields.topOpportunities}
                onOptimize={handleOptimize}
                currentApy={8.5}
              />
            )}

            {/* Legacy Strategy Cards (from anomaly detection) */}
            {anomaly?.strategies && anomaly.strategies.length > 0 && (
              <StrategyCard strategies={anomaly.strategies} />
            )}
          </div>

          {/* Right Column - Alert Feed */}
          <div className="lg:col-span-1">
            <AlertFeed alerts={alerts.slice(-20)} />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Powered by{' '}
            <a
              href="https://lavanet.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 hover:underline"
            >
              Lava Network
            </a>
            {' & '}
            <a
              href="https://gluex.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 hover:underline"
            >
              GlueX
            </a>
          </p>
        </div>
      </div>

      {/* Optimize Modal */}
      <OptimizeModal
        open={showModal}
        onClose={() => setShowModal(false)}
        opportunity={selectedOpp}
        currentTvl={state?.tvlUsd || 0}
        onExecute={handleExecute}
      />
    </div>
  );
}
