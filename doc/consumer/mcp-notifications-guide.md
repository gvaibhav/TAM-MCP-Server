# MCP notifications guide

Notifications are enabled by default. Set `MCP_NOTIFICATIONS_ENABLED=false` to disable them.

The server uses standard `notifications/message` logging and token-bound `notifications/progress`. It also emits TAM-specific extension methods for calculation state, provider health, data quality, cache events, market insights, and errors. Clients should ignore extension methods they do not recognize.

Example extension notification:

```json
{
  "method": "notifications/data_source_health",
  "params": {
    "source": "fred",
    "status": "healthy",
    "latency_ms": 184,
    "last_successful_call": "2026-10-16T18:00:00.000Z",
    "message": "Series observations completed successfully in 184ms",
    "timestamp": "2026-10-16T18:00:00.000Z"
  }
}
```

Notifications are advisory. Always use the associated tool result as the authoritative response and check its MCP `isError` field. Notification payloads summarize provider responses rather than repeating full datasets.

For the complete method list and protocol status, read `tam://mcp-status` through MCP resources or see [MCP_FEATURE_STATUS.md](../../MCP_FEATURE_STATUS.md).
