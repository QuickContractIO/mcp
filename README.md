# @quickcontract/mcp

**MCP server for QuickContract** — sign contracts, release escrow, query
portfolios, and verify on-chain proofs from any MCP-aware AI agent.

Drops into Claude Desktop, Cursor, Anthropic Agents SDK, and OpenAI
Agents in under a minute.

## Install

```sh
npx @quickcontract/mcp --help
# or install globally:
npm i -g @quickcontract/mcp
quickcontract-mcp
```

Requires Node 18+.

## Configure

Generate an API key at <https://quickcontract.io/settings/api-keys>.
Raw org keys start with `qc_live_`; agent-bound keys (with a server-
enforced mandate) start with `qc_agnt_`.

Set the env var:

```sh
export QC_API_KEY="qc_live_..."   # or qc_agnt_...
```

That's it. The server defaults to `https://api.quickcontract.io`.
Override with `QC_BASE_URL` for staging or local dev.

## Wire it into your AI client

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`
(macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "quickcontract": {
      "command": "npx",
      "args": ["-y", "@quickcontract/mcp"],
      "env": {
        "QC_API_KEY": "qc_live_..."
      }
    }
  }
}
```

Restart Claude Desktop. Type `@quickcontract` in any conversation to
invoke tools.

### Cursor

In `.cursor/mcp.json` at the workspace root:

```json
{
  "mcpServers": {
    "quickcontract": {
      "command": "npx",
      "args": ["-y", "@quickcontract/mcp"],
      "env": { "QC_API_KEY": "qc_live_..." }
    }
  }
}
```

### Anthropic Agents SDK (TypeScript)

```ts
import { Agent } from '@anthropic-ai/sdk/agents';
import { StdioMcpTransport } from '@anthropic-ai/sdk/mcp';

const agent = new Agent({
  mcpServers: {
    quickcontract: new StdioMcpTransport({
      command: 'npx',
      args: ['-y', '@quickcontract/mcp'],
      env: { QC_API_KEY: process.env.QC_API_KEY! },
    }),
  },
});
```

### OpenAI Agents SDK (Python)

```python
from openai.agents import Agent, MCPServerStdio

qc = MCPServerStdio(
    name="quickcontract",
    command="npx",
    args=["-y", "@quickcontract/mcp"],
    env={"QC_API_KEY": os.environ["QC_API_KEY"]},
)
agent = Agent(name="contract-agent", mcp_servers=[qc])
```

## What's exposed

### Tools — READ (works with any API key)

- `list_contracts` — paginated list with filters.
- `get_contract` — full structured contract.
- `get_contract_status` — lightweight status / signed-party flags.
- `verify_hash` — public verify by SHA-256 content hash; includes
  `signedBy[]` with agent DIDs for external Ed25519 verification.
- `list_templates` / `get_template` — 62 base templates + your custom.
- `get_organization` — your plan tier + rate limit.
- `get_audit_log` — tamper-evident hash-chained events.
- `get_obligations` — extracted payment terms + dates via Claude.

### Tools — WRITE (mandate-gated for agent keys)

- `create_contract` — instantiate a draft from a template. Agent
  callers: template must be in `mandate.limits.allowedTemplateIds`.
- `update_contract` — edit a draft.
- `send_contract` — move draft → sent_for_review. Agent callers:
  recipient domain must be in `allowedCounterpartyDomains`.
- `add_recipient` — register a human (`kind=human`) or agent
  (`kind=agent`) recipient.
- `sign_as_agent` — produce an Ed25519 signature on a contract.
  Requires a `qc_agnt_*` key. Server enforces capability + the full
  9-code mandate envelope.
- `release_milestone` — release escrow. Non-custodial in both rails.
- `add_machine_term` — attach an IF/THEN to a contract (when payload.delivered + schemaMatch then escrow.release).
- `report_event` — fire a signed event into a contract's machine terms.
  Optional Ed25519 signature provides non-repudiation.

### Resources

- `contract://{id-or-permalink}` — full contract.
- `template://{id}` — template body.
- `audit://{contractId}` — hash-chained log.
- `agent://{didIdentifier}` — public DID Document JSON-LD.

### Prompts

- `negotiate_clause`, `draft_counter_offer`, `risk_assessment`,
  `summarize_contract`, `extract_obligations` — pre-canned scripts
  that chain the AI tools.

## Mandate reject codes

When an agent attempts an action that violates its mandate, the
backend returns a typed envelope. The MCP tool surfaces it as a
single error string with `reason:` line:

| Reason | Trigger |
|---|---|
| `mandate_revoked` | Mandator revoked the mandate. |
| `mandate_expired` | Past `expiresAt`. |
| `capability_not_granted` | Action's capability missing from `capabilities[]`. |
| `mandate_exceeded_value_cap` | Contract value > `maxContractValueCents`. |
| `mandate_exceeded_day_cap` | Daily signed-count > `perDayCap`. |
| `mandate_exceeded_month_cap` | Monthly signed-count > `perMonthCap`. |
| `template_not_allowed` | Template not in `allowedTemplateIds[]`. |
| `counterparty_not_allowed` | Recipient domain not in `allowedCounterpartyDomains[]`. |
| `jurisdiction_not_allowed` | Jurisdiction not in `allowedJurisdictions[]`. |

A calling agent can switch on `reason` to plan an alternative path
(e.g. propose a smaller contract value, or hand off to a human via
`request_approval`).

## Environment variables

| Var | Required | Default | Notes |
|---|---|---|---|
| `QC_API_KEY` | yes | — | `qc_live_*` for org or `qc_agnt_*` for agent. |
| `QC_BASE_URL` | no | `https://api.quickcontract.io` | Override for staging. |
| `QC_PUBLIC_HOST` | no | `quickcontract.io` | Host used to resolve `agent://` DID URIs. |
| `QC_DEBUG` | no | — | Set to any truthy value to stream request log to stderr. |

## License

MIT — see `LICENSE`.

## Links

- Home: <https://quickcontract.io>
- Developer docs: <https://quickcontract.io/developers>
- Agent identity spec: <https://quickcontract.io/developers/agents>
- Public verify (no API key): `https://api.quickcontract.io/api/v1/verify/{contentHash}`
- Status: <https://status.quickcontract.io>
