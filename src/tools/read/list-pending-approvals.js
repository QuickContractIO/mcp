/**
 * list_pending_approvals — contracts that the caller (agent or owner)
 * must act on RIGHT NOW. Distinct from `list_contracts` which returns
 * everything; this one is the "approval queue" view designed for the
 * common LLM phrasing:
 *
 *   "list my pending contracts"
 *   "what's waiting for my signature"
 *   "show me my approval queue"
 *
 * Definition of "pending action by me":
 *  - pending_signature_a   → owner-side party A needs to sign
 *  - pending_signature_b   → counterparty B needs to sign (and the API
 *                            key holder is the counterparty)
 *  - in_negotiation        → there are open comments / proposals from
 *                            the other side awaiting your response
 *  - sent_for_review       → recipient hasn't acted but the contract is
 *                            in the queue (included for owners who want
 *                            to chase)
 *
 * Drafts are NOT included — those are work-in-progress, not waiting on
 * external action. `list_contracts` with `status=draft` covers those.
 *
 * Backed by `GET /api/v1/contracts?status=pending_signature_a,pending_signature_b,in_negotiation,sent_for_review`.
 */

import { formatBackendError } from '../../client.js';

const PENDING_STATUSES = [
  'pending_signature_a',
  'pending_signature_b',
  'in_negotiation',
  'sent_for_review',
];

export const definition = {
  name: 'list_pending_approvals',
  description:
    'List contracts waiting for your action — your approval queue. Returns contracts in status pending_signature_a, pending_signature_b, in_negotiation, or sent_for_review. Use this when the user asks for "pending contracts", "what needs my signature", "my approval queue", "things waiting on me", or similar. Drafts are NOT included (use list_contracts with status=draft for those).',
  inputSchema: {
    type: 'object',
    properties: {
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
    },
  },
};

export async function handler(args, { client }) {
  const res = await client.get('/api/v1/contracts', {
    query: {
      status: PENDING_STATUSES.join(','),
      limit: args.limit || 50,
    },
  });
  if (!res.ok) {
    return { content: [{ type: 'text', text: formatBackendError(res) }], isError: true };
  }
  // Format as a readable list so the LLM surfaces permalinks + contractIds
  // in chat. Calling tools like sign_as_agent need contractId; humans
  // reading along want the permalink URL. Show both.
  const data = res.data;
  const publicHost = (process.env.QC_PUBLIC_HOST || 'quickcontract.io').replace(/\/+$/, '');
  const items = data.data || [];
  if (items.length === 0) {
    return { content: [{ type: 'text', text: 'No contracts pending your action.' }] };
  }
  const lines = [`${data.total ?? items.length} contract(s) waiting on your action:`, ''];
  for (const c of items) {
    const url = c.permalink ? `https://${publicHost}/c/${c.permalink}` : null;
    lines.push(`• ${c.contractName}`);
    lines.push(`  id: ${c._id}  ·  status: ${c.status}`);
    if (url) lines.push(`  permalink: ${url}`);
    lines.push('');
  }
  return { content: [{ type: 'text', text: lines.join('\n').trimEnd() }] };
}
