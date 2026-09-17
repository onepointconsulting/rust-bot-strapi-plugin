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
