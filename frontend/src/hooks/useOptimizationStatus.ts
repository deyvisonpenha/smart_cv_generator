// React Hook for ActionCable WebSocket Real-time Updates
// Subscribes to OptimizationChannel for live optimization progress

import { useEffect, useState, useCallback } from 'react';
import { createConsumer, Cable, Subscription } from '@rails/actioncable';
import { tokenManager } from '@/lib/apiClient';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000/cable';

export interface OptimizationUpdate {
  id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  match_score: number | null;
  completion_percentage: number;
  progress?: number;
  error?: string;
  updated_at: string;
  cv?: {
    id: number;
    display_name: string;
  };
  job_description?: {
    id: number;
    title: string;
  };
}

interface UseOptimizationStatusReturn {
  status: string;
  progress: number;
  matchScore: number | null;
  error: string | null;
  isConnected: boolean;
  isSubscribed: boolean;
  update: OptimizationUpdate | null;
  requestStatus: () => void;
}

export function useOptimizationStatus(
  optimizationId: number | null,
  enabled: boolean = true
): UseOptimizationStatusReturn {
  const [status, setStatus] = useState<string>('pending');
  const [progress, setProgress] = useState<number>(0);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [update, setUpdate] = useState<OptimizationUpdate | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  const requestStatus = useCallback(() => {
    if (subscription) {
      subscription.perform('request_status');
    }
  }, [subscription]);

  useEffect(() => {
    if (!optimizationId || !enabled) {
      return;
    }

    const token = tokenManager.get();
    if (!token) {
      console.error('No JWT token found for WebSocket connection');
      setError('Authentication required');
      return;
    }

    console.log(`[WebSocket] Connecting to optimization ${optimizationId}...`);

    // Create WebSocket connection
    const cable: Cable = createConsumer(`${WS_URL}?token=${token}`);

    // Subscribe to optimization channel
    const sub = cable.subscriptions.create(
      {
        channel: 'OptimizationChannel',
        id: optimizationId,
      },
      {
        received(data: OptimizationUpdate) {
          console.log('[WebSocket] Received update:', data);

          setUpdate(data);
          setStatus(data.status);
          setProgress(data.progress || data.completion_percentage || 0);
          setMatchScore(data.match_score);

          if (data.error) {
            setError(data.error);
          }

          // Clear error on successful update
          if (data.status === 'completed' && error) {
            setError(null);
          }
        },

        connected() {
          console.log('[WebSocket] Connected to ActionCable');
          setIsConnected(true);
        },

        disconnected() {
          console.log('[WebSocket] Disconnected from ActionCable');
          setIsConnected(false);
          setIsSubscribed(false);
        },

        rejected() {
          console.error('[WebSocket] Subscription rejected (unauthorized)');
          setError('Unauthorized access to optimization');
          setIsSubscribed(false);
        },

        initialized() {
          console.log('[WebSocket] Subscription initialized');
          setIsSubscribed(true);
        },
      }
    );

    setSubscription(sub);

    // Cleanup on unmount
    return () => {
      console.log(`[WebSocket] Unsubscribing from optimization ${optimizationId}`);
      sub.unsubscribe();
      cable.disconnect();
      setIsConnected(false);
      setIsSubscribed(false);
      setSubscription(null);
    };
  }, [optimizationId, enabled, error]);

  return {
    status,
    progress,
    matchScore,
    error,
    isConnected,
    isSubscribed,
    update,
    requestStatus,
  };
}

// Hook for multiple optimizations
export function useMultipleOptimizations(
  optimizationIds: number[],
  enabled: boolean = true
) {
  const [updates, setUpdates] = useState<Record<number, OptimizationUpdate>>({});
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (!optimizationIds.length || !enabled) {
      return;
    }

    const token = tokenManager.get();
    if (!token) {
      console.error('No JWT token found for WebSocket connection');
      return;
    }

    console.log(`[WebSocket] Connecting to ${optimizationIds.length} optimizations...`);

    const cable: Cable = createConsumer(`${WS_URL}?token=${token}`);
    const subscriptions: Subscription[] = [];

    optimizationIds.forEach((id) => {
      const sub = cable.subscriptions.create(
        {
          channel: 'OptimizationChannel',
          id: id,
        },
        {
          received(data: OptimizationUpdate) {
            setUpdates((prev) => ({
              ...prev,
              [id]: data,
            }));
          },

          connected() {
            setIsConnected(true);
          },

          disconnected() {
            setIsConnected(false);
          },
        }
      );
      subscriptions.push(sub);
    });

    return () => {
      console.log(`[WebSocket] Unsubscribing from ${optimizationIds.length} optimizations`);
      subscriptions.forEach((sub) => sub.unsubscribe());
      cable.disconnect();
      setIsConnected(false);
    };
  }, [optimizationIds.join(','), enabled]);

  return {
    updates,
    isConnected,
  };
}

export default useOptimizationStatus;
