import {
  createBusinessInputSchema,
  getBusinessByIdInputSchema,
  listBusinessesInputSchema,
  listManagedBusinessesInputSchema,
  searchBusinessUsersInputSchema,
  transferBusinessOwnershipInputSchema,
  updateBusinessInputSchema,
} from 'types';

import { protectedProcedure, publicProcedure, router } from '../trpc';

export const businessRouter = router({
  list: publicProcedure.input(listBusinessesInputSchema.optional()).query(({ ctx, input }) => {
    return ctx.businessService.listBusinesses(input);
  }),
  managed: protectedProcedure.input(listBusinessesInputSchema.optional()).query(({ ctx, input }) => {
    return ctx.businessService.listManagedBusinesses(input);
  }),
  managedPage: protectedProcedure.input(listManagedBusinessesInputSchema).query(({ ctx, input }) => {
    return ctx.businessService.listManagedBusinessesPage(input);
  }),
  searchAssignableUsers: protectedProcedure.input(searchBusinessUsersInputSchema).query(({ ctx, input }) => {
    return ctx.businessService.searchAssignableUsers(input);
  }),
  byId: publicProcedure.input(getBusinessByIdInputSchema).query(({ ctx, input }) => {
    return ctx.businessService.getBusinessById(input.businessId);
  }),
  create: protectedProcedure.input(createBusinessInputSchema).mutation(({ ctx, input }) => {
    return ctx.businessService.createBusiness(input);
  }),
  transferOwnership: protectedProcedure.input(transferBusinessOwnershipInputSchema).mutation(({ ctx, input }) => {
    return ctx.businessService.transferOwnership(input);
  }),
  update: protectedProcedure.input(updateBusinessInputSchema).mutation(({ ctx, input }) => {
    return ctx.businessService.updateBusiness(input);
  }),
});