'use client';

import { WebDriverConfig } from '@/types/domain';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface WebDriverSettingsProps {
  config: WebDriverConfig;
  onChange: (updates: Partial<WebDriverConfig>) => void;
}

export function WebDriverSettings({ config, onChange }: WebDriverSettingsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Window Width
          </label>
          <input
            type="number"
            min="800"
            max="3840"
            value={config.windowWidth}
            onChange={(e) => onChange({ windowWidth: parseInt(e.target.value) || 1920 })}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Window Height
          </label>
          <input
            type="number"
            min="600"
            max="2160"
            value={config.windowHeight}
            onChange={(e) => onChange({ windowHeight: parseInt(e.target.value) || 1080 })}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Page Load Timeout (seconds)
          </label>
          <input
            type="number"
            min="5"
            max="120"
            value={config.pageLoadTimeout}
            onChange={(e) => onChange({ pageLoadTimeout: parseInt(e.target.value) || 30 })}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Implicit Wait (seconds)
          </label>
          <input
            type="number"
            min="1"
            max="60"
            value={config.implicitWait}
            onChange={(e) => onChange({ implicitWait: parseInt(e.target.value) || 10 })}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-medium text-foreground">Browser Options</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={config.headless}
              onChange={(e) => onChange({ headless: e.target.checked })}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <div>
              <span className="text-sm font-medium text-foreground">Headless Mode</span>
              <p className="text-xs text-muted-foreground">Run browser without GUI for better performance</p>
            </div>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={config.userAgentRotation}
              onChange={(e) => onChange({ userAgentRotation: e.target.checked })}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <div>
              <span className="text-sm font-medium text-foreground">User Agent Rotation</span>
              <p className="text-xs text-muted-foreground">Rotate user agents to avoid detection</p>
            </div>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={config.disableImages}
              onChange={(e) => onChange({ disableImages: e.target.checked })}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <div>
              <span className="text-sm font-medium text-foreground">Disable Images</span>
              <p className="text-xs text-muted-foreground">Block image loading for faster page loads</p>
            </div>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={!config.disableJavaScript}
              onChange={(e) => onChange({ disableJavaScript: !e.target.checked })}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <div>
              <span className="text-sm font-medium text-foreground">Enable JavaScript</span>
              <p className="text-xs text-muted-foreground">Required for Gmail account creation</p>
            </div>
          </label>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <h3 className="text-lg font-medium text-foreground mb-4">Performance Metrics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 border border-border rounded-md">
            <div className="text-sm text-muted-foreground">Average Load Time</div>
            <div className="text-2xl font-bold text-foreground">2.3s</div>
          </div>
          
          <div className="p-3 border border-border rounded-md">
            <div className="text-sm text-muted-foreground">Memory Usage</div>
            <div className="text-2xl font-bold text-foreground">156MB</div>
          </div>
          
          <div className="p-3 border border-border rounded-md">
            <div className="text-sm text-muted-foreground">Success Rate</div>
            <div className="text-2xl font-bold text-green-600">94.2%</div>
          </div>
        </div>
      </div>

      <div className="flex items-start space-x-2 p-4 bg-blue-50 dark:bg-blue-950 rounded-md">
        <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
        <div className="text-sm text-blue-800 dark:text-blue-200">
          <p className="font-medium mb-1">WebDriver Optimization Tips:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Use headless mode for better performance and resource usage</li>
            <li>Enable user agent rotation to avoid browser fingerprinting</li>
            <li>Disable images and unnecessary resources to speed up page loads</li>
            <li>Adjust timeouts based on your network conditions</li>
            <li>Monitor memory usage and restart browsers periodically</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
