export default {
  admin: {
    type: 'admin' as const,
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
};
