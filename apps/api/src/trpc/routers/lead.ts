import {
    createLeadFromCallClickInputSchema,
    createLeadFromContactClickInputSchema,
    createLeadFromProductClickInputSchema,
    createLeadFromPromotionClickInputSchema,
    createLeadFromWhatsappClickInputSchema,
    getBusinessByIdInputSchema,
    getLeadByIdInputSchema,
    updateLeadNotesInputSchema,
    updateLeadStatusInputSchema,
} from 'types';

import { protectedProcedure, publicProcedure, router } from '../trpc';

export const leadRouter = router({
    captureWhatsappClick: publicProcedure.input(createLeadFromWhatsappClickInputSchema).mutation(({ ctx, input }) => {
        return ctx.leadService.createLeadFromWhatsappClick(input);
    }),
    captureCallClick: publicProcedure.input(createLeadFromCallClickInputSchema).mutation(({ ctx, input }) => {
        return ctx.leadService.createLeadFromCallClick(input);
    }),
    captureContactClick: publicProcedure.input(createLeadFromContactClickInputSchema).mutation(({ ctx, input }) => {
        return ctx.leadService.createLeadFromContactClick(input);
    }),
    capturePromotionClick: publicProcedure.input(createLeadFromPromotionClickInputSchema).mutation(({ ctx, input }) => {
        return ctx.leadService.createLeadFromPromotionClick(input);
    }),
    captureProductClick: publicProcedure.input(createLeadFromProductClickInputSchema).mutation(({ ctx, input }) => {
        return ctx.leadService.createLeadFromProductClick(input);
    }),
    listByBusiness: protectedProcedure.input(getBusinessByIdInputSchema).query(({ ctx, input }) => {
        return ctx.leadService.listByBusiness(input.businessId);
    }),
    byId: protectedProcedure.input(getLeadByIdInputSchema).query(({ ctx, input }) => {
        return ctx.leadService.getById(input);
    }),
    updateStatus: protectedProcedure.input(updateLeadStatusInputSchema).mutation(({ ctx, input }) => {
        return ctx.leadService.updateLeadStatus(input);
    }),
    updateNotes: protectedProcedure.input(updateLeadNotesInputSchema).mutation(({ ctx, input }) => {
        return ctx.leadService.updateLeadNotes(input);
    }),
});