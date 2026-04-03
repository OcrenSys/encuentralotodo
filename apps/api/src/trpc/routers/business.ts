import {
  createBusinessInputSchema,
  getBusinessByIdInputSchema,
  listBusinessesInputSchema,
  listManagedBusinessesInputSchema,
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
  byId: publicProcedure.input(getBusinessByIdInputSchema).query(({ ctx, input }) => {
    return ctx.businessService.getBusinessById(input.businessId);
  }),
  create: publicProcedure.input(createBusinessInputSchema).mutation(({ ctx, input }) => {
    return ctx.businessService.createBusiness(input);
  }),
});