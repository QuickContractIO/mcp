/**
 * MCP prompts — pre-canned conversational templates the LLM client
 * can use as starting points. Each one references the relevant tools
 * (contract retrieval, AI analysis) so the LLM can chain them
 * without re-prompting.
 *
 * These are surface-level conveniences. The heavy lifting lives in
 * the backend AI services (analyze, semantic-diff, obligations); the
 * prompts just give the LLM a coherent script for invoking them.
 */

export const promptList = [
  {
    name: 'negotiate_clause',
    description: 'Negotiate a specific clause on a contract. Reads the contract, identifies the named clause, suggests counter-language or accept criteria, and (optionally) drafts a comment via the negotiation API.',
    arguments: [
      { name: 'contractId', description: 'The contract id.', required: true },
      { name: 'clauseId', description: 'The section/clause id to focus on.', required: true },
      { name: 'stance', description: "What you want: 'soften', 'tighten', 'accept', 'reject'.", required: false },
    ],
  },
  {
    name: 'draft_counter_offer',
    description: 'Draft a counter-offer for an inbound contract. Reads the contract via get_contract, runs analyze_contract for risk surfaces, and produces a structured set of counter-proposals.',
    arguments: [
      { name: 'contractId', description: 'The contract id.', required: true },
      { name: 'priorities', description: 'Comma-separated list of priorities (payment, liability, IP, term).', required: false },
    ],
  },
  {
    name: 'risk_assessment',
    description: 'Run a full risk assessment on a contract. Pulls the obligations + the AI analysis, summarises the top 5 risks by severity, and recommends mitigations.',
    arguments: [
      { name: 'contractId', description: 'The contract id.', required: true },
    ],
  },
  {
    name: 'summarize_contract',
    description: 'One-paragraph plain-English summary of a contract. Useful as a pre-read before signing.',
    arguments: [
      { name: 'contractId', description: 'The contract id.', required: true },
    ],
  },
  {
    name: 'extract_obligations',
    description: 'Extract structured obligations from a contract. Wraps get_obligations and formats the result as a checklist with dates.',
    arguments: [
      { name: 'contractId', description: 'The contract id.', required: true },
    ],
  },
];

export function getPromptMessages(name, args) {
  const c = args?.contractId || '<contractId>';
  switch (name) {
    case 'negotiate_clause':
      return [{
        role: 'user',
        content: {
          type: 'text',
          text: [
            `Use the QuickContract tools to negotiate a clause.`,
            `Steps:`,
            `1. Call get_contract with contractId="${c}".`,
            `2. Locate the clause with id="${args?.clauseId || '<clauseId>'}".`,
            `3. Read the surrounding context to understand the intent.`,
            `4. Given the stance "${args?.stance || 'soften'}", draft a counter-clause.`,
            `5. Present the counter-clause + a one-line rationale.`,
          ].join('\n'),
        },
      }];

    case 'draft_counter_offer':
      return [{
        role: 'user',
        content: {
          type: 'text',
          text: [
            `Draft a counter-offer for contract "${c}".`,
            `Steps:`,
            `1. Call get_contract.`,
            `2. Call analyze_contract for risk surfaces.`,
            `3. For each priority area ${args?.priorities || '(payment, liability, IP, term)'}, propose one specific change.`,
            `4. Output the result as a list: { area, current_language, proposed_language, why }.`,
          ].join('\n'),
        },
      }];

    case 'risk_assessment':
      return [{
        role: 'user',
        content: {
          type: 'text',
          text: [
            `Assess risk on contract "${c}".`,
            `1. Call get_contract + get_obligations.`,
            `2. Identify the top 5 risks by severity.`,
            `3. For each, propose one concrete mitigation.`,
            `4. Output as a table: { risk, severity, mitigation }.`,
          ].join('\n'),
        },
      }];

    case 'summarize_contract':
      return [{
        role: 'user',
        content: {
          type: 'text',
          text: `Summarise contract "${c}" in one plain-English paragraph. Use get_contract.`,
        },
      }];

    case 'extract_obligations':
      return [{
        role: 'user',
        content: {
          type: 'text',
          text: `Call get_obligations with contractId="${c}" and format the result as a checklist with dates.`,
        },
      }];

    default:
      return [{ role: 'user', content: { type: 'text', text: `Unknown prompt: ${name}` } }];
  }
}
