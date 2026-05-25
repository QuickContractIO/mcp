/**
 * create_contract — produce a new draft contract from a template.
 * Maps to POST /api/v1/contracts.
 *
 * Mandate gate (when caller is an agent): templateId must be in
 * mandate.limits.allowedTemplateIds (if set). Enforced server-side
 * — the typed reject envelope surfaces here as an MCP error.
 */

import { formatBackendError } from '../../client.js';

export const definition = {
  name: 'create_contract',
  description: 'Create a new draft contract from a template. Fill in template fields via filledFields. When the caller is an agent (qc_agnt_ key), the templateId must be in the agent\'s mandate.limits.allowedTemplateIds (server-enforced).',
  inputSchema: {
    type: 'object',
    properties: {
      templateId: {
        type: 'string',
        description: 'Template id to instantiate. Use list_templates / get_template to discover.',
      },
      contractName: {
        type: 'string',
        description: 'Optional name. Defaults to the template name.',
      },
      filledFields: {
        type: 'object',
        description: "Key-value map of field name → string. Keys come from get_template's fields[].key.",
        additionalProperties: { type: 'string' },
      },
      locale: { type: 'string', description: "Default 'en'." },
      currency: { type: 'string', description: "Default 'USD'." },
    },
    required: ['templateId'],
  },
};

export async function handler(args, { client }) {
  const res = await client.post('/api/v1/contracts', {
    body: {
      templateId: args.templateId,
      contractName: args.contractName,
      filledFields: args.filledFields || {},
      locale: args.locale,
      currency: args.currency,
    },
  });
  if (!res.ok) {
    return { content: [{ type: 'text', text: formatBackendError(res) }], isError: true };
  }
  return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
}
