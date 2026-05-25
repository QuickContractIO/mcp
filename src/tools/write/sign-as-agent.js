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
  // Render the response as a readable summary FIRST (so the LLM surfaces
  // the permalink URL prominently in chat rather than burying it inside
  // raw JSON), then attach the full JSON as a follow-up block for tools
  // that need to introspect the agentSignature payload.
  const data = res.data;
  const publicHost = (process.env.QC_PUBLIC_HOST || 'quickcontract.io').replace(/\/+$/, '');
  const url = data.permalink ? `https://${publicHost}/c/${data.permalink}` : null;
  const lines = [
    `Signed ${data.party === 'partyA' ? 'Party A' : 'Party B'} on contract ${args.contractId}.`,
    `Status: ${data.status}`,
    `Signed at: ${data.signedAt}`,
  ];
  if (url) lines.push(`Permalink: ${url}`);
  if (data.agentSignature?.did) lines.push(`Agent DID: ${data.agentSignature.did}`);
  if (data.agentSignature?.signedContentHash) {
    const h = data.agentSignature.signedContentHash;
    lines.push(`Content hash: ${h.slice(0, 16)}…${h.slice(-8)}`);
  }
  if (data.agentSignature?.signature) {
    const s = data.agentSignature.signature;
    lines.push(`Signature: ${s.slice(0, 16)}…${s.slice(-8)} (Ed25519)`);
  }
  const summary = lines.join('\n');
  return { content: [{ type: 'text', text: `${summary}\n\nFull response:\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`` }] };
}
