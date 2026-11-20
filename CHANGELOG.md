# Changelog

Versions follow the version reported by the QRavate MCP server.

## 2.2.0

- Every tool requires a QRavate account, static QR codes and design options included. Connecting the server and listing its tools still work without one: the assistant asks you to sign in at the first tool call.

## 2.1.0

- On-demand sign-in: `list_design_options` and `create_static_qr_code` work without an account; the assistant asks you to sign in only when it calls an account tool (HTTP 401 for Claude, a tool error with `mcp/www_authenticate` for ChatGPT).
- Every tool declares its `securitySchemes` and complete annotations (`readOnlyHint`, `destructiveHint`, `openWorldHint`).
- Read-only access that calls a write tool is asked to authorize write access again (`insufficient_scope`).
- Sign-up from an assistant confirms the email address with a 6-digit code, so the assistant can create QR codes right after sign-in.
- Client ID Metadata Documents (CIMD) supported, next to dynamic client registration.

## 2.0.0

- One server for every QRavate account, at `https://www.qravate.com/mcp`, with OAuth 2.1 sign-in.
- 15 tools: static and dynamic QR codes, design, destination, pause, redirect rules, scheduled changes, GS1 products, stats, comparison and CSV export.
- First listing in the official MCP Registry as `com.qravate/qr-codes`.
