type StrapiLike = {
  service: (uid: string) => {
    actionProvider?: {
      registerMany: (actions: unknown[]) => Promise<unknown>;
    };
    resetSuperAdminPermissions?: () => Promise<unknown>;
  };
};

const bootstrap = async ({ strapi }: { strapi: StrapiLike }) => {
  await strapi.service('admin::permission').actionProvider!.registerMany([
    {
      section: 'plugins',
      displayName: 'Access the Assistant',
      uid: 'read',
      pluginName: 'assistant',
    },
  ]);
  await strapi.service('admin::role').resetSuperAdminPermissions!();
};

export default bootstrap;
