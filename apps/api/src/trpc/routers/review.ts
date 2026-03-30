import { createReviewInputSchema, getBusinessByIdInputSchema } from 'types';

import { publicProcedure, router } from '../trpc';

export const reviewRouter = router({
  listByBusiness: publicProcedure.input(getBusinessByIdInputSchema).query(({ ctx, input }) => {
    return ctx.store.getBusinessById(input.businessId)?.reviews ?? [];
  }),
  create: publicProcedure.input(createReviewInputSchema).mutation(({ ctx, input }) => {
    return ctx.store.createReview(input);
  }),
});