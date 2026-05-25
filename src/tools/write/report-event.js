/**
 * report_event — Phase 6.5 wired endpoint.
 *
 * Reports a signed event to a contract's machine-readable terms. When the
 * term's when+condition matches, the term's action fires (typically
 * escrow.release). Endpoint: POST /api/v1/contracts/:id/events.
 *
 * Authentication: requires an agent-bound API key (qc_agnt_*). The
 * agent's identity is taken from the API key.
 *
 * Optional `signature`: hex Ed25519 over canonical
 * SHA-256(termId || canonicalJson(evidence) || ISO timestamp).
 * When omitted, the event is still accepted (the API key proves identity)
 * but loses non-repudiation. Sign when you can.
 */

import { formatBackendError } from '../../client.js';

export const definition = {
  name: 'report_event',
  description: 'Report a signed event to a contract\'s machine-readable terms. When a term\'s when+condition matches, the term\'s action fires (typically escrow.release). Caller must use a qc_agnt_* API key.',
  inputSchema: {
    type: 'object',
    properties: {
      contractId: { type: 'string', description: 'The contract id.' },
      termId: { type: 'string', description: 'Which machineTerm this event satisfies.' },
      event: {
        type: 'string',
        enum: ['payload.delivered', 'milestone.completed', 'data.verified', 'deadline.passed'],
        description: 'Event kind. Optional — defaults to the term\'s when.event.',
      },
      evidence: {
        type: 'object',
        description: 'Event-specific evidence (e.g. { schema, value, contentHash, deliveredAt }). Evaluated against the term\'s condition predicates.',
      },
      timestamp: {
        type: 'string',
        description: 'ISO 8601 timestamp. Optional — defaults to now.',
      },
      signature: {
        type: 'string',
        description: 'Optional hex Ed25519 signature over SHA-256(termId || canonicalJson(evidence) || ISO timestamp). Provides non-repudiation when the agent can sign locally.',
      },
    },
    required: ['contractId', 'termId', 'evidence'],
  },
};

export async function handler(args, { client }) {
  const { contractId, ...body } = args;
  const res = await client.post(
    `/api/v1/contracts/${encodeURIComponent(contractId)}/events`,
    { body },
  );
  if (!res.ok) {
    return { content: [{ type: 'text', text: formatBackendError(res) }], isError: true };
  }
  return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
}
