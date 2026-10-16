# Notifications implementation

The server emits MCP notifications over STDIO, Streamable HTTP, and the retained legacy SSE transport. Notifications can be disabled with `MCP_NOTIFICATIONS_ENABLED=false`.

## Standard MCP notifications

- `notifications/message`: operational logging messages.
- `notifications/progress`: progress for a request. This is sent only when the client supplied a progress token.
- `notifications/tools/list_changed`, `notifications/prompts/list_changed`, and `notifications/resources/list_changed`: supported by the advertised server capabilities when a runtime list changes. The current lists are static.

## TAM extension notifications

The following custom methods are extensions and may be ignored by generic clients:

- `notifications/market_analysis`
- `notifications/error`
- `notifications/data_source_health`
- `notifications/market_intelligence`
- `notifications/data_quality`
- `notifications/cache_performance`
- `notifications/calculation_milestone`
- `notifications/api_rate_limit`

Extension payloads include timestamps and domain-specific fields. Large tool/provider results are summarized before notification delivery. Cache events are emitted only when measured; simulated cache hit rates were removed.

## Client guidance

Clients must tolerate unknown notification methods. Notifications are advisory and never replace the corresponding tool result. A failed tool call is represented by `isError: true` independently of any error notification.

The current SDK v1 transport sends notifications on the established session. A future 2026-07-28/v2 migration will move extension delivery to the protocol subscription model; see [MCP_FEATURE_STATUS.md](../../MCP_FEATURE_STATUS.md).

## Verification

Unit coverage is in `tests/unit/notification-service.test.ts`. End-to-end notification coverage must use a real MCP client and the Streamable HTTP endpoint; the older standalone SSE scripts are compatibility tests, not proof of current protocol conformance.
