/**
 * add_machine_term — attach a programmable IF/THEN to a contract.
 *
 * A machine term declares when a specific event satisfies a condition
 * the contract should fire an action — typically escrow.release on
 * payload.delivered. The contract enforces the predicate server-side
 * and writes the firing to the tamper-evident audit chain.
 *
 * Maps to POST /api/v1/contracts/:id/terms.
 */

import { formatBackendError } from '../../client.js';

export const definition = {
  name: 'add_machine_term',
  description: 'Attach a machine-readable IF/THEN term to a contract. When the term\'s when+condition matches a reported event, the term\'s action fires (escrow.release / milestone.approve / notify / webhook.fire). Owner orgs (qc_live_*) and agents on the contract (qc_agnt_*) can both author terms.',
  inputSchema: {
    type: 'object',
    properties: {
      contractId: { type: 'string', description: 'The contract id.' },
      id: {
        type: 'string',
        description: 'Optional caller-supplied term id. If omitted, the server generates one.',
      },
      label: {
        type: 'string',
        description: 'Human-readable label shown on the permalink.',
      },
      when: {
        type: 'object',
        description: 'Trigger spec.',
        properties: {
          event: {
            type: 'string',
            enum: ['payload.delivered', 'milestone.completed', 'data.verified', 'deadline.passed'],
          },
        },
        required: ['event'],
      },
      condition: {
        type: 'object',
        description: 'Predicate guards. All keys ANDed. Supported: schemaMatch (string), before/after (ISO 8601), partyOfRecord (partyA|partyB|agent:<id>), valueGte/valueLte (number), contentHashEquals (hex).',
      },
      then: {
        type: 'object',
        description: 'Action to fire.',
        properties: {
          action: {
            type: 'string',
            enum: ['escrow.release', 'milestone.approve', 'notify', 'webhook.fire'],
          },
          args: {
            type: 'object',
            description: 'Action-specific args. escrow.release / milestone.approve require { milestoneId }.',
          },
        },
        required: ['action'],
      },
    },
    required: ['contractId', 'when', 'then'],
  },
};

export async function handler(args, { client }) {
  const { contractId, ...body } = args;
  const res = await client.post(
    `/api/v1/contracts/${encodeURIComponent(contractId)}/terms`,
    { body },
  );
  if (!res.ok) {
    return { content: [{ type: 'text', text: formatBackendError(res) }], isError: true };
  }
  return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
}
