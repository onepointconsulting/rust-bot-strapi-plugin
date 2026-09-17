type ControllerArgs = {
  strapi: {
    plugin: (name: string) => {
      config: (key: string) => unknown;
    };
  };
};

const controller = ({ strapi }: ControllerArgs) => ({
  getConfig(ctx: { body: unknown }) {
    const gatewayOrigin =
      (strapi.plugin('assistant').config('gatewayOrigin') as string | undefined) ||
      'http://127.0.0.1:18793';
    ctx.body = { gatewayOrigin };
  },
});

export default controller;
