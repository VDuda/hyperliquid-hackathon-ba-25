import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HedgingStrategy } from './gluex';

export interface Alert {
  id: number;
  type: 'TVL_DROP' | 'COLLATERAL_LOW' | 'HIGH_VOLATILITY' | 'REBALANCE_NEEDED';
  severity: 'low' | 'medium' | 'high';
  message: string;
  strategies?: HedgingStrategy[];
  timestamp: number;
  read?: boolean;
}

interface AlertStore {
  alerts: Alert[];
  addAlert: (alert: Alert) => void;
  markAsRead: (id: number) => void;
  clearAlerts: () => void;
  getUnreadCount: () => number;
}

export const useAlertStore = create<AlertStore>()(
  persist(
    (set, get) => ({
      alerts: [],
      
      addAlert: (alert) => {
        set((state) => ({
          alerts: [alert, ...state.alerts].slice(0, 100), // Keep last 100 alerts
        }));
      },
      
      markAsRead: (id) => {
        set((state) => ({
          alerts: state.alerts.map((alert) =>
            alert.id === id ? { ...alert, read: true } : alert
          ),
        }));
      },
      
      clearAlerts: () => {
        set({ alerts: [] });
      },
      
      getUnreadCount: () => {
        return get().alerts.filter((alert) => !alert.read).length;
      },
    }),
    {
      name: 'vault-alerts-storage',
    }
  )
);

// In-memory cache for recent vault states (for anomaly detection)
let recentStates: Array<{ tvlUsd: number; timestamp: number }> = [];

export function addRecentState(tvlUsd: number) {
  const now = Date.now();
  recentStates.push({ tvlUsd, timestamp: now });
  
  // Keep only last hour of data
  const oneHourAgo = now - 3600000;
  recentStates = recentStates.filter(s => s.timestamp > oneHourAgo);
}

export function getRecentStates() {
  return recentStates;
}

export function clearRecentStates() {
  recentStates = [];
}
