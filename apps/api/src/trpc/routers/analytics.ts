import {
    getBusinessAnalyticsInputSchema,
    getPlatformAnalyticsInputSchema,
} from 'types';

import { adminProcedure, protectedProcedure, router } from '../trpc';

export const analyticsRouter = router({
    businessOverview: protectedProcedure.input(getBusinessAnalyticsInputSchema).query(({ ctx, input }) => {
        return ctx.businessAnalyticsService.getOverview(input);
    }),
    platformOverview: adminProcedure.input(getPlatformAnalyticsInputSchema).query(({ ctx, input }) => {
        return ctx.platformAnalyticsService.getOverview(input);
    }),
});