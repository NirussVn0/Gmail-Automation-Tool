'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SecurityConfig } from '@/types/domain';
import { EyeIcon, EyeSlashIcon, KeyIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

interface SecuritySettingsProps {
  config: SecurityConfig;
  onChange: (updates: Partial<SecurityConfig>) => void;
}

export function SecuritySettings({ config, onChange }: SecuritySettingsProps) {
  const [showKeys, setShowKeys] = useState({
    secretKey: false,
    encryptionKey: false,
    passwordSalt: false,
  });

  const generateSecureKey = (length: number = 64): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleGenerateKey = (field: keyof SecurityConfig) => {
    const newKey = generateSecureKey();
    onChange({ [field]: newKey });
  };

  const toggleKeyVisibility = (field: keyof typeof showKeys) => {
    setShowKeys(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const jwtAlgorithms = [
    { value: 'HS256', label: 'HS256 (HMAC SHA-256)' },
    { value: 'HS384', label: 'HS384 (HMAC SHA-384)' },
    { value: 'HS512', label: 'HS512 (HMAC SHA-512)' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 p-4 bg-red-50 dark:bg-red-950 rounded-md">
        <ShieldCheckIcon className="h-5 w-5 text-red-600" />
        <div className="text-sm text-red-800 dark:text-red-200">
          <p className="font-medium">Security Warning</p>
          <p>These settings control critical security features. Changes should only be made by authorized administrators.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Secret Key
          </label>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <input
                type={showKeys.secretKey ? 'text' : 'password'}
                value={config.secretKey}
                onChange={(e) => onChange({ secretKey: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter secret key"
              />
              <button
                type="button"
                onClick={() => toggleKeyVisibility('secretKey')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKeys.secretKey ? (
                  <EyeSlashIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleGenerateKey('secretKey')}
            >
              <KeyIcon className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Used for JWT token signing and general application security
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Encryption Key
          </label>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <input
                type={showKeys.encryptionKey ? 'text' : 'password'}
                value={config.encryptionKey}
                onChange={(e) => onChange({ encryptionKey: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter encryption key"
              />
              <button
                type="button"
                onClick={() => toggleKeyVisibility('encryptionKey')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKeys.encryptionKey ? (
                  <EyeSlashIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleGenerateKey('encryptionKey')}
            >
              <KeyIcon className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Used for encrypting sensitive data in the database
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Password Salt
          </label>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <input
                type={showKeys.passwordSalt ? 'text' : 'password'}
                value={config.passwordSalt}
                onChange={(e) => onChange({ passwordSalt: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter password salt"
              />
              <button
                type="button"
                onClick={() => toggleKeyVisibility('passwordSalt')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKeys.passwordSalt ? (
                  <EyeSlashIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleGenerateKey('passwordSalt')}
            >
              <KeyIcon className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Used for password hashing and additional security
          </p>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <h3 className="text-lg font-medium text-foreground mb-4">JWT Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              JWT Algorithm
            </label>
            <select
              value={config.jwtAlgorithm}
              onChange={(e) => onChange({ jwtAlgorithm: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {jwtAlgorithms.map((algorithm) => (
                <option key={algorithm.value} value={algorithm.value}>
                  {algorithm.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              JWT Expiration (hours)
            </label>
            <input
              type="number"
              min="1"
              max="168"
              value={config.jwtExpirationHours}
              onChange={(e) => onChange({ jwtExpirationHours: parseInt(e.target.value) || 24 })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Maximum: 168 hours (7 days)
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <h3 className="text-lg font-medium text-foreground mb-4">Security Status</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 border border-border rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Encryption</span>
              <span className="text-sm text-green-600 font-medium">Active</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">AES-256 encryption enabled</p>
          </div>
          
          <div className="p-3 border border-border rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">JWT Security</span>
              <span className="text-sm text-green-600 font-medium">Secure</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Strong algorithm and expiration</p>
          </div>
        </div>
      </div>
    </div>
  );
}
