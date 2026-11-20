# QRavate MCP server

[![CI](https://github.com/QRavate/mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/QRavate/mcp/actions/workflows/ci.yml)
[![Live server check](https://github.com/QRavate/mcp/actions/workflows/check-server.yml/badge.svg)](https://github.com/QRavate/mcp/actions/workflows/check-server.yml)

Create and manage [QRavate](https://www.qravate.com) dynamic QR codes from Claude, ChatGPT, Le Chat, Cursor, VS Code and any assistant that supports remote [MCP](https://modelcontextprotocol.io) servers. Ask in plain words: "create a QR code for our spring menu, in our brand colours, with a 'Scan me' label", then change where it points later without reprinting it.

```
https://www.qravate.com/mcp
```

It is a **remote server**: nothing to install or host. Every tool works with your QRavate account: the assistant asks you to sign in (OAuth 2.1) the first time it calls one, and only acts on the workspace you choose.

This repository holds the server's listing in the [official MCP Registry](https://registry.modelcontextprotocol.io) (`server.json`, as `com.qravate/qr-codes`) and the setup guides. The server itself runs on QRavate's infrastructure.

## Connect it

| Assistant | How |
|---|---|
| **Claude** (web, desktop, mobile) | Settings → Connectors → **Add custom connector**, then paste the URL. |
| **ChatGPT** | Settings → Apps & Connectors → enable developer mode, then **Create** a connector with the URL. |
| **Le Chat** (Mistral) | Connectors → **Add an MCP connector**, then paste the URL. |
| **Claude Code** | `claude mcp add --transport http qravate https://www.qravate.com/mcp` |
| **Cursor** | See below |
| **VS Code** | See below |
| **Gemini CLI** | See below |

**Cursor**, in `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "qravate": { "url": "https://www.qravate.com/mcp" }
  }
}
```

**VS Code**, in `.vscode/mcp.json`:

```json
{
  "servers": {
    "qravate": { "type": "http", "url": "https://www.qravate.com/mcp" }
  }
}
```

**Gemini CLI**, in `~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "qravate": { "httpUrl": "https://www.qravate.com/mcp" }
  }
}
```

The first time the assistant calls a QRavate tool, it opens a QRavate sign-in page. New accounts confirm their email address with a 6-digit code on that page, then go straight back to the conversation. You can disconnect an assistant at any time from your QRavate account.

## Tools

| Tool | What it does |
|---|---|
| `list_design_options` | Lists ready-made styles, centre icons (Wi-Fi, menu, reviews, PDF, video…), shapes and frames |
| `create_static_qr_code` | Creates a static QR code: Wi-Fi, text, email, phone, SMS, vCard or fixed URL |
| `create_qr_code` | Creates a dynamic QR code, with its design and a readability check |
| `get_account` | Plan, QR code quota and included features |
| `list_qr_codes` | Lists the workspace's QR codes, with search by name or destination |
| `get_qr_code` | Details of a QR code, with its image (preview, PNG and SVG downloads) |
| `update_destination` | Changes where a QR code points. The printed code stays valid. |
| `update_qr_design` | Changes the look of a QR code (style, colours, icon or logo, label) |
| `set_qr_state` | Pauses or resumes a QR code |
| `set_redirect_rules` | Sends scanners to different destinations by device, system, language, country, day, time or date, with A/B tests |
| `schedule_destination_change` | Schedules a destination change at a given date |
| `set_gs1_product` | Links a product (GTIN) to a QR code, following GS1 Digital Link |
| `get_stats` | Scans over a period: per day, country, device |
| `compare_stats` | Compares the scans of several QR codes, e.g. one per shop |
| `export_qr_codes` | CSV export of QR codes, destinations and scans |

Every tool needs sign-in. Tools that only read are marked as read-only for the assistant, and tools that replace what a printed code shows (destination, design, rules, schedule, pause, GS1) as destructive, so the assistant asks before running them. Some tools depend on the QRavate plan, and the number of actions per day depends on the plan too: the assistant says so when a tool is not included, with a link to the plans.

## Security and privacy

- Sign-in uses OAuth 2.1 with PKCE, dynamic client registration or Client ID Metadata Documents, on demand, at the first tool call. The assistant never sees your password, and you can revoke its access from your QRavate account.
- Permissions are split into reading (`qr:read`) and changing (`qr:write`) QR codes.
- What QRavate does with your data: [privacy policy](https://www.qravate.com/legal/privacy).
- Found a security problem? See the [security policy](https://github.com/QRavate/.github/blob/main/SECURITY.md).

## Maintaining the listing

```bash
npm install
npm run validate       # server.json against the official schema, icons online
npm run check-server   # the live server: tool list without a token, 401 on tool calls, OAuth metadata, registration, PKCE
```

`check-server` also runs every week and opens an issue if the live server stops answering what clients expect.

**Publishing a new version** to the MCP Registry:

1. Set `version` in `server.json` to the version the server reports (`McpServer` in the QRavate service), and add a line to `CHANGELOG.md`.
2. Merge, then push a tag with the same version: `git tag 2.0.0 && git push --tags`.
3. The [publish workflow](.github/workflows/publish.yml) validates `server.json`, signs in to the registry and publishes.

**One-time setup of the publish workflow** (domain authentication for `com.qravate/*`):

```bash
openssl genpkey -algorithm Ed25519 -out key.pem
# TXT record to add on the apex of qravate.com:
echo "v=MCPv1; k=ed25519; p=$(openssl pkey -in key.pem -pubout -outform DER | tail -c 32 | base64)"
# Private key (hex) for the MCP_PRIVATE_KEY secret:
openssl pkey -in key.pem -noout -text | sed -n '/priv:/,/pub:/p' | sed '1d;$d' | tr -d ' :\n'
```

Store the private key as the `MCP_PRIVATE_KEY` secret of a `mcp-registry-publish` environment (Settings → Environments), limited to tags, then delete `key.pem`.
