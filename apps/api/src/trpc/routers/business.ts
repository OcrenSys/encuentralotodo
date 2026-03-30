import {
  createBusinessInputSchema,
  getBusinessByIdInputSchema,
  listBusinessesInputSchema,
} from 'types';

import { publicProcedure, router } from '../trpc';

export const businessRouter = router({
  list: publicProcedure.input(listBusinessesInputSchema.optional()).query(({ ctx, input }) => {
    return ctx.store.listBusinesses(input);
  }),
  byId: publicProcedure.input(getBusinessByIdInputSchema).query(({ ctx, input }) => {
    return ctx.store.getBusinessById(input.businessId);
  }),
  create: publicProcedure.input(createBusinessInputSchema).mutation(({ ctx, input }) => {
    return ctx.store.createBusiness(input);
  }),
});