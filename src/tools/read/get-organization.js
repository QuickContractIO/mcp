/**
 * get_organization — caller's org metadata, plan tier, rate limit.
 * Useful for an agent to introspect its own context before deciding
 * which tools are available (read-only orgs cannot call WRITE tools).
 * Maps to GET /api/v1/organization.
 */

import { formatBackendError } from '../../client.js';

export const definition = {
  name: 'get_organization',
  description: 'Get your organization metadata: id, name, plan tier (free/starter/pro/team/enterprise), API access level (read/full/none), and rate limit. Use this to introspect what surface is available before calling other tools.',
  inputSchema: { type: 'object', properties: {} },
};

export async function handler(_args, { client }) {
  const res = await client.get('/api/v1/organization');
  if (!res.ok) {
    return { content: [{ type: 'text', text: formatBackendError(res) }], isError: true };
  }
  return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
}
