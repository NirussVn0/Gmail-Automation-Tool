'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface AnalyticsChartsProps {
  data: {
    daily: Array<{ date: string; created: number; failed: number; success_rate: number }>;
    hourly: Array<{ hour: number; created: number; success_rate: number }>;
  };
}

export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  const [chartType, setChartType] = useState<'daily' | 'hourly'>('daily');

  const renderDailyChart = () => {
    const maxCreated = Math.max(...data.daily.map(d => d.created));
    
    return (
      <div className="space-y-4">
        <div className="flex space-x-2">
          <Button
            variant={chartType === 'daily' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('daily')}
          >
            Daily
          </Button>
          <Button
            variant={chartType === 'hourly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('hourly')}
          >
            Hourly
          </Button>
        </div>
        
        <div className="h-64 flex items-end space-x-2">
          {data.daily.map((day, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t relative" style={{ height: '200px' }}>
                <div
                  className="bg-green-500 rounded-t absolute bottom-0 w-full transition-all duration-300"
                  style={{ height: `${(day.created / maxCreated) * 180}px` }}
                  title={`${day.created} accounts created`}
                />
                {day.failed > 0 && (
                  <div
                    className="bg-red-500 absolute bottom-0 w-full"
                    style={{ height: `${(day.failed / maxCreated) * 180}px` }}
                    title={`${day.failed} accounts failed`}
                  />
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-2 text-center">
                <div>{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                <div className="font-medium">{day.created}</div>
                <div className="text-green-600">{day.success_rate.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex items-center justify-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Created</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Failed</span>
          </div>
        </div>
      </div>
    );
  };

  const renderHourlyChart = () => {
    const maxCreated = Math.max(...data.hourly.map(h => h.created));
    
    return (
      <div className="space-y-4">
        <div className="flex space-x-2">
          <Button
            variant={chartType === 'daily' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('daily')}
          >
            Daily
          </Button>
          <Button
            variant={chartType === 'hourly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('hourly')}
          >
            Hourly
          </Button>
        </div>
        
        <div className="h-64 flex items-end space-x-1">
          {data.hourly.map((hour, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t relative" style={{ height: '200px' }}>
                <div
                  className="bg-blue-500 rounded-t absolute bottom-0 w-full transition-all duration-300"
                  style={{ height: `${(hour.created / maxCreated) * 180}px` }}
                  title={`${hour.created} accounts created at ${hour.hour}:00`}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-2 text-center">
                <div>{hour.hour}:00</div>
                <div className="font-medium">{hour.created}</div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex items-center justify-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Accounts Created</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {chartType === 'daily' ? renderDailyChart() : renderHourlyChart()}
    </div>
  );
}
