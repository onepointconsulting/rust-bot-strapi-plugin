const SUPER_ADMIN_CODE = 'strapi-super-admin';

type PolicyContext = {
  state: {
    user?: {
      roles?: Array<{ code?: string }>;
    };
  };
};

const isSuperAdmin = (ctx: PolicyContext) =>
  Boolean(ctx.state.user?.roles?.some((role) => role.code === SUPER_ADMIN_CODE));

export default isSuperAdmin;
