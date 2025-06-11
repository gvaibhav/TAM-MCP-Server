# MCP Inspector Configuration

## TAM MCP Server Configuration for MCP Inspector

When using the MCP Inspector with the TAM MCP Server, use the following configuration:

### Recommended Configuration

**Transport Type**: STDIO

**Command**: `node`

**Args**: `dist/index.js`

**Working Directory**: `/home/gvaibhav/Documents/TAM-MCP-Server`

**Environment Variables**: 
```json
{
  "ALPHA_VANTAGE_API_KEY": "BLHGYXFEFU005BJV",
  "CENSUS_API_KEY": "8166339a5a130efca276051179114715fd8b45c",
  "FRED_API_KEY": "c43006113aad04168de38dfb5bd35a1c",
  "BLS_API_KEY": "2b8c36bbb8bd4958939330362c3ca5f0",
  "NASDAQ_DATA_LINK_API_KEY": "P7nTi8kKkV1yqYNsw_zR"
}
```

### Alternative Configuration (Direct Binary)

**Command**: `./dist/index.js`

**Args**: (leave empty)

**Working Directory**: `/home/gvaibhav/Documents/TAM-MCP-Server`

## Important Notes

1. **Do NOT use** `npm run start` as it outputs npm verbose messages that contaminate the JSON-RPC stream
2. Make sure to run `npm run build` first to ensure the `dist/` directory is up to date
3. The server automatically detects STDIO mode and disables console logging to avoid interference
4. All debug/log messages go to `logs/` files when in STDIO mode

## Quick Test

You can test the server locally with:

```bash
cd /home/gvaibhav/Documents/TAM-MCP-Server
echo '{"jsonrpc":"2.0","id":"test","method":"tools/list"}' | node dist/index.js
```

This should output clean JSON-RPC response without any console messages.
