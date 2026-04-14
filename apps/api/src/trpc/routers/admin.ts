import {
  adminUserProfileUpdateInputSchema,
  assignUserBusinessRoleInputSchema,
  approveBusinessInputSchema,
  createBusinessForOwnerInputSchema,
  getUserByIdInputSchema,
  listPlatformUsersInputSchema,
  removeUserBusinessRoleInputSchema,
  searchPlatformUsersInputSchema,
  setPlatformUserActiveInputSchema,
  transferBusinessOwnershipInputSchema,
  updateBaseUserRoleInputSchema,
  updatePlatformUserRoleInputSchema,
} from 'types';

import { adminProcedure, router, superAdminProcedure } from '../trpc';

export const adminRouter = router({
  pendingBusinesses: adminProcedure.query(({ ctx }) => ctx.businessService.listPendingBusinesses()),
  createBusinessForOwner: adminProcedure.input(createBusinessForOwnerInputSchema).mutation(({ ctx, input }) => {
    return ctx.businessService.createBusinessForOwner(input);
  }),
  approveBusiness: adminProcedure.input(approveBusinessInputSchema).mutation(({ ctx, input }) => {
    return ctx.businessService.approveBusiness({ businessId: input.businessId });
  }),
  searchUsers: adminProcedure.input(searchPlatformUsersInputSchema).query(({ ctx, input }) => {
    return ctx.userAdminService.searchUsers(input);
  }),
  userById: superAdminProcedure.input(getUserByIdInputSchema).query(({ ctx, input }) => {
    return ctx.userAdminService.getUserDetail(input.userId);
  }),
  listUsers: superAdminProcedure.query(({ ctx }) => ctx.userAdminService.listUsers()),
  listUsersPage: superAdminProcedure.input(listPlatformUsersInputSchema).query(({ ctx, input }) => {
    return ctx.userAdminService.listUsersPage(input);
  }),
  updateUserProfile: superAdminProcedure.input(adminUserProfileUpdateInputSchema).mutation(({ ctx, input }) => {
    return ctx.userAdminService.updateUserProfile(input);
  }),
  updateBaseUserRole: superAdminProcedure.input(updateBaseUserRoleInputSchema).mutation(({ ctx, input }) => {
    return ctx.userAdminService.updateBaseUserRole(input);
  }),
  updateUserRole: superAdminProcedure.input(updatePlatformUserRoleInputSchema).mutation(({ ctx, input }) => {
    return ctx.userAdminService.updateUserRole(input);
  }),
  setUserActive: superAdminProcedure.input(setPlatformUserActiveInputSchema).mutation(({ ctx, input }) => {
    return ctx.userAdminService.setUserActive(input);
  }),
  assignBusinessRole: superAdminProcedure.input(assignUserBusinessRoleInputSchema).mutation(({ ctx, input }) => {
    return ctx.userAdminService.assignUserBusinessRole(input);
  }),
  removeBusinessRole: superAdminProcedure.input(removeUserBusinessRoleInputSchema).mutation(({ ctx, input }) => {
    return ctx.userAdminService.removeUserBusinessRole(input);
  }),
  transferBusinessOwnership: superAdminProcedure.input(transferBusinessOwnershipInputSchema).mutation(({ ctx, input }) => {
    return ctx.userAdminService.transferBusinessOwnership(input);
  }),
});