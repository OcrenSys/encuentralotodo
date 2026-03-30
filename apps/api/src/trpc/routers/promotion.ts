import { createPromotionInputSchema } from 'types';

import { publicProcedure, router } from '../trpc';

export const promotionRouter = router({
  listActive: publicProcedure.query(({ ctx }) => ctx.store.listPromotions()),
  create: publicProcedure.input(createPromotionInputSchema).mutation(({ ctx, input }) => {
    return ctx.store.createPromotion(input);
  }),
});