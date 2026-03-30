import { createProductInputSchema, getBusinessByIdInputSchema } from 'types';

import { publicProcedure, router } from '../trpc';

export const productRouter = router({
  create: publicProcedure.input(createProductInputSchema).mutation(({ ctx, input }) => {
    return ctx.store.createProduct(input);
  }),
  listByBusiness: publicProcedure.input(getBusinessByIdInputSchema).query(({ ctx, input }) => {
    return ctx.store.getBusinessById(input.businessId)?.products ?? [];
  }),
});