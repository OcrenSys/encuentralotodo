import { initTRPC, TRPCError } from '@trpc/server';

import type { TrpcContext } from './context';

const t = initTRPC.context<TrpcContext>().create({
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.currentUser) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required.' });
  }

  return next();
});

export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  const currentUser = ctx.currentUser;

  if (!currentUser || !['ADMIN', 'SUPERADMIN', 'GLOBALADMIN'].includes(currentUser.role)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required.' });
  }

  return next();
});