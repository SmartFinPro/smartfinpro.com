'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  XCircle,
  Settings,
  RefreshCw,
  Loader2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  configureConnector,
  toggleConnector,
  triggerManualSync,
  deleteConnectorConfig,
} from '@/lib/actions/connectors';
import type { ConnectorInfo } from '@/lib/actions/connectors';

interface ConnectorListProps {
  connectors: ConnectorInfo[];
}

export function ConnectorList({ connectors }: ConnectorListProps) {
  const router = useRouter();
  const [loadingConnector, setLoadingConnector] = useState<string | null>(null);
  const [configOpen, setConfigOpen] = useState<string | null>(null);

  const handleToggle = async (connector: ConnectorInfo, enabled: boolean) => {
    if (!connector.is_configured && enabled) {
      setConfigOpen(connector.name);
      return;
    }

    setLoadingConnector(connector.name);
    await toggleConnector(connector.name, enabled);
    setLoadingConnector(null);
    router.refresh();
  };

  const handleSync = async (connectorName: string) => {
    setLoadingConnector(connectorName);
    const result = await triggerManualSync(connectorName);
    setLoadingConnector(null);

    if (result.success) {
      alert(result.message);
    } else {
      alert(`Sync failed: ${result.message}`);
    }

    router.refresh();
  };

  return (
    <div className="space-y-4">
      {connectors.map((connector) => (
        <div
          key={connector.name}
          className="flex items-center justify-between p-4 border rounded-lg"
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                connector.is_enabled
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              {connector.is_enabled ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-400" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{connector.displayName}</h3>
                {connector.is_configured && (
                  <Badge variant="secondary" className="text-xs">
                    Configured
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{connector.description}</p>

              {/* Last sync status */}
              {connector.last_sync_at && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Last sync:{' '}
                      {new Date(connector.last_sync_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {connector.last_sync_status === 'success' ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Success
                      </Badge>
                    ) : connector.last_sync_status === 'failed' ? (
                      <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Failed
                      </Badge>
                    ) : null}
                  </div>
                  {/* Error message display */}
                  {connector.last_sync_status === 'failed' && connector.error_message && (
                    <div className="mt-1 p-2 bg-red-50 dark:bg-red-950/20 rounded text-xs text-red-600 dark:text-red-400">
                      <span className="font-medium">Error:</span> {connector.error_message}
                    </div>
                  )}
                  {/* Records synced */}
                  {connector.last_sync_status === 'success' && connector.records_synced !== undefined && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {connector.records_synced} records synced
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Sync button */}
            {connector.is_enabled && connector.is_configured && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSync(connector.name)}
                disabled={loadingConnector === connector.name}
              >
                {loadingConnector === connector.name ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="ml-2 hidden sm:inline">Sync Now</span>
              </Button>
            )}

            {/* Configure button */}
            <ConnectorConfigDialog
              connector={connector}
              open={configOpen === connector.name}
              onOpenChange={(open) => setConfigOpen(open ? connector.name : null)}
              onSave={() => {
                setConfigOpen(null);
                router.refresh();
              }}
            />

            {/* Enable/disable switch */}
            <Switch
              checked={connector.is_enabled}
              onCheckedChange={(checked) => handleToggle(connector, checked)}
              disabled={loadingConnector === connector.name}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Connector-specific field configurations
const connectorFields: Record<string, { publisherId?: boolean; secretRequired?: boolean }> = {
  partnerstack: { publisherId: false, secretRequired: true },
  financeads: { publisherId: true, secretRequired: false },
  awin: { publisherId: true, secretRequired: false },
};

// Configuration Dialog
function ConnectorConfigDialog({
  connector,
  open,
  onOpenChange,
  onSave,
}: {
  connector: ConnectorInfo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}) {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [publisherId, setPublisherId] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fields = connectorFields[connector.name] || {};
  const needsPublisherId = fields.publisherId;
  const needsSecret = fields.secretRequired !== false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await configureConnector(connector.name, {
      api_key: apiKey,
      api_secret: needsSecret ? apiSecret : undefined,
      publisher_id: needsPublisherId ? publisherId : undefined,
      webhook_secret: webhookSecret || undefined,
    });

    setLoading(false);

    if (result.success) {
      onSave();
    } else {
      setError(result.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove this configuration?')) return;

    setLoading(true);
    await deleteConnectorConfig(connector.name);
    setLoading(false);
    onSave();
  };

  const isFormValid = apiKey && (needsSecret ? apiSecret : true) && (needsPublisherId ? publisherId : true);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure {connector.displayName}</DialogTitle>
          <DialogDescription>
            Enter your API credentials from the {connector.displayName} partner dashboard.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">
              {connector.name === 'awin' ? 'API Token' : 'API Key'} *
            </Label>
            <Input
              id="api-key"
              type="password"
              placeholder={connector.name === 'awin' ? 'Enter API token' : 'Enter API key'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
            />
          </div>

          {needsSecret && (
            <div className="space-y-2">
              <Label htmlFor="api-secret">API Secret *</Label>
              <Input
                id="api-secret"
                type="password"
                placeholder="Enter API secret"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                required
              />
            </div>
          )}

          {needsPublisherId && (
            <div className="space-y-2">
              <Label htmlFor="publisher-id">Publisher ID *</Label>
              <Input
                id="publisher-id"
                type="text"
                placeholder="Enter your Publisher ID"
                value={publisherId}
                onChange={(e) => setPublisherId(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Find this in your {connector.displayName} account settings
              </p>
            </div>
          )}

          {connector.supportsWebhooks && (
            <div className="space-y-2">
              <Label htmlFor="webhook-secret">Webhook Secret (optional)</Label>
              <Input
                id="webhook-secret"
                type="password"
                placeholder="For webhook signature verification"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Find this in your {connector.displayName} webhook settings
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-between pt-4">
            {connector.is_configured && (
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
                Remove
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !isFormValid}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Save & Test'
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
