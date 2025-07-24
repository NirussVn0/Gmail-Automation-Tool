'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';
import {
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';

interface MetricsGridProps {
  data: {
    totalAccounts: number;
    successRate: number;
    avgCreationTime: number;
    activeJobs: number;
  };
}

export function MetricsGrid({ data }: MetricsGridProps) {
  const metrics = [
    {
      title: 'Total Accounts',
      value: formatNumber(data.totalAccounts),
      description: 'All time',
      icon: UserGroupIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      title: 'Success Rate',
      value: `${data.successRate.toFixed(1)}%`,
      description: 'Last 30 days',
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    {
      title: 'Avg Creation Time',
      value: `${data.avgCreationTime}s`,
      description: 'Per account',
      icon: ClockIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    },
    {
      title: 'Active Jobs',
      value: data.activeJobs.toString(),
      description: 'Currently running',
      icon: PlayIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <Card key={index} className="transition-all hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {metric.value}
                </p>
                <p className="text-xs text-muted-foreground">
                  {metric.description}
                </p>
              </div>
              <div className={`p-3 rounded-full ${metric.bgColor}`}>
                <metric.icon className={`h-6 w-6 ${metric.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
