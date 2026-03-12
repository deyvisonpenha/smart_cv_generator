'use client';

import React, { useEffect } from 'react';
import { useOptimizationStatus } from '@/hooks/useOptimizationStatus';

interface OptimizationProgressProps {
  optimizationId: number;
  onComplete?: (matchScore: number | null) => void;
  onError?: (error: string) => void;
  autoRefresh?: boolean;
  showDetails?: boolean;
}

const statusConfig = {
  pending: {
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    progressColor: 'bg-yellow-500',
    icon: '⏳',
    label: 'Waiting in Queue',
    description: 'Your CV will be optimized shortly...',
  },
  processing: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    progressColor: 'bg-blue-500',
    icon: '⚙️',
    label: 'Processing',
    description: 'AI is analyzing your CV and job description...',
  },
  completed: {
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    progressColor: 'bg-green-500',
    icon: '✅',
    label: 'Completed',
    description: 'Your optimized CV is ready!',
  },
  failed: {
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    progressColor: 'bg-red-500',
    icon: '❌',
    label: 'Failed',
    description: 'Something went wrong. Please try again.',
  },
  cancelled: {
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    progressColor: 'bg-gray-500',
    icon: '🚫',
    label: 'Cancelled',
    description: 'Optimization was cancelled.',
  },
};

export function OptimizationProgress({
  optimizationId,
  onComplete,
  onError,
  autoRefresh = true,
  showDetails = true,
}: OptimizationProgressProps) {
  const {
    status,
    progress,
    matchScore,
    error,
    isConnected,
    isSubscribed,
    update,
    requestStatus,
  } = useOptimizationStatus(optimizationId, autoRefresh);

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

  // Handle completion
  useEffect(() => {
    if (status === 'completed' && onComplete) {
      onComplete(matchScore);
    }
  }, [status, matchScore, onComplete]);

  // Handle errors
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Get match score color
  const getMatchScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get match score label
  const getMatchScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };

  return (
    <div className={`w-full rounded-lg border-2 ${config.borderColor} ${config.bgColor} shadow-lg overflow-hidden`}>
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl" role="img" aria-label={config.label}>
              {config.icon}
            </span>
            <div>
              <h3 className={`text-lg font-semibold ${config.color}`}>
                {config.label}
              </h3>
              <p className="text-sm text-gray-600">
                Optimization #{optimizationId}
              </p>
            </div>
          </div>

          {/* Match Score Badge */}
          {matchScore !== null && (
            <div className="text-right">
              <div className={`text-3xl font-bold ${getMatchScoreColor(matchScore)}`}>
                {matchScore}%
              </div>
              <div className="text-xs text-gray-500">
                {getMatchScoreLabel(matchScore)}
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="relative w-full h-6 bg-gray-200 rounded-full overflow-hidden mb-4">
          <div
            className={`absolute h-full ${config.progressColor} transition-all duration-500 ease-out`}
            style={{ width: `${progress}%` }}
          >
            {/* Animated gradient for processing state */}
            {status === 'processing' && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" />
            )}
          </div>
          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
            {progress}%
          </div>
        </div>

        {/* Status Description */}
        <p className="text-sm text-gray-600 text-center mb-3">
          {config.description}
        </p>

        {/* Connection Status */}
        {showDetails && (
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                } ${isConnected ? 'animate-pulse' : ''}`}
              />
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            {isSubscribed && (
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span>Live Updates</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="border-t-2 border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-2">
            <span className="text-red-600 text-xl">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Additional Details */}
      {showDetails && update && (
        <div className="border-t-2 border-gray-200 bg-white p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {update.cv && (
              <div>
                <p className="text-gray-500 text-xs">CV</p>
                <p className="font-medium text-gray-800 truncate">
                  {update.cv.display_name}
                </p>
              </div>
            )}
            {update.job_description && (
              <div>
                <p className="text-gray-500 text-xs">Job Position</p>
                <p className="font-medium text-gray-800 truncate">
                  {update.job_description.title}
                </p>
              </div>
            )}
            {update.updated_at && (
              <div className="col-span-2">
                <p className="text-gray-500 text-xs">Last Updated</p>
                <p className="font-medium text-gray-800">
                  {new Date(update.updated_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Manual Refresh Button */}
          {!autoRefresh && (
            <button
              onClick={requestStatus}
              className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Refresh Status
            </button>
          )}
        </div>
      )}

      {/* Processing Animation */}
      {status === 'processing' && (
        <div className="border-t-2 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 p-4">
          <div className="flex items-center justify-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm text-blue-700 font-medium">
              Analyzing your resume...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default OptimizationProgress;
