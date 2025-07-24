'use client';

import { SmsConfig } from '@/types/domain';
import { EyeIcon, EyeSlashIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface SmsSettingsProps {
  config: SmsConfig;
  onChange: (updates: Partial<SmsConfig>) => void;
}

export function SmsSettings({ config, onChange }: SmsSettingsProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showBackupApiKey, setShowBackupApiKey] = useState(false);

  const smsServices = [
    { value: 'textverified', label: 'TextVerified', description: 'Reliable SMS verification service' },
    { value: 'smsactivate', label: 'SMS-Activate', description: 'Global SMS verification platform' },
    { value: 'receivesms', label: 'ReceiveSMS', description: 'Fast SMS reception service' },
    { value: 'custom', label: 'Custom API', description: 'Use your own SMS API endpoint' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Primary SMS Service
        </label>
        <select
          value={config.servicePrimary}
          onChange={(e) => onChange({ servicePrimary: e.target.value })}
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {smsServices.map((service) => (
            <option key={service.value} value={service.value}>
              {service.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground mt-1">
          {smsServices.find(s => s.value === config.servicePrimary)?.description}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Primary API Key
        </label>
        <div className="relative">
          <input
            type={showApiKey ? 'text' : 'password'}
            value={config.serviceApiKey}
            onChange={(e) => onChange({ serviceApiKey: e.target.value })}
            className="w-full px-3 py-2 pr-10 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Enter your API key"
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showApiKey ? (
              <EyeSlashIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <h3 className="text-lg font-medium text-foreground mb-4">Backup Service (Optional)</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Backup SMS Service
            </label>
            <select
              value={config.serviceBackup || ''}
              onChange={(e) => onChange({ serviceBackup: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">None</option>
              {smsServices.map((service) => (
                <option key={service.value} value={service.value}>
                  {service.label}
                </option>
              ))}
            </select>
          </div>

          {config.serviceBackup && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Backup API Key
              </label>
              <div className="relative">
                <input
                  type={showBackupApiKey ? 'text' : 'password'}
                  value={config.serviceBackupApiKey || ''}
                  onChange={(e) => onChange({ serviceBackupApiKey: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter backup API key"
                />
                <button
                  type="button"
                  onClick={() => setShowBackupApiKey(!showBackupApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showBackupApiKey ? (
                    <EyeSlashIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <h3 className="text-lg font-medium text-foreground mb-4">Service Status</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border border-border rounded-md">
            <div>
              <div className="font-medium text-foreground">Primary Service</div>
              <div className="text-sm text-muted-foreground">{config.servicePrimary}</div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-sm text-green-600">Connected</span>
            </div>
          </div>

          {config.serviceBackup && (
            <div className="flex items-center justify-between p-3 border border-border rounded-md">
              <div>
                <div className="font-medium text-foreground">Backup Service</div>
                <div className="text-sm text-muted-foreground">{config.serviceBackup}</div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm text-green-600">Connected</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-start space-x-2 p-4 bg-yellow-50 dark:bg-yellow-950 rounded-md">
        <InformationCircleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
        <div className="text-sm text-yellow-800 dark:text-yellow-200">
          <p className="font-medium mb-1">SMS Verification Notes:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>SMS verification is required for Gmail account creation</li>
            <li>Backup service will be used if primary service fails</li>
            <li>Keep API keys secure and rotate them regularly</li>
            <li>Monitor your SMS service balance and usage limits</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
