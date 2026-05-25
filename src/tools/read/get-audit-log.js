/**
 * get_audit_log — tamper-evident hash-chained audit events for a
 * contract. Includes agent-signed events with actor.kind='agent' +
 * agentDid (Phase 6.4).
 * Maps to GET /api/v1/contracts/:id/audit.
 */

import { formatBackendError } from '../../client.js';

export const definition = {
  name: 'get_audit_log',
  description: 'Fetch the tamper-evident audit log for a contract. Each event is hash-chained (prevHash + hash = SHA-256). Agent actions carry actor.kind=\'agent\' + agentDid so an external auditor can resolve the actor without QC API access.',
  inputSchema: {
    type: 'object',
    properties: {
      contractId: { type: 'string', description: 'The contract id.' },
    },
    required: ['contractId'],
  },
};

export async function handler(args, { client }) {
  const res = await client.get(`/api/v1/contracts/${encodeURIComponent(args.contractId)}/audit`);
  if (!res.ok) {
    return { content: [{ type: 'text', text: formatBackendError(res) }], isError: true };
  }
  return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
}
