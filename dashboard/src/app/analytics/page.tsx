'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnalyticsCharts } from '@/components/analytics/analytics-charts';
import { MetricsGrid } from '@/components/analytics/metrics-grid';
import { PerformanceTable } from '@/components/analytics/performance-table';
import { formatNumber, formatPercentage } from '@/lib/utils';
import {
  CalendarIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface AnalyticsData {
  overview: {
    totalAccounts: number;
    successRate: number;
    avgCreationTime: number;
    activeJobs: number;
  };
  trends: {
    daily: Array<{ date: string; created: number; failed: number; success_rate: number }>;
    hourly: Array<{ hour: number; created: number; success_rate: number }>;
  };
  performance: {
    byProxy: Array<{ proxy: string; accounts: number; success_rate: number; avg_time: number }>;
    byService: Array<{ service: string; verifications: number; success_rate: number; cost: number }>;
  };
  jobs: Array<{
    id: string;
    name: string;
    status: string;
    created: number;
    failed: number;
    duration: number;
    started_at: string;
  }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData: AnalyticsData = {
        overview: {
          totalAccounts: 1247,
          successRate: 94.2,
          avgCreationTime: 45,
          activeJobs: 3,
        },
        trends: {
          daily: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            created: Math.floor(Math.random() * 100) + 50,
            failed: Math.floor(Math.random() * 10) + 2,
            success_rate: Math.random() * 10 + 90,
          })),
          hourly: Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            created: Math.floor(Math.random() * 20) + 5,
            success_rate: Math.random() * 15 + 85,
          })),
        },
        performance: {
          byProxy: [
            { proxy: '192.168.1.100', accounts: 156, success_rate: 96.2, avg_time: 42 },
            { proxy: '192.168.1.101', accounts: 143, success_rate: 94.8, avg_time: 38 },
            { proxy: '192.168.1.102', accounts: 128, success_rate: 91.4, avg_time: 51 },
          ],
          byService: [
            { service: 'TextVerified', verifications: 234, success_rate: 97.8, cost: 47.50 },
            { service: 'SMS-Activate', verifications: 189, success_rate: 95.2, cost: 38.20 },
          ],
        },
        jobs: [
          {
            id: 'job-001',
            name: 'Marketing Team Batch',
            status: 'completed',
            created: 50,
            failed: 2,
            duration: 1847,
            started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'job-002',
            name: 'Sales Team Accounts',
            status: 'running',
            created: 23,
            failed: 1,
            duration: 1200,
            started_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
          },
        ],
      };

      setData(mockData);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      const reportData = {
        generated_at: new Date().toISOString(),
        time_range: timeRange,
        ...data,
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  const timeRangeOptions = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground">Performance metrics and insights</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-muted-foreground">
          <ChartBarIcon className="mx-auto h-12 w-12 mb-4" />
          <p>Failed to load analytics data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">
            Performance metrics and insights for your Gmail automation
          </p>
        </div>
        
        <div className="flex space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {timeRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <Button variant="outline" onClick={handleExportReport}>
            <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      <MetricsGrid data={data.overview} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Creation Trends</CardTitle>
            <CardDescription>Daily account creation and success rates</CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyticsCharts data={data.trends} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
            <CardDescription>Latest account creation jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.jobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 border border-border rounded-md">
                  <div>
                    <div className="font-medium text-foreground">{job.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {job.created} created, {job.failed} failed
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      job.status === 'completed' ? 'text-green-600' : 
                      job.status === 'running' ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {job.status}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Math.floor(job.duration / 60)}m {job.duration % 60}s
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <PerformanceTable data={data.performance} />
    </div>
  );
}
