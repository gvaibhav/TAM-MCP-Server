# MCP feature status

Last verified: 2026-10-16.

## Implemented

| Capability | Status |
|---|---|
| Tools | 28 definitions; validation and MCP `isError` signaling enabled |
| Prompts | List/get handlers with 15 business prompt templates |
| Resources | Nine static Markdown resources with list/read handlers |
| Streamable HTTP | Primary Docker transport at `/mcp`; session resumability uses an in-memory event store |
| STDIO | Supported for local MCP clients |
| Legacy SSE | Retained for compatibility; not the recommended deployment transport |
| Health | `/health` reports process and active-session status |
| Notifications | Standard progress/logging plus namespaced TAM extension notifications |
| Errors | Provider and handled analytical failures return `isError: true` |

The server advertises tool, prompt, and resource list-change support. Resources are static, so resource subscriptions are not advertised.

## Notification behavior

Notifications are enabled by default and can be disabled with `MCP_NOTIFICATIONS_ENABLED=false`.

- Progress notifications are sent only when the client supplied a progress token.
- Result/error details are summarized before notification delivery to avoid duplicating large provider payloads or exposing request configuration.
- Cache notifications must represent measured cache events. The previous simulated cache hit-rate notification was removed.
- `notifications/message` and `notifications/progress` are standard MCP notifications.
- `notifications/market_analysis`, `notifications/data_source_health`, `notifications/market_intelligence`, `notifications/data_quality`, `notifications/cache_performance`, `notifications/calculation_milestone`, `notifications/api_rate_limit`, and `notifications/error` are TAM-specific extensions. Clients may ignore unknown notification methods.

## Protocol and SDK

- Runtime: Node.js 22 container.
- TypeScript SDK: `@modelcontextprotocol/sdk` 1.32.1 (maintained v1 compatibility line).
- Current transport behavior remains compatible with the 2025 protocol family, including `2025-11-25` negotiation.
- The 2026-07-28 MCP protocol and TypeScript SDK v2 introduce a stateless HTTP core, extension subscriptions, package splitting, and breaking notification/transport changes. That migration should be performed as a dedicated major-version change rather than mixed into a dependency refresh.

## Recommended v2 migration

1. Replace the monolithic SDK package with the v2 server/core/node transport packages.
2. Replace per-session HTTP server instances and the in-memory transport map with the stateless handler model.
3. Move long-running calculations to the Tasks extension.
4. Deliver extension notifications through `subscriptions/listen` and support a shared event bus before horizontal scaling.
5. Add authentication and audience validation before exposing remote HTTP beyond localhost.
6. Add protocol conformance tests for `2025-11-25` and `2026-07-28` clients before changing the advertised revision.
