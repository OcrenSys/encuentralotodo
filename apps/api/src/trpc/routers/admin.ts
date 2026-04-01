import { approveBusinessInputSchema } from 'types';

import { adminProcedure, router } from '../trpc';

export const adminRouter = router({
  pendingBusinesses: adminProcedure.query(({ ctx }) => ctx.businessService.listPendingBusinesses()),
  approveBusiness: adminProcedure.input(approveBusinessInputSchema).mutation(({ ctx, input }) => {
    return ctx.businessService.approveBusiness(input);
  }),
});