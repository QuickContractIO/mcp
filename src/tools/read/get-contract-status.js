/**
 * get_contract_status — lightweight status check (party signing state +
 * polygon anchor flag). Cheaper than get_contract for polling loops.
 * Maps to GET /api/v1/contracts/:id/status.
 */

import { formatBackendError } from '../../client.js';

export const definition = {
  name: 'get_contract_status',
  description: 'Lightweight status check for a contract. Returns status string + per-party signed flag + polygon-anchor flag. Use this for polling in long-running flows; cheaper than get_contract.',
  inputSchema: {
    type: 'object',
    properties: {
      contractId: { type: 'string', description: 'The contract id.' },
    },
    required: ['contractId'],
  },
};

export async function handler(args, { client }) {
  const res = await client.get(`/api/v1/contracts/${encodeURIComponent(args.contractId)}/status`);
  if (!res.ok) {
    return { content: [{ type: 'text', text: formatBackendError(res) }], isError: true };
  }
  return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
}
