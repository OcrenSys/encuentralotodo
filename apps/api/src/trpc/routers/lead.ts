import {
    createLeadInputSchema,
    getBusinessByIdInputSchema,
    getLeadByIdInputSchema,
} from 'types';

import { publicProcedure, router } from '../trpc';

export const leadRouter = router({
    create: publicProcedure.input(createLeadInputSchema).mutation(({ ctx, input }) => {
        return ctx.leadService.create(input);
    }),
    listByBusiness: publicProcedure.input(getBusinessByIdInputSchema).query(({ ctx, input }) => {
        return ctx.leadService.listByBusiness(input.businessId);
    }),
    byId: publicProcedure.input(getLeadByIdInputSchema).query(({ ctx, input }) => {
        return ctx.leadService.getById(input);
    }),
});