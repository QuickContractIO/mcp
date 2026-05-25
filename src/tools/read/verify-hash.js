/**
 * verify_hash — public verification endpoint. Resolve any contract by
 * its SHA-256 content hash and get the on-chain proof + signedBy[]
 * including agent DIDs for external Ed25519 verification.
 * Maps to GET /api/v1/verify/:hash (PUBLIC, no API key required).
 */

import { formatBackendError } from '../../client.js';

export const definition = {
  name: 'verify_hash',
  description: 'Verify a contract by its SHA-256 content hash. Returns whether the hash is registered, its on-chain Polygon transaction id, and the signedBy[] array — for agent-signed contracts this includes the DID and the externally-verifiable Ed25519 signature payload.',
  inputSchema: {
    type: 'object',
    properties: {
      contentHash: {
        type: 'string',
        description: 'SHA-256 content hash (64 hex chars) of the contract to verify.',
      },
    },
    required: ['contentHash'],
  },
};

export async function handler(args, { client }) {
  const res = await client.get(`/api/v1/verify/${encodeURIComponent(args.contentHash)}`);
  if (!res.ok) {
    return { content: [{ type: 'text', text: formatBackendError(res) }], isError: true };
  }
  return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
}
