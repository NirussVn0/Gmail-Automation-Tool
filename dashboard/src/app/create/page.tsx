'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreationForm } from '@/components/creation/creation-form';
import { ProgressTracker } from '@/components/creation/progress-tracker';
import { CreationConfiguration } from '@/types/domain';
import { toast } from '@/components/ui/toaster';
import { ArrowLeftIcon, PlayIcon, PauseIcon, StopIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

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

export default function CreateAccountsPage() {
  const [currentJob, setCurrentJob] = useState<CreationJob | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleStartCreation = async (config: CreationConfiguration, accountCount: number) => {
    try {
      setIsCreating(true);
      
      const newJob: CreationJob = {
        id: `job-${Date.now()}`,
        name: config.baseName || 'Unnamed Job',
        status: 'running',
        progress: 0,
        totalAccounts: accountCount,
        completedAccounts: 0,
        failedAccounts: 0,
        startedAt: new Date(),
        logs: [{
          timestamp: new Date(),
          level: 'info',
          message: `Started creation of ${accountCount} accounts`
        }]
      };

      setCurrentJob(newJob);
      toast.success('Job started', `Creating ${accountCount} Gmail accounts`);

      simulateCreationProgress(newJob);
    } catch (error) {
      toast.error('Failed to start creation', (error as Error).message);
      setIsCreating(false);
    }
  };

  const simulateCreationProgress = (job: CreationJob) => {
    const interval = setInterval(() => {
      setCurrentJob(prev => {
        if (!prev || prev.status !== 'running') {
          clearInterval(interval);
          return prev;
        }

        const newCompleted = Math.min(
          prev.completedAccounts + Math.floor(Math.random() * 3) + 1,
          prev.totalAccounts
        );
        
        const newFailed = Math.random() > 0.9 ? prev.failedAccounts + 1 : prev.failedAccounts;
        const progress = Math.round((newCompleted / prev.totalAccounts) * 100);

        const newLog = {
          timestamp: new Date(),
          level: Math.random() > 0.95 ? 'error' : 'info' as const,
          message: Math.random() > 0.95 
            ? `Failed to create account user${newCompleted}@gmail.com`
            : `Successfully created account user${newCompleted}@gmail.com`
        };

        const updatedJob = {
          ...prev,
          progress,
          completedAccounts: newCompleted,
          failedAccounts: newFailed,
          logs: [...prev.logs.slice(-50), newLog],
          status: newCompleted >= prev.totalAccounts ? 'completed' as const : prev.status,
          estimatedCompletion: newCompleted < prev.totalAccounts 
            ? new Date(Date.now() + ((prev.totalAccounts - newCompleted) * 2000))
            : undefined
        };

        if (updatedJob.status === 'completed') {
          clearInterval(interval);
          setIsCreating(false);
          toast.success('Job completed', `Created ${newCompleted} accounts successfully`);
        }

        return updatedJob;
      });
    }, 2000);
  };

  const handlePauseJob = () => {
    setCurrentJob(prev => prev ? { ...prev, status: 'paused' } : null);
    toast.info('Job paused', 'Account creation has been paused');
  };

  const handleResumeJob = () => {
    if (currentJob) {
      setCurrentJob(prev => prev ? { ...prev, status: 'running' } : null);
      simulateCreationProgress(currentJob);
      toast.info('Job resumed', 'Account creation has been resumed');
    }
  };

  const handleStopJob = () => {
    setCurrentJob(prev => prev ? { ...prev, status: 'failed' } : null);
    setIsCreating(false);
    toast.warning('Job stopped', 'Account creation has been stopped');
  };

  const handleNewJob = () => {
    setCurrentJob(null);
    setIsCreating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/accounts">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Accounts
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Create Gmail Accounts</h1>
            <p className="text-muted-foreground">
              Configure and start batch Gmail account creation
            </p>
          </div>
        </div>
        
        {currentJob && (
          <div className="flex space-x-2">
            {currentJob.status === 'running' && (
              <Button variant="outline" onClick={handlePauseJob}>
                <PauseIcon className="mr-2 h-4 w-4" />
                Pause
              </Button>
            )}
            {currentJob.status === 'paused' && (
              <Button onClick={handleResumeJob}>
                <PlayIcon className="mr-2 h-4 w-4" />
                Resume
              </Button>
            )}
            {(currentJob.status === 'running' || currentJob.status === 'paused') && (
              <Button variant="destructive" onClick={handleStopJob}>
                <StopIcon className="mr-2 h-4 w-4" />
                Stop
              </Button>
            )}
            {(currentJob.status === 'completed' || currentJob.status === 'failed') && (
              <Button onClick={handleNewJob}>
                New Job
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>
                Set up your account creation parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreationForm
                onSubmit={handleStartCreation}
                disabled={isCreating}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {currentJob ? (
            <ProgressTracker job={currentJob} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Ready to Start</CardTitle>
                <CardDescription>
                  Configure your settings and click "Start Creation" to begin
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-muted-foreground">
                  <PlayIcon className="mx-auto h-12 w-12 mb-4" />
                  <p>No active creation job</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
