/**
 * get_contract — full details of a single contract by id.
 * Maps to GET /api/v1/contracts/:id.
 */

import { formatBackendError } from '../../client.js';

export const definition = {
  name: 'get_contract',
  description: 'Fetch a single contract by id. Returns the full structured contract: sections, filledFields, recipients, signatures, status, audit summary, on-chain proof, permalink.',
  inputSchema: {
    type: 'object',
    properties: {
      contractId: {
        type: 'string',
        description: 'The contract id (MongoDB ObjectId, 24 hex chars).',
      },
    },
    required: ['contractId'],
  },
};

export async function handler(args, { client }) {
  const res = await client.get(`/api/v1/contracts/${encodeURIComponent(args.contractId)}`);
  if (!res.ok) {
    return { content: [{ type: 'text', text: formatBackendError(res) }], isError: true };
  }
  return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
}
