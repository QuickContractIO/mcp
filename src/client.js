/**
 * QuickContract HTTP client — used by every tool, resource, and prompt.
 *
 * Reads QC_API_KEY from the environment and signs every request with
 * x-api-key. Base URL defaults to https://api.quickcontract.io but can
 * be overridden via QC_BASE_URL (useful for staging or local dev).
 *
 * Surfaces typed errors so tool handlers can map backend reject envelopes
 * onto MCP error responses without re-parsing JSON bodies. The MCP spec
 * wants tool errors as plain text in the result; we encode the typed
 * reason so an LLM client can detect, e.g., mandate_exceeded_value_cap
 * and adjust strategy accordingly.
 */

const DEFAULT_BASE_URL = 'https://api.quickcontract.io';

export class QcClient {
  constructor({ apiKey, baseUrl, debug } = {}) {
    this.apiKey = apiKey || process.env.QC_API_KEY;
    this.baseUrl = (baseUrl || process.env.QC_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.debug = debug ?? !!process.env.QC_DEBUG;
    if (!this.apiKey) {
      throw new Error(
        'QuickContract MCP: QC_API_KEY env var is required.\n' +
        'Generate one at https://quickcontract.io/settings/api-keys'
      );
    }
  }

  /**
   * Low-level fetch with x-api-key + JSON serialization. Returns
   * { status, data, ok }. Never throws on HTTP non-2xx — the caller
   * inspects status/data so it can map mandate-reject envelopes onto
   * MCP error responses.
   */
  async request(method, path, { body, query, headers = {}, idempotencyKey } = {}) {
    const url = new URL(`${this.baseUrl}${path}`);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
      }
    }

    const reqHeaders = {
      'x-api-key': this.apiKey,
      Accept: 'application/json',
      'User-Agent': `@quickcontract/mcp/0.1.0 (node/${process.version})`,
      ...headers,
    };
    if (idempotencyKey) reqHeaders['Idempotency-Key'] = idempotencyKey;
    if (body !== undefined) reqHeaders['Content-Type'] = 'application/json';

    if (this.debug) {
      // stderr never collides with stdio JSON-RPC.
      console.error(`[qc-mcp] ${method} ${url.pathname}${url.search}`);
    }

    let res;
    try {
      res = await fetch(url, {
        method,
        headers: reqHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (err) {
      // Network or DNS failure — surface a typed error.
      return {
        ok: false,
        status: 0,
        data: { error: 'network_error', detail: err.message },
      };
    }

    let data = null;
    const text = await res.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: 'non_json_response', raw: text.slice(0, 512) };
      }
    }
    return { ok: res.ok, status: res.status, data };
  }

  get(path, opts) { return this.request('GET', path, opts); }
  post(path, opts) { return this.request('POST', path, opts); }
  patch(path, opts) { return this.request('PATCH', path, opts); }
  del(path, opts) { return this.request('DELETE', path, opts); }
}

/**
 * Format a non-2xx response from the backend as a human-readable MCP
 * tool result. Maps the typed reject codes (mandate_exceeded_*,
 * capability_not_granted, etc.) onto a single line a calling agent
 * can switch on.
 */
export function formatBackendError({ status, data }) {
  if (!data) return `HTTP ${status} (no body)`;
  if (data.reason) {
    // Mandate-style envelope: { error, reason, detail, agentId }.
    return [
      `HTTP ${status} — ${data.error || 'rejected'}`,
      `reason: ${data.reason}`,
      data.detail ? `detail: ${data.detail}` : null,
      data.agentId ? `agentId: ${data.agentId}` : null,
    ].filter(Boolean).join('\n');
  }
  if (data.error) {
    return `HTTP ${status} — ${data.error}${data.detail ? `: ${data.detail}` : ''}`;
  }
  return `HTTP ${status} — ${JSON.stringify(data).slice(0, 256)}`;
}
