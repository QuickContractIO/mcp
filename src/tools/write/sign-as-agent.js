/**
 * sign_as_agent — produce an Ed25519 signature on a contract as the
 * agent identified by the API key (qc_agnt_*). Phase 6.4 endpoint.
 *
 * Mandate gate: server enforces capability=contracts.sign + every
 * limit in agent.mandate.limits. Typed reject codes:
 *   - mandate_revoked, mandate_expired
 *   - capability_not_granted
 *   - mandate_exceeded_value_cap / day_cap / month_cap
 *   - template_not_allowed
 *   - counterparty_not_allowed
 *   - jurisdiction_not_allowed
 *
 * Response includes the agentSignature payload (algorithm, publicKey,
 * did, signature, signedContentHash, timestamp, mandateSnapshot) —
 * the cryptographic proof that's also persisted on the Pdf and
 * surfaced on the public permalink.
 */

import { formatBackendError } from '../../client.js';

export const definition = {
  name: 'sign_as_agent',
  description: 'Sign a contract as an agent. Requires a qc_agnt_* API key. Produces an Ed25519 signature over SHA-256(contentHash || timestamp || did). The signature is embedded in the contract\'s audit trail and resolvable externally via the agent\'s did:web identifier — no QC API dependency for verification.',
  inputSchema: {
    type: 'object',
    properties: {
      contractId: { type: 'string', description: 'The contract id.' },
      party: {
        type: 'string',
        enum: ['A', 'B'],
        description: "Which party slot to sign: 'A' or 'B'. Agent must either own the contract (party_a) or be registered as a recipient with kind='agent' (party_b).",
      },
    },
    required: ['contractId', 'party'],
  },
};

export async function handler(args, { client }) {
  const res = await client.post(
    `/api/v1/contracts/${encodeURIComponent(args.contractId)}/sign`,
    {
      body: { actor: 'agent', party: args.party },
    },
  );
  if (!res.ok) {
    return { content: [{ type: 'text', text: formatBackendError(res) }], isError: true };
  }
  return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
}
