/**
 * add_recipient — register a recipient (human or agent) on a contract.
 * Maps to POST /api/v1/contracts/:id/recipients.
 *
 * For kind='agent', requires agentId of an existing agent in some org.
 * The mandate snapshot is captured server-side at add-time so later
 * mandate edits don't rewrite history.
 */

import { formatBackendError } from '../../client.js';

export const definition = {
  name: 'add_recipient',
  description: 'Add a recipient to a contract. kind=\'human\' (default) requires email + name. kind=\'agent\' requires agentDid (the DID of the agent). The mandate is snapshotted at add-time.',
  inputSchema: {
    type: 'object',
    properties: {
      contractId: { type: 'string', description: 'The contract id.' },
      party: {
        type: 'string',
        enum: ['party_a', 'party_b', 'observer'],
        description: "Which side: party_a / party_b / observer.",
      },
      role: {
        type: 'string',
        enum: ['viewer', 'reviewer', 'signer'],
        default: 'signer',
      },
      kind: {
        type: 'string',
        enum: ['human', 'agent'],
        default: 'human',
      },
      email: { type: 'string', description: "Required when kind='human'." },
      name: { type: 'string' },
      agentDid: {
        type: 'string',
        description: "Required when kind='agent'. The agent's did:web identifier.",
      },
    },
    required: ['contractId', 'party'],
  },
};

export async function handler(args, { client }) {
  const { contractId, ...body } = args;
  const res = await client.post(`/api/v1/contracts/${encodeURIComponent(contractId)}/recipients`, { body });
  if (!res.ok) {
    return { content: [{ type: 'text', text: formatBackendError(res) }], isError: true };
  }
  return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
}
