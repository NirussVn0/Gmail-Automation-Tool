'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AccountStatistics } from '@/repositories/gmail-account-repository';
import { AccountStatus } from '@/types/domain';
import { formatNumber, formatPercentage } from '@/lib/utils';
import {
  UserGroupIcon,
  PlusCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface DashboardStats {
  totalAccounts: number;
  activeAccounts: number;
  pendingAccounts: number;
  failedAccounts: number;
  successRate: number;
  createdToday: number;
  recentActivity: Array<{
    id: string;
    type: 'account_created' | 'job_completed' | 'proxy_added';
    message: string;
    timestamp: Date;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalAccounts: 0,
    activeAccounts: 0,
    pendingAccounts: 0,
    failedAccounts: 0,
    successRate: 0,
    createdToday: 0,
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const mockStats: DashboardStats = {
        totalAccounts: 1247,
        activeAccounts: 1156,
        pendingAccounts: 23,
        failedAccounts: 68,
        successRate: 92.7,
        createdToday: 15,
        recentActivity: [
          {
            id: '1',
            type: 'account_created',
            message: '5 new Gmail accounts created successfully',
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
          },
          {
            id: '2',
            type: 'job_completed',
            message: 'Batch creation job "Marketing Team" completed',
            timestamp: new Date(Date.now() - 15 * 60 * 1000),
          },
          {
            id: '3',
            type: 'proxy_added',
            message: '3 new proxies added to rotation pool',
            timestamp: new Date(Date.now() - 30 * 60 * 1000),
          },
        ],
      };

      setStats(mockStats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Accounts',
      value: formatNumber(stats.totalAccounts),
      description: `${stats.createdToday} created today`,
      icon: UserGroupIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      title: 'Active Accounts',
      value: formatNumber(stats.activeAccounts),
      description: formatPercentage(stats.activeAccounts, stats.totalAccounts),
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    {
      title: 'Pending',
      value: formatNumber(stats.pendingAccounts),
      description: 'Currently processing',
      icon: ClockIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    },
    {
      title: 'Success Rate',
      value: `${stats.successRate}%`,
      description: 'Last 30 days',
      icon: ChartBarIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'account_created':
        return <PlusCircleIcon className="h-4 w-4 text-green-600" />;
      case 'job_completed':
        return <CheckCircleIcon className="h-4 w-4 text-blue-600" />;
      case 'proxy_added':
        return <UserGroupIcon className="h-4 w-4 text-purple-600" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your Gmail automation system
          </p>
        </div>
        <div className="flex space-x-2">
          <Button asChild>
            <Link href="/create">
              <PlusCircleIcon className="mr-2 h-4 w-4" />
              Create Accounts
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <Card key={index} className="transition-all hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {card.value}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {card.description}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${card.bgColor}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates from your automation system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      {activity.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <Button variant="ghost" size="sm" className="w-full">
                View all activity
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start">
              <Link href="/create">
                <PlusCircleIcon className="mr-2 h-4 w-4" />
                Create New Accounts
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/accounts">
                <UserGroupIcon className="mr-2 h-4 w-4" />
                Manage Accounts
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/analytics">
                <ChartBarIcon className="mr-2 h-4 w-4" />
                View Analytics
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/config">
                <ExclamationTriangleIcon className="mr-2 h-4 w-4" />
                System Configuration
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
