import { initTRPC, TRPCError } from '@trpc/server';

import type { TrpcContext } from './context';

const t = initTRPC.context<TrpcContext>().create({
});

export const router = t.router;
export const publicProcedure = t.procedure;

function assertEnabledUser(ctx: TrpcContext) {
  if (!ctx.currentUser) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required.' });
  }

  if (ctx.currentUser.isActive === false) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'User account is disabled.' });
  }

  return ctx.currentUser;
}

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  assertEnabledUser(ctx);

  return next();
});

export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  const currentUser = assertEnabledUser(ctx);

  if (!['ADMIN', 'SUPERADMIN', 'GLOBALADMIN'].includes(currentUser.role)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required.' });
  }

  return next();
});

export const superAdminProcedure = t.procedure.use(({ ctx, next }) => {
  const currentUser = assertEnabledUser(ctx);

  if (!['SUPERADMIN', 'GLOBALADMIN'].includes(currentUser.role)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'SuperAdmin access required.' });
  }

  return next();
});