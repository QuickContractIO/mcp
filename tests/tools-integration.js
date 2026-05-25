/**
 * Smoke test for the QuickContract MCP server. Verifies:
 *   - Every tool module exports { definition, handler }
 *   - Every tool definition has a unique name
 *   - Every tool handler is a function
 *   - All 16 expected tools are present (9 READ + 7 WRITE)
 *   - Resources + prompts registries are loaded
 *   - QcClient construction with QC_API_KEY works and rejects without it
 *
 * Run with:
 *   QC_API_KEY=qc_live_smoke node tests/tools-integration.js
 *
 * For end-to-end integration with a running backend, set
 * QC_BASE_URL=http://localhost:5001 and a real API key, then invoke
 * via Claude Desktop or the @modelcontextprotocol/inspector.
 */

import { listAllTools, findToolHandler } from '../src/tools/index.js';
import { resourceList } from '../src/resources/index.js';
import { promptList } from '../src/prompts/index.js';
import { QcClient } from '../src/client.js';

let failed = 0;
let passed = 0;

function check(label, condition, detail) {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${label}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

console.log('\n=== QuickContract MCP — smoke test ===\n');

// ── Tools ──
const tools = listAllTools();
check('listAllTools() returns an array', Array.isArray(tools));
check('17 tools registered (9 READ + 8 WRITE — Phase 6.5 adds add_machine_term)', tools.length === 17, `got ${tools.length}`);

const names = tools.map((t) => t.name);
const uniqueNames = new Set(names);
check('Tool names are unique', uniqueNames.size === names.length);

const expectedReadTools = [
  'list_contracts', 'get_contract', 'get_contract_status', 'verify_hash',
  'list_templates', 'get_template', 'get_organization', 'get_audit_log',
  'get_obligations',
];
const expectedWriteTools = [
  'create_contract', 'update_contract', 'send_contract', 'add_recipient',
  'sign_as_agent', 'release_milestone', 'add_machine_term', 'report_event',
];
for (const expected of [...expectedReadTools, ...expectedWriteTools]) {
  check(`tool "${expected}" registered`, names.includes(expected));
}

for (const t of tools) {
  check(`tool "${t.name}" has description`, typeof t.description === 'string' && t.description.length > 0);
  check(`tool "${t.name}" has inputSchema`, t.inputSchema && t.inputSchema.type === 'object');
  const handler = findToolHandler(t.name);
  check(`tool "${t.name}" has handler function`, typeof handler === 'function');
}

// ── Resources ──
check('resourceList exposes 4 URI schemes', resourceList.length === 4, `got ${resourceList.length}`);
const resourceSchemes = resourceList.map((r) => r.uri.split('://')[0]);
for (const expected of ['contract', 'template', 'audit', 'agent']) {
  check(`resource scheme "${expected}://" registered`, resourceSchemes.includes(expected));
}

// ── Prompts ──
check('promptList exposes 5 prompts', promptList.length === 5, `got ${promptList.length}`);
const promptNames = promptList.map((p) => p.name);
for (const expected of ['negotiate_clause', 'draft_counter_offer', 'risk_assessment', 'summarize_contract', 'extract_obligations']) {
  check(`prompt "${expected}" registered`, promptNames.includes(expected));
}

// ── QcClient ──
try {
  const c = new QcClient({ apiKey: 'qc_live_smoke', baseUrl: 'http://localhost:0' });
  check('QcClient constructs with apiKey + baseUrl', c.apiKey === 'qc_live_smoke' && c.baseUrl === 'http://localhost:0');
} catch (err) {
  check('QcClient constructs with apiKey + baseUrl', false, err.message);
}

try {
  // Should throw because QC_API_KEY isn't set and we passed no apiKey.
  const before = process.env.QC_API_KEY;
  delete process.env.QC_API_KEY;
  let threw = false;
  try { new QcClient({}); } catch (_e) { threw = true; }
  if (before) process.env.QC_API_KEY = before;
  check('QcClient throws when no apiKey + env not set', threw);
} catch (err) {
  check('QcClient throws when no apiKey + env not set', false, err.message);
}

console.log(`\nResult: ${passed} passed / ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
