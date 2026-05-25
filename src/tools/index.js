/**
 * Tool registry — central index of all MCP tools exposed by the
 * QuickContract server. Each tool module exports { definition, handler }:
 *
 *   - `definition` is the JSON Schema descriptor the MCP client (LLM)
 *     reads to understand inputs + outputs + when to call the tool.
 *   - `handler` is an async function `(args, ctx)` that returns the
 *     MCP result shape `{ content: [{ type: 'text', text: '...' }] }`
 *     or `{ content: [...], isError: true }` on rejection.
 *
 * READ tools work with either a raw org key (qc_live_*) or an agent
 * key (qc_agnt_*) — they only need the org context that comes from
 * the API key.
 *
 * WRITE tools are mandate-gated: most require the caller to be an
 * agent (qc_agnt_*) so the backend can enforce mandate limits
 * (value cap + template + counterparty + jurisdiction). A raw org
 * key can still call create_contract / add_recipient / send_contract
 * — but cannot call sign_as_agent or release_milestone.
 */

// READ tools — no mandate dependency.
import * as listContracts from './read/list-contracts.js';
import * as listPendingApprovals from './read/list-pending-approvals.js';
import * as getContract from './read/get-contract.js';
import * as getContractStatus from './read/get-contract-status.js';
import * as verifyHash from './read/verify-hash.js';
import * as listTemplates from './read/list-templates.js';
import * as getTemplate from './read/get-template.js';
import * as getOrganization from './read/get-organization.js';
import * as getAuditLog from './read/get-audit-log.js';
import * as getObligations from './read/get-obligations.js';

// WRITE tools — Phase 6.4 + 6.5 dependencies for signing + programmable terms.
import * as createContract from './write/create-contract.js';
import * as updateContract from './write/update-contract.js';
import * as sendContract from './write/send-contract.js';
import * as addRecipient from './write/add-recipient.js';
import * as signAsAgent from './write/sign-as-agent.js';
import * as releaseMilestone from './write/release-milestone.js';
import * as addMachineTerm from './write/add-machine-term.js';
import * as reportEvent from './write/report-event.js';

const ALL = [
  listContracts,
  listPendingApprovals,
  getContract,
  getContractStatus,
  verifyHash,
  listTemplates,
  getTemplate,
  getOrganization,
  getAuditLog,
  getObligations,
  createContract,
  updateContract,
  sendContract,
  addRecipient,
  signAsAgent,
  releaseMilestone,
  addMachineTerm,
  reportEvent,
];

export function listAllTools() {
  return ALL.map((m) => m.definition);
}

export function findToolHandler(name) {
  const mod = ALL.find((m) => m.definition.name === name);
  return mod?.handler || null;
}
