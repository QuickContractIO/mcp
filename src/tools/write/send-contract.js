/**
 * send_contract — move a draft into sent_for_review state and email
 * recipients with their per-recipient claim tokens.
 * Maps to POST /api/v1/contracts/:id/send.
 *
 * Mandate gate (when caller is an agent): recipient email domains
 * must be in mandate.limits.allowedCounterpartyDomains (if set).
 */

import { formatBackendError } from '../../client.js';

export const definition = {
  name: 'send_contract',
  description: 'Send a draft contract to its recipients. Recipients receive an email with a tokenized claim link. When the caller is an agent, recipient email domains are checked against mandate.limits.allowedCounterpartyDomains.',
  inputSchema: {
    type: 'object',
    properties: {
      contractId: { type: 'string', description: 'The contract id.' },
      message: {
        type: 'string',
        description: 'Optional message to include in the recipient email.',
      },
    },
    required: ['contractId'],
  },
};

export async function handler(args, { client }) {
  const res = await client.post(`/api/v1/contracts/${encodeURIComponent(args.contractId)}/send`, {
    body: { message: args.message },
  });
  if (!res.ok) {
    return { content: [{ type: 'text', text: formatBackendError(res) }], isError: true };
  }
  return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
}
