'use client';

import { Button } from '@/components/ui/button';
import { ProxyConfig } from '@/types/domain';
import { InformationCircleIcon, PlusIcon } from '@heroicons/react/24/outline';

interface ProxySettingsProps {
  config: ProxyConfig;
  onChange: (updates: Partial<ProxyConfig>) => void;
}

export function ProxySettings({ config, onChange }: ProxySettingsProps) {
  const rotationStrategies = [
    { value: 'round_robin', label: 'Round Robin', description: 'Cycle through proxies in order' },
    { value: 'random', label: 'Random', description: 'Select proxies randomly' },
    { value: 'weighted', label: 'Weighted', description: 'Select based on proxy weights' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="proxyEnabled"
          checked={config.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          className="rounded border-gray-300 text-primary focus:ring-primary"
        />
        <label htmlFor="proxyEnabled" className="text-sm font-medium text-foreground">
          Enable Proxy Rotation
        </label>
      </div>

      {config.enabled && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Rotation Strategy
            </label>
            <select
              value={config.rotationStrategy}
              onChange={(e) => onChange({ rotationStrategy: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {rotationStrategies.map((strategy) => (
                <option key={strategy.value} value={strategy.value}>
                  {strategy.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              {rotationStrategies.find(s => s.value === config.rotationStrategy)?.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Health Check Interval (seconds)
              </label>
              <input
                type="number"
                min="60"
                max="3600"
                value={config.healthCheckInterval}
                onChange={(e) => onChange({ healthCheckInterval: parseInt(e.target.value) || 300 })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Timeout (seconds)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={config.timeout}
                onChange={(e) => onChange({ timeout: parseInt(e.target.value) || 30 })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Max Retries
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={config.maxRetries}
                onChange={(e) => onChange({ maxRetries: parseInt(e.target.value) || 3 })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-foreground">Proxy List</h3>
              <Button size="sm">
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Proxy
              </Button>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="col-span-3">Host</div>
                <div className="col-span-1">Port</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Usage</div>
                <div className="col-span-2">Actions</div>
              </div>

              <div className="space-y-2">
                {[
                  { host: '192.168.1.100', port: 8080, type: 'HTTP', status: 'Healthy', usage: '3/10' },
                  { host: '192.168.1.101', port: 8080, type: 'SOCKS5', status: 'Healthy', usage: '5/10' },
                  { host: '192.168.1.102', port: 8080, type: 'HTTP', status: 'Unhealthy', usage: '0/10' },
                ].map((proxy, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center py-2 border border-border rounded-md px-3">
                    <div className="col-span-3 text-sm text-foreground">{proxy.host}</div>
                    <div className="col-span-1 text-sm text-foreground">{proxy.port}</div>
                    <div className="col-span-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        {proxy.type}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        proxy.status === 'Healthy' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {proxy.status}
                      </span>
                    </div>
                    <div className="col-span-2 text-sm text-foreground">{proxy.usage}</div>
                    <div className="col-span-2">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-2 p-4 bg-blue-50 dark:bg-blue-950 rounded-md">
            <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Proxy Configuration Tips:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Use high-quality residential proxies for better success rates</li>
                <li>Rotate proxies frequently to avoid detection</li>
                <li>Monitor proxy health and remove unhealthy proxies</li>
                <li>Consider geographic distribution for better performance</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
