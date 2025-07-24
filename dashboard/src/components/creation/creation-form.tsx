'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreationConfiguration, WebDriverConfiguration } from '@/types/domain';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface CreationFormProps {
  onSubmit: (config: CreationConfiguration, accountCount: number) => void;
  disabled?: boolean;
}

export function CreationForm({ onSubmit, disabled }: CreationFormProps) {
  const [config, setConfig] = useState<CreationConfiguration>({
    baseName: 'user',
    startingId: 1,
    batchSize: 5,
    delayMin: 2,
    delayMax: 8,
    useProxy: true,
    proxyRotation: true,
    enableSmsVerification: false,
    webDriverConfig: {
      headless: true,
      windowWidth: 1920,
      windowHeight: 1080,
      pageLoadTimeout: 30,
      implicitWait: 10,
      userAgentRotation: true,
      disableImages: true,
      disableJavaScript: false,
    },
  });

  const [accountCount, setAccountCount] = useState(10);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!config.baseName.trim()) {
      newErrors.baseName = 'Base name is required';
    } else if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(config.baseName)) {
      newErrors.baseName = 'Base name must start with a letter and contain only letters and numbers';
    }

    if (config.startingId < 1) {
      newErrors.startingId = 'Starting ID must be at least 1';
    }

    if (config.batchSize < 1 || config.batchSize > 20) {
      newErrors.batchSize = 'Batch size must be between 1 and 20';
    }

    if (config.delayMin < 0 || config.delayMax < config.delayMin) {
      newErrors.delay = 'Invalid delay configuration';
    }

    if (accountCount < 1 || accountCount > 100) {
      newErrors.accountCount = 'Account count must be between 1 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(config, accountCount);
    }
  };

  const updateConfig = (updates: Partial<CreationConfiguration>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const updateWebDriverConfig = (updates: Partial<WebDriverConfiguration>) => {
    setConfig(prev => ({
      ...prev,
      webDriverConfig: { ...prev.webDriverConfig, ...updates }
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground">Basic Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Base Name
            </label>
            <input
              type="text"
              value={config.baseName}
              onChange={(e) => updateConfig({ baseName: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g., user, test, demo"
              disabled={disabled}
            />
            {errors.baseName && (
              <p className="text-sm text-destructive mt-1">{errors.baseName}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Accounts will be named: {config.baseName}1@gmail.com, {config.baseName}2@gmail.com, etc.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Starting ID
            </label>
            <input
              type="number"
              min="1"
              value={config.startingId}
              onChange={(e) => updateConfig({ startingId: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={disabled}
            />
            {errors.startingId && (
              <p className="text-sm text-destructive mt-1">{errors.startingId}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Account Count
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={accountCount}
              onChange={(e) => setAccountCount(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={disabled}
            />
            {errors.accountCount && (
              <p className="text-sm text-destructive mt-1">{errors.accountCount}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Batch Size
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={config.batchSize}
              onChange={(e) => updateConfig({ batchSize: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={disabled}
            />
            {errors.batchSize && (
              <p className="text-sm text-destructive mt-1">{errors.batchSize}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Delay Range (seconds)
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                min="0"
                step="0.1"
                value={config.delayMin}
                onChange={(e) => updateConfig({ delayMin: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Min"
                disabled={disabled}
              />
              <input
                type="number"
                min="0"
                step="0.1"
                value={config.delayMax}
                onChange={(e) => updateConfig({ delayMax: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Max"
                disabled={disabled}
              />
            </div>
            {errors.delay && (
              <p className="text-sm text-destructive mt-1">{errors.delay}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground">Proxy & Verification</h3>
        
        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={config.useProxy}
              onChange={(e) => updateConfig({ useProxy: e.target.checked })}
              className="rounded border-gray-300 text-primary focus:ring-primary"
              disabled={disabled}
            />
            <span className="text-sm text-foreground">Use Proxy Rotation</span>
          </label>

          {config.useProxy && (
            <label className="flex items-center space-x-2 ml-6">
              <input
                type="checkbox"
                checked={config.proxyRotation}
                onChange={(e) => updateConfig({ proxyRotation: e.target.checked })}
                className="rounded border-gray-300 text-primary focus:ring-primary"
                disabled={disabled}
              />
              <span className="text-sm text-foreground">Enable Automatic Rotation</span>
            </label>
          )}

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={config.enableSmsVerification}
              onChange={(e) => updateConfig({ enableSmsVerification: e.target.checked })}
              className="rounded border-gray-300 text-primary focus:ring-primary"
              disabled={disabled}
            />
            <span className="text-sm text-foreground">Enable SMS Verification</span>
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground">WebDriver Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={config.webDriverConfig.headless}
              onChange={(e) => updateWebDriverConfig({ headless: e.target.checked })}
              className="rounded border-gray-300 text-primary focus:ring-primary"
              disabled={disabled}
            />
            <span className="text-sm text-foreground">Headless Mode</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={config.webDriverConfig.userAgentRotation}
              onChange={(e) => updateWebDriverConfig({ userAgentRotation: e.target.checked })}
              className="rounded border-gray-300 text-primary focus:ring-primary"
              disabled={disabled}
            />
            <span className="text-sm text-foreground">Rotate User Agents</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={config.webDriverConfig.disableImages}
              onChange={(e) => updateWebDriverConfig({ disableImages: e.target.checked })}
              className="rounded border-gray-300 text-primary focus:ring-primary"
              disabled={disabled}
            />
            <span className="text-sm text-foreground">Disable Images</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={!config.webDriverConfig.disableJavaScript}
              onChange={(e) => updateWebDriverConfig({ disableJavaScript: !e.target.checked })}
              className="rounded border-gray-300 text-primary focus:ring-primary"
              disabled={disabled}
            />
            <span className="text-sm text-foreground">Enable JavaScript</span>
          </label>
        </div>
      </div>

      <div className="flex items-center space-x-2 p-4 bg-blue-50 dark:bg-blue-950 rounded-md">
        <InformationCircleIcon className="h-5 w-5 text-blue-600" />
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Estimated time: {Math.ceil((accountCount * (config.delayMin + config.delayMax) / 2) / 60)} minutes
        </p>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={disabled}
        loading={disabled}
      >
        Start Creation
      </Button>
    </form>
  );
}
