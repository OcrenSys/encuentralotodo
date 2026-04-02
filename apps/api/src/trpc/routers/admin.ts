import {
  approveBusinessInputSchema,
  searchPlatformUsersInputSchema,
  setPlatformUserActiveInputSchema,
  updatePlatformUserRoleInputSchema,
} from 'types';

import { adminProcedure, router, superAdminProcedure } from '../trpc';

export const adminRouter = router({
  pendingBusinesses: adminProcedure.query(({ ctx }) => ctx.businessService.listPendingBusinesses()),
  approveBusiness: adminProcedure.input(approveBusinessInputSchema).mutation(({ ctx, input }) => {
    return ctx.businessService.approveBusiness({ businessId: input.businessId });
  }),
  searchUsers: adminProcedure.input(searchPlatformUsersInputSchema).query(({ ctx, input }) => {
    return ctx.userAdminService.searchUsers(input);
  }),
  listUsers: superAdminProcedure.query(({ ctx }) => ctx.userAdminService.listUsers()),
  updateUserRole: superAdminProcedure.input(updatePlatformUserRoleInputSchema).mutation(({ ctx, input }) => {
    return ctx.userAdminService.updateUserRole(input);
  }),
  setUserActive: superAdminProcedure.input(setPlatformUserActiveInputSchema).mutation(({ ctx, input }) => {
    return ctx.userAdminService.setUserActive(input);
  }),
});