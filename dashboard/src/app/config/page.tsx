'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProxySettings } from '@/components/config/proxy-settings';
import { SmsSettings } from '@/components/config/sms-settings';
import { WebDriverSettings } from '@/components/config/webdriver-settings';
import { SecuritySettings } from '@/components/config/security-settings';
import { SystemConfiguration } from '@/types/domain';
import { toast } from '@/components/ui/toaster';
import {
  ServerIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  ShieldCheckIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

const configSections = [
  {
    id: 'proxy',
    name: 'Proxy Settings',
    description: 'Configure proxy rotation and health checking',
    icon: ServerIcon,
  },
  {
    id: 'sms',
    name: 'SMS Verification',
    description: 'Set up SMS verification services',
    icon: DevicePhoneMobileIcon,
  },
  {
    id: 'webdriver',
    name: 'WebDriver',
    description: 'Configure browser automation settings',
    icon: ComputerDesktopIcon,
  },
  {
    id: 'security',
    name: 'Security',
    description: 'Manage security and encryption settings',
    icon: ShieldCheckIcon,
  },
];

export default function ConfigurationPage() {
  const [activeSection, setActiveSection] = useState('proxy');
  const [config, setConfig] = useState<SystemConfiguration>({
    security: {
      secretKey: '',
      encryptionKey: '',
      passwordSalt: '',
      jwtAlgorithm: 'HS256',
      jwtExpirationHours: 24,
    },
    database: {
      url: 'sqlite:///./gmail_automation.db',
      echo: false,
      poolSize: 10,
      maxOverflow: 20,
    },
    proxy: {
      enabled: true,
      rotationStrategy: 'round_robin',
      healthCheckInterval: 300,
      timeout: 30,
      maxRetries: 3,
    },
    sms: {
      servicePrimary: 'textverified',
      serviceApiKey: '',
      serviceBackup: '',
      serviceBackupApiKey: '',
    },
    webDriver: {
      headless: true,
      windowWidth: 1920,
      windowHeight: 1080,
      pageLoadTimeout: 30,
      implicitWait: 10,
      userAgentRotation: true,
      disableImages: true,
      disableJavaScript: false,
    },
    logging: {
      level: 'INFO',
      format: '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
      filePath: 'logs/gmail_automation.log',
      maxFileSize: 10485760,
      backupCount: 5,
    },
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleConfigChange = (section: keyof SystemConfiguration, updates: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setHasChanges(false);
      toast.success('Configuration saved', 'All settings have been updated successfully');
    } catch (error) {
      toast.error('Failed to save configuration', (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig({
      security: {
        secretKey: '',
        encryptionKey: '',
        passwordSalt: '',
        jwtAlgorithm: 'HS256',
        jwtExpirationHours: 24,
      },
      database: {
        url: 'sqlite:///./gmail_automation.db',
        echo: false,
        poolSize: 10,
        maxOverflow: 20,
      },
      proxy: {
        enabled: true,
        rotationStrategy: 'round_robin',
        healthCheckInterval: 300,
        timeout: 30,
        maxRetries: 3,
      },
      sms: {
        servicePrimary: 'textverified',
        serviceApiKey: '',
        serviceBackup: '',
        serviceBackupApiKey: '',
      },
      webDriver: {
        headless: true,
        windowWidth: 1920,
        windowHeight: 1080,
        pageLoadTimeout: 30,
        implicitWait: 10,
        userAgentRotation: true,
        disableImages: true,
        disableJavaScript: false,
      },
      logging: {
        level: 'INFO',
        format: '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        filePath: 'logs/gmail_automation.log',
        maxFileSize: 10485760,
        backupCount: 5,
      },
    });
    setHasChanges(false);
    toast.info('Configuration reset', 'All settings have been reset to defaults');
  };

  const renderConfigSection = () => {
    switch (activeSection) {
      case 'proxy':
        return (
          <ProxySettings
            config={config.proxy}
            onChange={(updates) => handleConfigChange('proxy', updates)}
          />
        );
      case 'sms':
        return (
          <SmsSettings
            config={config.sms}
            onChange={(updates) => handleConfigChange('sms', updates)}
          />
        );
      case 'webdriver':
        return (
          <WebDriverSettings
            config={config.webDriver}
            onChange={(updates) => handleConfigChange('webDriver', updates)}
          />
        );
      case 'security':
        return (
          <SecuritySettings
            config={config.security}
            onChange={(updates) => handleConfigChange('security', updates)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">System Configuration</h1>
          <p className="text-muted-foreground">
            Configure system settings and preferences
          </p>
        </div>
        
        {hasChanges && (
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button onClick={handleSave} loading={saving}>
              <CheckIcon className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="space-y-2">
          {configSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full text-left p-4 rounded-lg border transition-colors ${
                activeSection === section.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-card-foreground border-border hover:bg-accent'
              }`}
            >
              <div className="flex items-center space-x-3">
                <section.icon className="h-5 w-5" />
                <div>
                  <div className="font-medium">{section.name}</div>
                  <div className="text-sm opacity-70">{section.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>
                {configSections.find(s => s.id === activeSection)?.name}
              </CardTitle>
              <CardDescription>
                {configSections.find(s => s.id === activeSection)?.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderConfigSection()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
