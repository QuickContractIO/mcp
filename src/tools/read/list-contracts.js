/**
 * list_contracts — paginated list of contracts visible to the API key's
 * org, optionally filtered by status / counterparty / date range.
 * Maps to GET /api/v1/contracts.
 */

import { formatBackendError } from '../../client.js';

export const definition = {
  name: 'list_contracts',
  description: 'List contracts in your organization. Filter by status, counterparty email, date range. Paginated (default 20 per page, max 100). Returns id, name, status, permalink, contentHash, polygonTxId, folder, timestamps.',
  inputSchema: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        description: "Filter by contract status. Single value (e.g. 'signed') or comma-separated list (e.g. 'draft,sent_for_review,signed').",
      },
      query: {
        type: 'string',
        description: 'Case-insensitive substring match against contract name.',
      },
      recipient: {
        type: 'string',
        description: 'Substring match against any recipient email on the contract.',
      },
      from: {
        type: 'string',
        description: "ISO 8601 date — earliest updatedAt. e.g. '2026-01-01'.",
      },
      to: {
        type: 'string',
        description: 'ISO 8601 date — latest updatedAt.',
      },
      folderId: {
        type: 'string',
        description: "Folder ID to filter by. Use 'uncategorized' for contracts not in any folder.",
      },
      page: { type: 'integer', minimum: 1, default: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
    },
  },
};

export async function handler(args, { client }) {
  const res = await client.get('/api/v1/contracts', {
    query: {
      status: args.status,
      q: args.query,
      recipient: args.recipient,
      from: args.from,
      to: args.to,
      folderId: args.folderId,
      page: args.page,
      limit: args.limit,
    },
  });
  if (!res.ok) {
    return { content: [{ type: 'text', text: formatBackendError(res) }], isError: true };
  }
  return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
}
