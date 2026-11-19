// Validates server.json against the official MCP Registry schema it declares in "$schema",
// and checks the icon URLs answer with the declared type.
import { readFileSync } from 'node:fs';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const server = JSON.parse(readFileSync(new URL('../server.json', import.meta.url), 'utf8'));
const schema = await (await fetch(server.$schema)).json();
delete schema.$schema; // draft-07, Ajv's default

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);
if (!validate(server)) {
	console.error(validate.errors);
	process.exit(1);
}
console.log(`ok - server.json matches ${server.$schema}`);

for (const icon of server.icons ?? []) {
	const res = await fetch(icon.src, { method: 'HEAD' });
	const type = res.headers.get('content-type') ?? '';
	if (!res.ok || !type.startsWith(icon.mimeType)) {
		console.error(`${icon.src}: HTTP ${res.status}, ${type} (expected ${icon.mimeType})`);
		process.exit(1);
	}
	console.log(`ok - icon ${icon.src}`);
}
