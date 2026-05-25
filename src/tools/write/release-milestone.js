/**
 * release_milestone — release an escrow milestone. Requires the caller
 * to be a party authorised on the escrow (typically the payer side).
 * For agent callers, mandate must include 'escrow.release' capability.
 * Maps to POST /api/v1/contracts/:id/escrow/milestones/:milestoneId/release
 * (also accessible via the escrow controller; the partner API mirrors
 * the same backend service).
 */

import { formatBackendError } from '../../client.js';

export const definition = {
  name: 'release_milestone',
  description: 'Release an escrow milestone. The funds settle directly on the recipient\'s connected account (Stripe Connect Mode B) or on-chain wallet (Mode A USDC) — non-custodial in both paths. Agent callers must have escrow.release in their mandate.capabilities.',
  inputSchema: {
    type: 'object',
    properties: {
      contractId: { type: 'string', description: 'The contract id.' },
      milestoneId: { type: 'string', description: 'The milestone id within the contract\'s escrow.milestones[].' },
    },
    required: ['contractId', 'milestoneId'],
  },
};

export async function handler(args, { client }) {
  const res = await client.post(
    `/api/escrow/${encodeURIComponent(args.contractId)}/milestones/${encodeURIComponent(args.milestoneId)}/release`,
  );
  if (!res.ok) {
    return { content: [{ type: 'text', text: formatBackendError(res) }], isError: true };
  }
  return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
}
