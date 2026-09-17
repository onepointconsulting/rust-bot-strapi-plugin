'use strict';

const SUPER_ADMIN_CODE = 'strapi-super-admin';

const isSuperAdminUser = (user) =>
  Boolean(user?.roles?.some((role) => role.code === SUPER_ADMIN_CODE));

module.exports = {
  register() {},
  async bootstrap({ strapi }) {
    await strapi.service('admin::permission').actionProvider.registerMany([
      {
        section: 'plugins',
        displayName: 'Access the Assistant',
        uid: 'read',
        pluginName: 'assistant',
      },
    ]);
    await strapi.service('admin::role').resetSuperAdminPermissions();
  },
  destroy() {},
  config: {
    default: {
      gatewayOrigin: 'http://127.0.0.1:18793',
    },
    validator() {},
  },
  policies: {
    isSuperAdmin(ctx) {
      return isSuperAdminUser(ctx.state.user);
    },
  },
  controllers: {
    controller: ({ strapi }) => ({
      getConfig(ctx) {
        const gatewayOrigin =
          strapi.plugin('assistant').config('gatewayOrigin') ||
          'http://127.0.0.1:18793';
        ctx.body = { gatewayOrigin };
      },
    }),
  },
  routes: {
    admin: {
      type: 'admin',
      routes: [
        {
          method: 'GET',
          path: '/config',
          handler: 'controller.getConfig',
          config: {
            policies: [
              'admin::isAuthenticatedAdmin',
              'plugin::assistant.isSuperAdmin',
            ],
          },
        },
      ],
    },
  },
};
