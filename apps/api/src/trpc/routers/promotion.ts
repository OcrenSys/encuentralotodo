import {
  createPromotionInputSchema,
  deletePromotionInputSchema,
  getBusinessByIdInputSchema,
  getPromotionByIdInputSchema,
  updatePromotionInputSchema,
} from 'types';

import { publicProcedure, router } from '../trpc';

export const promotionRouter = router({
  listActive: publicProcedure.query(({ ctx }) => ctx.promotionService.listActive()),
  listByBusiness: publicProcedure.input(getBusinessByIdInputSchema).query(({ ctx, input }) => {
    return ctx.promotionService.listByBusiness(input.businessId);
  }),
  byId: publicProcedure.input(getPromotionByIdInputSchema).query(({ ctx, input }) => {
    return ctx.promotionService.getById(input);
  }),
  create: publicProcedure.input(createPromotionInputSchema).mutation(({ ctx, input }) => {
    return ctx.promotionService.create(input);
  }),
  update: publicProcedure.input(updatePromotionInputSchema).mutation(({ ctx, input }) => {
    return ctx.promotionService.update(input);
  }),
  delete: publicProcedure.input(deletePromotionInputSchema).mutation(({ ctx, input }) => {
    return ctx.promotionService.delete(input);
  }),
});