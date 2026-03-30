import { approveBusinessInputSchema } from 'types';

import { adminProcedure, router } from '../trpc';

export const adminRouter = router({
  pendingBusinesses: adminProcedure.query(({ ctx }) => ctx.store.listPendingBusinesses()),
  approveBusiness: adminProcedure.input(approveBusinessInputSchema).mutation(async ({ ctx, input }) => {
    const business = ctx.store.approveBusiness(input.businessId);
    const owner = ctx.store.getUser(business.ownerId) ?? undefined;
    await ctx.emailService.sendBusinessApprovedEmail({ business, owner });
    return { business, owner };
  }),
});