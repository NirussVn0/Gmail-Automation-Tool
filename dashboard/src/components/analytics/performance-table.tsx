'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';

interface PerformanceTableProps {
  data: {
    byProxy: Array<{ proxy: string; accounts: number; success_rate: number; avg_time: number }>;
    byService: Array<{ service: string; verifications: number; success_rate: number; cost: number }>;
  };
}

export function PerformanceTable({ data }: PerformanceTableProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Proxy Performance</CardTitle>
          <CardDescription>Performance metrics by proxy server</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-sm font-medium text-muted-foreground">Proxy</th>
                  <th className="text-right py-2 text-sm font-medium text-muted-foreground">Accounts</th>
                  <th className="text-right py-2 text-sm font-medium text-muted-foreground">Success Rate</th>
                  <th className="text-right py-2 text-sm font-medium text-muted-foreground">Avg Time</th>
                </tr>
              </thead>
              <tbody>
                {data.byProxy.map((proxy, index) => (
                  <tr key={index} className="border-b border-border last:border-b-0">
                    <td className="py-3 text-sm text-foreground font-medium">{proxy.proxy}</td>
                    <td className="py-3 text-sm text-foreground text-right">{formatNumber(proxy.accounts)}</td>
                    <td className="py-3 text-right">
                      <span className={`text-sm font-medium ${
                        proxy.success_rate >= 95 ? 'text-green-600' :
                        proxy.success_rate >= 90 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {proxy.success_rate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 text-sm text-foreground text-right">{proxy.avg_time}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SMS Service Performance</CardTitle>
          <CardDescription>Performance metrics by SMS verification service</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-sm font-medium text-muted-foreground">Service</th>
                  <th className="text-right py-2 text-sm font-medium text-muted-foreground">Verifications</th>
                  <th className="text-right py-2 text-sm font-medium text-muted-foreground">Success Rate</th>
                  <th className="text-right py-2 text-sm font-medium text-muted-foreground">Cost</th>
                </tr>
              </thead>
              <tbody>
                {data.byService.map((service, index) => (
                  <tr key={index} className="border-b border-border last:border-b-0">
                    <td className="py-3 text-sm text-foreground font-medium">{service.service}</td>
                    <td className="py-3 text-sm text-foreground text-right">{formatNumber(service.verifications)}</td>
                    <td className="py-3 text-right">
                      <span className={`text-sm font-medium ${
                        service.success_rate >= 95 ? 'text-green-600' :
                        service.success_rate >= 90 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {service.success_rate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 text-sm text-foreground text-right">${service.cost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
