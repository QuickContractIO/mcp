/**
 * update_contract — edit a draft contract's fields or sections.
 * Maps to PATCH /api/v1/contracts/:id.
 */

import { formatBackendError } from '../../client.js';

export const definition = {
  name: 'update_contract',
  description: 'Update a draft contract: change filledFields, contractName, or edit individual section bodies. Only works while status=\'draft\'. Returns the updated contract.',
  inputSchema: {
    type: 'object',
    properties: {
      contractId: { type: 'string', description: 'The contract id.' },
      contractName: { type: 'string' },
      filledFields: {
        type: 'object',
        additionalProperties: { type: 'string' },
      },
      editedSections: {
        type: 'array',
        description: 'Replace the sections array. Each section: { id, title, content }.',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            content: { type: 'string' },
          },
        },
      },
    },
    required: ['contractId'],
  },
};

export async function handler(args, { client }) {
  const { contractId, ...body } = args;
  const res = await client.patch(`/api/v1/contracts/${encodeURIComponent(contractId)}`, { body });
  if (!res.ok) {
    return { content: [{ type: 'text', text: formatBackendError(res) }], isError: true };
  }
  return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
}
