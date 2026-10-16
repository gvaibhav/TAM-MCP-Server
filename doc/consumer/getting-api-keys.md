# Getting API keys

Use the maintained [API key setup guide](../../API_KEY_SETUP.md). It records which providers require keys, which offer public access, the exact environment-variable names, and the most recently verified adapter status.

Provider quotas and free-tier endpoint entitlements change frequently. Consult each provider's official account dashboard rather than relying on hard-coded quotas in this repository.

Store keys only in `.env` or a deployment secret manager. Never commit `.env`, paste keys into logs, or use `docker compose config` in shared output because Compose expands secret values.
