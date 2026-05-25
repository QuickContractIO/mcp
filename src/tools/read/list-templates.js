/**
 * list_templates — base + user templates available to the org.
 * Maps to GET /api/v1/templates.
 */

import { formatBackendError } from '../../client.js';

export const definition = {
  name: 'list_templates',
  description: 'List available contract templates (62 human-vetted base templates across 12 industry categories, plus your org\'s custom templates). Filter by category or jurisdiction.',
  inputSchema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        description: 'Filter to one category. One of: freelance, agency, startup, ip, sales, hr, real-estate, ecommerce, construction, healthcare, education, events.',
      },
      jurisdiction: {
        type: 'string',
        description: "Filter by jurisdiction. One of: US, ES, UK, FR, DE, EU.",
      },
      query: { type: 'string', description: 'Substring search against template name.' },
    },
  },
};

export async function handler(args, { client }) {
  const res = await client.get('/api/v1/templates', {
    query: {
      category: args.category,
      jurisdiction: args.jurisdiction,
      q: args.query,
    },
  });
  if (!res.ok) {
    return { content: [{ type: 'text', text: formatBackendError(res) }], isError: true };
  }
  return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
}
