import { useEffect, useState } from 'react';

import { Box, Loader, Typography } from '@strapi/design-system';
import { useAuth, useFetchClient } from '@strapi/strapi/admin';

type PluginConfig = {
  gatewayOrigin: string;
};

const HomePage = () => {
  const token = useAuth('AssistantPage', (state) => state.token);
  const { get } = useFetchClient();
  const [error, setError] = useState<string | null>(null);
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!token) {
        setError('Not signed in to Strapi admin.');
        return;
      }

      try {
        const { data } = await get<PluginConfig | { data?: PluginConfig }>(
          '/assistant/config'
        );
        const config = (data as PluginConfig)?.gatewayOrigin
          ? (data as PluginConfig)
          : ((data as { data?: PluginConfig })?.data ?? {});
        const gatewayOrigin = (config.gatewayOrigin || '').replace(/\/$/, '');
        if (!gatewayOrigin) {
          throw new Error('Plugin config is missing gatewayOrigin.');
        }

        const response = await fetch(`${gatewayOrigin}/v1/sso/strapi`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ strapiJwt: token }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          const message =
            body?.error?.message ||
            body?.message ||
            `SSO failed with status ${response.status}`;
          throw new Error(message);
        }
        const rustBotJwt = body?.token as string | undefined;
        if (!rustBotJwt) {
          throw new Error('SSO response did not include a token.');
        }
        if (!cancelled) {
          setIframeSrc(`${gatewayOrigin}/#token=${encodeURIComponent(rustBotJwt)}`);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [get, token]);

  if (error) {
    return (
      <Box padding={8}>
        <Typography variant="beta">Assistant</Typography>
        <Box paddingTop={4}>
          <Typography textColor="danger600">{error}</Typography>
        </Box>
      </Box>
    );
  }

  if (!iframeSrc) {
    return (
      <Box padding={8}>
        <Loader>Connecting to assistant…</Loader>
      </Box>
    );
  }

  return (
    <Box
      style={{
        height: 'calc(100vh - 7rem)',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <iframe
        title="rust-bot assistant"
        src={iframeSrc}
        style={{ border: 0, width: '100%', height: '100%' }}
        allow="clipboard-read; clipboard-write"
      />
    </Box>
  );
};

export { HomePage };
