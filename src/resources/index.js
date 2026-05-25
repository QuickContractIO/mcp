/**
 * MCP resources — addressable read-only data exposed to the LLM client.
 *
 * Resources differ from tools: tools are RPC calls with arguments;
 * resources are URI-addressable so the LLM can request a specific
 * object directly by name (e.g. `contract://65e2a...`).
 *
 * Four URI schemes:
 *   - contract://{id-or-permalink}  → full contract metadata
 *   - template://{id}               → template body
 *   - audit://{contractId}          → hash-chained audit log
 *   - agent://{didIdentifier}       → DID document JSON-LD
 */

import { formatBackendError } from '../client.js';

export const resourceList = [
  {
    uri: 'contract://{contractId}',
    name: 'Contract',
    description: 'A QuickContract contract. Use the id (24-char hex) or the public permalink slug.',
    mimeType: 'application/json',
  },
  {
    uri: 'template://{templateId}',
    name: 'Template',
    description: 'A contract template (62 base templates + your org\'s custom).',
    mimeType: 'application/json',
  },
  {
    uri: 'audit://{contractId}',
    name: 'Audit log',
    description: 'Tamper-evident hash-chained audit events for a contract.',
    mimeType: 'application/json',
  },
  {
    uri: 'agent://{didIdentifier}',
    name: 'Agent DID Document',
    description: 'W3C DID Document JSON-LD for an agent. Consume the publicKeyJwk to verify Ed25519 signatures externally.',
    mimeType: 'application/did+ld+json',
  },
];

export async function readResource(uri, { client }) {
  const m = uri.match(/^(contract|template|audit|agent):\/\/(.+)$/);
  if (!m) {
    return { contents: [], isError: true, errorText: `Unsupported URI: ${uri}` };
  }
  const [, scheme, id] = m;

  if (scheme === 'contract') {
    const res = await client.get(`/api/v1/contracts/${encodeURIComponent(id)}`);
    if (!res.ok) return { contents: [{ uri, mimeType: 'application/json', text: formatBackendError(res) }] };
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(res.data, null, 2) }] };
  }

  if (scheme === 'template') {
    const res = await client.get(`/api/v1/templates/${encodeURIComponent(id)}`);
    if (!res.ok) return { contents: [{ uri, mimeType: 'application/json', text: formatBackendError(res) }] };
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(res.data, null, 2) }] };
  }

  if (scheme === 'audit') {
    const res = await client.get(`/api/v1/contracts/${encodeURIComponent(id)}/audit`);
    if (!res.ok) return { contents: [{ uri, mimeType: 'application/json', text: formatBackendError(res) }] };
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(res.data, null, 2) }] };
  }

  if (scheme === 'agent') {
    // Resolve via the public DID document URL — no API key required.
    const baseUrl = (process.env.QC_BASE_URL || 'https://api.quickcontract.io').replace(/\/+$/, '');
    // Public site host for DID resolution (FRONTEND_URL on the backend).
    // Default to quickcontract.io for production; allow override for staging.
    const publicHost = process.env.QC_PUBLIC_HOST || 'quickcontract.io';
    const url = `https://${publicHost}/agents/${encodeURIComponent(id)}/did.json`;
    try {
      const res = await fetch(url, { headers: { Accept: 'application/did+ld+json,application/json' } });
      const text = await res.text();
      return { contents: [{ uri, mimeType: 'application/did+ld+json', text }] };
    } catch (err) {
      return { contents: [{ uri, mimeType: 'application/json', text: `Failed to resolve DID: ${err.message}` }] };
    }
  }
}
