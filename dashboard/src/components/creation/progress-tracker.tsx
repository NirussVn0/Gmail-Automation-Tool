'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime, formatRelativeTime } from '@/lib/utils';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  PlayIcon,
  PauseIcon,
} from '@heroicons/react/24/outline';

interface CreationJob {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  progress: number;
  totalAccounts: number;
  completedAccounts: number;
  failedAccounts: number;
  startedAt?: Date;
  estimatedCompletion?: Date;
  logs: Array<{
    timestamp: Date;
    level: 'info' | 'warning' | 'error';
    message: string;
  }>;
}

interface ProgressTrackerProps {
  job: CreationJob;
}

export function ProgressTracker({ job }: ProgressTrackerProps) {
  const getStatusIcon = () => {
    switch (job.status) {
      case 'running':
        return <PlayIcon className="h-5 w-5 text-blue-600" />;
      case 'paused':
        return <PauseIcon className="h-5 w-5 text-yellow-600" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (job.status) {
      case 'running':
        return 'text-blue-600';
      case 'paused':
        return 'text-yellow-600';
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircleIcon className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />;
      default:
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
    }
  };

  const successRate = job.completedAccounts > 0 
    ? Math.round((job.completedAccounts / (job.completedAccounts + job.failedAccounts)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                {getStatusIcon()}
                <span>{job.name}</span>
              </CardTitle>
              <CardDescription>
                Job ID: {job.id}
              </CardDescription>
            </div>
            <div className={`text-sm font-medium capitalize ${getStatusColor()}`}>
              {job.status}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span>{job.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${job.progress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-foreground">{job.totalAccounts}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{job.completedAccounts}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{job.failedAccounts}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{successRate}%</div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
            </div>
          </div>

          {job.startedAt && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Started:</span>
                <div className="font-medium">{formatDateTime(job.startedAt)}</div>
                <div className="text-xs text-muted-foreground">
                  {formatRelativeTime(job.startedAt)}
                </div>
              </div>
              {job.estimatedCompletion && job.status === 'running' && (
                <div>
                  <span className="text-muted-foreground">Estimated completion:</span>
                  <div className="font-medium">{formatDateTime(job.estimatedCompletion)}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatRelativeTime(job.estimatedCompletion)}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            Real-time updates from the creation process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {job.logs.slice(-20).reverse().map((log, index) => (
              <div key={index} className="flex items-start space-x-3 text-sm">
                <div className="mt-0.5">
                  {getLogIcon(log.level)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-foreground">{log.message}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDateTime(log.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            {job.logs.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                No activity yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
