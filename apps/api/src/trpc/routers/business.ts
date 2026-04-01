import {
  createBusinessInputSchema,
  getBusinessByIdInputSchema,
  listBusinessesInputSchema,
} from 'types';

import { publicProcedure, router } from '../trpc';

export const businessRouter = router({
  list: publicProcedure.input(listBusinessesInputSchema.optional()).query(({ ctx, input }) => {
    return ctx.businessService.listBusinesses(input);
  }),
  byId: publicProcedure.input(getBusinessByIdInputSchema).query(({ ctx, input }) => {
    return ctx.businessService.getBusinessById(input.businessId);
  }),
  create: publicProcedure.input(createBusinessInputSchema).mutation(({ ctx, input }) => {
    return ctx.businessService.createBusiness(input);
  }),
});