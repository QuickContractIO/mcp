/**
 * get_template — full template body (sections + fields) for the
 * caller to pre-fill before creating a contract.
 * Maps to GET /api/v1/templates/:id.
 */

import { formatBackendError } from '../../client.js';

export const definition = {
  name: 'get_template',
  description: 'Fetch a template by id. Returns the full structured body: sections[] (id, title, content) and fields[] (key, label, type, required). Use the field keys when calling create_contract.filledFields.',
  inputSchema: {
    type: 'object',
    properties: {
      templateId: { type: 'string', description: 'Template id.' },
    },
    required: ['templateId'],
  },
};

export async function handler(args, { client }) {
  const res = await client.get(`/api/v1/templates/${encodeURIComponent(args.templateId)}`);
  if (!res.ok) {
    return { content: [{ type: 'text', text: formatBackendError(res) }], isError: true };
  }
  return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
}
