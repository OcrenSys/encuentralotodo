import {
  createProductInputSchema,
  deleteProductInputSchema,
  getBusinessByIdInputSchema,
  getProductByIdInputSchema,
  listManagedProductsInputSchema,
  updateProductInputSchema,
} from 'types';

import { protectedProcedure, publicProcedure, router } from '../trpc';

export const productRouter = router({
  create: publicProcedure.input(createProductInputSchema).mutation(({ ctx, input }) => {
    return ctx.productService.create(input);
  }),
  managed: protectedProcedure.input(listManagedProductsInputSchema).query(({ ctx, input }) => {
    return ctx.productService.listManaged(input);
  }),
  listByBusiness: publicProcedure.input(getBusinessByIdInputSchema).query(({ ctx, input }) => {
    return ctx.productService.listByBusiness(input.businessId);
  }),
  byId: publicProcedure.input(getProductByIdInputSchema).query(({ ctx, input }) => {
    return ctx.productService.getById(input);
  }),
  update: publicProcedure.input(updateProductInputSchema).mutation(({ ctx, input }) => {
    return ctx.productService.update(input);
  }),
  delete: publicProcedure.input(deleteProductInputSchema).mutation(({ ctx, input }) => {
    return ctx.productService.delete(input);
  }),
});