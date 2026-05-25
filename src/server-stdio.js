/**
 * QuickContract MCP server — stdio transport.
 *
 * Drop-in for Claude Desktop, Cursor, Anthropic Agents SDK (local
 * Workbench mode), and any other MCP client that speaks stdio
 * JSON-RPC.
 *
 * Auth: x-api-key from `QC_API_KEY` env var. Raw org keys
 * (qc_live_*) get READ tools; agent keys (qc_agnt_*) also get the
 * mandate-gated WRITE tools.
 *
 * Configuration:
 *   QC_API_KEY=qc_live_... or qc_agnt_...     (required)
 *   QC_BASE_URL=https://api.quickcontract.io  (optional override)
 *   QC_PUBLIC_HOST=quickcontract.io           (optional, for DID resolution)
 *   QC_DEBUG=1                                (optional, stderr request log)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { QcClient } from './client.js';
import { listAllTools, findToolHandler } from './tools/index.js';
import { resourceList, readResource } from './resources/index.js';
import { promptList, getPromptMessages } from './prompts/index.js';

const SERVER_NAME = 'quickcontract';
const SERVER_VERSION = '0.1.0';

async function main() {
  const client = new QcClient();
  const ctx = { client };

  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    },
  );

  // ─── Tools ──────────────────────────────────────────────
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: listAllTools(),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const name = request.params.name;
    const args = request.params.arguments || {};
    const handler = findToolHandler(name);
    if (!handler) {
      return {
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
        isError: true,
      };
    }
    try {
      return await handler(args, ctx);
    } catch (err) {
      return {
        content: [{ type: 'text', text: `Tool ${name} threw: ${err.message}` }],
        isError: true,
      };
    }
  });

  // ─── Resources ──────────────────────────────────────────
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: resourceList,
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    return readResource(request.params.uri, ctx);
  });

  // ─── Prompts ────────────────────────────────────────────
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: promptList,
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    return {
      messages: getPromptMessages(request.params.name, request.params.arguments || {}),
    };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Friendly stderr greeting so the user sees the server's alive when
  // they launch it manually (Claude Desktop hides stderr but that's OK).
  if (process.env.QC_DEBUG) {
    console.error(`[${SERVER_NAME}@${SERVER_VERSION}] connected via stdio`);
    console.error(`[qc-mcp] base url: ${client.baseUrl}`);
    console.error(`[qc-mcp] api key: ${client.apiKey.slice(0, 12)}…`);
  }
}

main().catch((err) => {
  console.error('QuickContract MCP server failed to start:', err);
  process.exit(1);
});
