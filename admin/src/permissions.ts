export const SUPER_ADMIN_CODE = 'strapi-super-admin';

export const ASSISTANT_READ_PERMISSION = {
  action: 'plugin::assistant.read',
  subject: null,
};

export const userIsSuperAdmin = (user?: {
  roles?: Array<{ code?: string }>;
}) => Boolean(user?.roles?.some((role) => role.code === SUPER_ADMIN_CODE));
