/**
 * Affiliate Connector Registry
 *
 * Central registry for all affiliate network connectors.
 * Add new connectors here to make them available in the system.
 */

import type { AffiliateConnector } from './types';
import { PartnerStackConnector } from './partnerstack';
import { FinanceAdsConnector } from './financeads';
import { AwinConnector } from './awin';

// Connector class type
type ConnectorClass = new () => AffiliateConnector;

// Register all available connectors
const connectorRegistry = new Map<string, ConnectorClass>([
  ['partnerstack', PartnerStackConnector],
  ['financeads', FinanceAdsConnector],
  ['awin', AwinConnector],
]);

/**
 * Get a connector instance by name
 */
export function getConnector(name: string): AffiliateConnector | null {
  const ConnectorClass = connectorRegistry.get(name);
  if (!ConnectorClass) {
    return null;
  }
  return new ConnectorClass();
}

/**
 * Get all available connector types
 */
export function getAvailableConnectors(): Array<{
  name: string;
  displayName: string;
  description: string;
  supportsWebhooks: boolean;
}> {
  const connectors: Array<{
    name: string;
    displayName: string;
    description: string;
    supportsWebhooks: boolean;
  }> = [];

  connectorRegistry.forEach((ConnectorClass) => {
    const instance = new ConnectorClass();
    connectors.push({
      name: instance.name,
      displayName: instance.displayName,
      description: instance.description,
      supportsWebhooks: instance.supportsWebhooks,
    });
  });

  return connectors;
}

export * from './types';
export { PartnerStackConnector } from './partnerstack';
export { FinanceAdsConnector } from './financeads';
export { AwinConnector } from './awin';
