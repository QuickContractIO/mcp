/**
 * get_obligations — extract action items + dates + payment terms from
 * a contract via the AI obligations service.
 * Maps to POST /api/v1/contracts/:id/obligations.
 */

import { formatBackendError } from '../../client.js';

export const definition = {
  name: 'get_obligations',
  description: 'Extract obligations from a contract via the Claude-based AI service. Returns structured payment terms, delivery deadlines, renewal dates, and party-specific action items. Cached after first run.',
  inputSchema: {
    type: 'object',
    properties: {
      contractId: { type: 'string', description: 'The contract id.' },
      refresh: {
        type: 'boolean',
        description: 'Force re-extraction even if a cached result exists. Default false.',
      },
    },
    required: ['contractId'],
  },
};

export async function handler(args, { client }) {
  const res = await client.post(`/api/v1/contracts/${encodeURIComponent(args.contractId)}/obligations`, {
    body: { refresh: !!args.refresh },
  });
  if (!res.ok) {
    return { content: [{ type: 'text', text: formatBackendError(res) }], isError: true };
  }
  return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
}
