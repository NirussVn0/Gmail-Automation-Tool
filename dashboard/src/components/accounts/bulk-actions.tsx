'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface BulkActionsProps {
  selectedCount: number;
  onAction: (action: string) => void;
}

export function BulkActions({ selectedCount, onAction }: BulkActionsProps) {
  const [showConfirmation, setShowConfirmation] = useState<string | null>(null);

  const actions = [
    {
      id: 'activate',
      label: 'Activate',
      icon: CheckCircleIcon,
      variant: 'default' as const,
      description: 'Activate selected accounts',
    },
    {
      id: 'suspend',
      label: 'Suspend',
      icon: ExclamationTriangleIcon,
      variant: 'outline' as const,
      description: 'Suspend selected accounts',
    },
    {
      id: 'export',
      label: 'Export',
      icon: ArrowDownTrayIcon,
      variant: 'outline' as const,
      description: 'Export selected accounts to CSV',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: TrashIcon,
      variant: 'destructive' as const,
      description: 'Permanently delete selected accounts',
      requiresConfirmation: true,
    },
  ];

  const handleAction = (actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    if (action?.requiresConfirmation) {
      setShowConfirmation(actionId);
    } else {
      onAction(actionId);
    }
  };

  const handleConfirm = () => {
    if (showConfirmation) {
      onAction(showConfirmation);
      setShowConfirmation(null);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(null);
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm font-medium text-foreground">
              {selectedCount} account{selectedCount !== 1 ? 's' : ''} selected
            </div>
            <div className="flex space-x-2">
              {actions.map((action) => (
                <Button
                  key={action.id}
                  variant={action.variant}
                  size="sm"
                  onClick={() => handleAction(action.id)}
                  className="flex items-center"
                >
                  <action.icon className="mr-2 h-4 w-4" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {showConfirmation && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-foreground">
                  Confirm Deletion
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Are you sure you want to delete {selectedCount} account{selectedCount !== 1 ? 's' : ''}? 
                  This action cannot be undone.
                </p>
                <div className="flex space-x-2 mt-3">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleConfirm}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="p-1"
              >
                <XMarkIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
