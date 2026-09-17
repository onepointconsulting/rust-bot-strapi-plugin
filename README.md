# strapi-plugin-assistant

SSO springboard that embeds rust-bot's existing `websockets-chat` UI in the Strapi admin.

The plugin does not implement a second chat client. It exchanges the Strapi admin JWT for a rust-bot JWT (`POST /v1/sso/strapi`) and iframes `{gatewayOrigin}/#token=…`.

## Playground

```
cd playground
npm run develop
```

Admin: `http://localhost:1337/admin`. Config is `playground/config/plugins.ts` → `gatewayOrigin`.

The host Strapi app must allow that origin in CSP (`frame-src` and `connect-src`). The playground does this in `config/middlewares.ts`. Restart Strapi after changing `ASSISTANT_GATEWAY_ORIGIN`.

## Deployment

The plugin is not a server. Deploy it into a **Strapi 5** host app that can reach a running rust-bot **combined gateway** (SSO, static UI, and `/ws` on the same origin — not the REST API port).

Two URLs matter, and they are often different:

| Setting | Who uses it | What it must be |
|---|---|---|
| Plugin `gatewayOrigin` | The **browser** (SSO `fetch` + iframe) | Public URL of the combined gateway, no trailing slash |
| rust-bot `gateway.strapiSso.strapiUrl` | The **rust-bot process** (`GET /admin/users/me`) | URL rust-bot can use to reach this Strapi, no trailing slash |

The plugin never sends a Strapi URL to rust-bot. If SSO returns 401 for a valid admin JWT, `strapiUrl` is wrong.

### 1. Install the plugin

Work **in your Strapi application**, not in this repository. The plugin is not on the npm registry; copy it into the host app and point Strapi at that folder.

```bash
cd /path/to/your-strapi-app
git clone https://github.com/onepointconsulting/rust-bot-strapi-plugin.git src/plugins/assistant
```

### 2. Enable and configure

In the host `config/plugins.ts`, the key is `assistant` (the plugin's Strapi name). `resolve` is the path from the Strapi app root to the clone:

```ts
assistant: {
  enabled: true,
  resolve: './src/plugins/assistant',
  config: {
    gatewayOrigin: env('ASSISTANT_GATEWAY_ORIGIN', 'http://127.0.0.1:18793'),
  },
},
```

Examples:

- Separate gateway host: `https://bot.example.com`
- Reverse-proxied under Strapi (nginx `/rust-bot/`): `https://cms.example.com/rust-bot`

`gatewayOrigin` must be the page that actually serves `websockets-chat`. Pointing it at the Strapi admin origin will iframe Strapi into itself.

### 3. Allow the gateway in CSP

The admin page POSTs to `{gatewayOrigin}/v1/sso/strapi` and iframes that origin. Add both HTTP and WebSocket origins to `config/middlewares.ts` (see `playground/config/middlewares.ts`):

```ts
{
  name: 'strapi::security',
  config: {
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'connect-src': ["'self'", 'https:', ...gatewayOrigins],
        'frame-src': ["'self'", ...frameOrigins],
      },
    },
  },
},
```

Same-origin proxy (admin and `/rust-bot` on one host) is covered by `'self'`. Cross-origin still needs the explicit gateway host, including `ws:` / `wss:`. Restart Strapi after changing `ASSISTANT_GATEWAY_ORIGIN`.

If rust-bot sits behind nginx at `/rust-bot/`, the WASM app still requests `/ws` and `/v1/` on the **page origin** (path is not part of the origin). Proxy those prefixes to rust-bot as well, with websocket headers and a long `proxy_read_timeout`.

### 4. Configure rust-bot

On the combined gateway (default `http://127.0.0.1:18793`), not REST `:8900`:

```json
{
  "gateway": {
    "strapiSso": {
      "strapiUrl": "http://localhost:1337"
    }
  }
}
```

In Docker, that is often the **internal** Strapi URL (for example `http://127.0.0.1:1338` when nginx owns `1337`), not the public CMS URL.

Also required:

- JWT keypair on the gateway (`rust-bot generate-jwt-keypair`) so SSO can mint `purpose=webui` tokens
- Combined gateway serving `websockets-chat` at `/`
- `channels.allowFrom` including `"*"` or the SSO user's email
- `api.cors.origins` including the Strapi admin origin if the gateway is a different host (default `"*"` is enough)

### 5. Build and run the host app

```bash
npm run build
npm run start
```

The Assistant menu item is **Super Admin only** (`plugin::assistant.read` plus a super-admin policy). After the first boot, confirm Settings → Roles → Super Admin includes **Access the Assistant**.

### 6. Smoke-test SSO

Copy a real admin JWT, then:

```bash
curl -sS -D - -X POST "$ASSISTANT_GATEWAY_ORIGIN/v1/sso/strapi" \
  -H "Content-Type: application/json" \
  -d "{\"strapiJwt\":\"<admin-jwt>\"}"
```

Expect `{ "token": "<jwt>" }`. Open Assistant in the admin: config → SSO → iframe. A failed SSO must show the gateway error on the springboard, not a blank iframe.
