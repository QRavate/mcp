// Checks that the live MCP server still does what MCP clients expect before they sign in:
// initialize and tools/list work without a token (on-demand sign-in), an account tool answers 401 pointing to the OAuth
// metadata, then OAuth 2.1 metadata with dynamic client registration and PKCE.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const server = JSON.parse(readFileSync(new URL('../server.json', import.meta.url), 'utf8'));
const url = process.env.MCP_URL ?? server.remotes[0].url;
const step = async (name, fn) => {
	await fn();
	console.log(`ok - ${name}`);
};

const rpc = (method, params) =>
	fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
		body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
	});

await step(`initialize without a token reports version ${server.version}`, async () => {
	const res = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'qravate-mcp-check', version: '1' } });
	assert.equal(res.status, 200);
	assert.equal((await res.json()).result.serverInfo.version, server.version);
});

await step('tools/list without a token lists every tool, each with its security schemes', async () => {
	const { result } = await (await rpc('tools/list', {})).json();
	assert.ok(result.tools.length >= 15, `only ${result.tools.length} tools`);
	for (const tool of result.tools) assert.ok(tool.securitySchemes?.length, `no securitySchemes on ${tool.name}`);
});

let resourceMetadataUrl;
await step('an account tool without a token answers 401 with resource_metadata', async () => {
	const res = await rpc('tools/call', { name: 'get_account', arguments: {} });
	assert.equal(res.status, 401);
	resourceMetadataUrl = /resource_metadata="([^"]+)"/.exec(res.headers.get('www-authenticate') ?? '')?.[1];
	assert.ok(resourceMetadataUrl, `no resource_metadata in WWW-Authenticate: ${res.headers.get('www-authenticate')}`);
});

let authorizationServer;
await step('protected resource metadata', async () => {
	const meta = await (await fetch(resourceMetadataUrl)).json();
	assert.equal(meta.resource, url);
	assert.ok(meta.authorization_servers?.length, 'no authorization server');
	authorizationServer = meta.authorization_servers[0];
});

await step('authorization server metadata (registration, PKCE S256)', async () => {
	const meta = await (await fetch(new URL('/.well-known/oauth-authorization-server', authorizationServer))).json();
	assert.equal(meta.issuer, authorizationServer);
	for (const key of ['authorization_endpoint', 'token_endpoint', 'registration_endpoint']) assert.ok(meta[key], `missing ${key}`);
	assert.ok(meta.code_challenge_methods_supported?.includes('S256'), 'PKCE S256 not supported');
});
