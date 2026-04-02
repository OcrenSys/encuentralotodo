import { initTRPC, TRPCError } from '@trpc/server';

import type { TrpcContext } from './context';
import {
  platformAdminRoles,
  requireActiveUser,
  requirePlatformRole,
  requireSuperAdmin,
} from '../lib/auth/authorization';

const t = initTRPC.context<TrpcContext>().create({
});

export const router = t.router;
export const publicProcedure = t.procedure;

function assertEnabledUser(ctx: TrpcContext) {
  return requireActiveUser(ctx.currentUser);
}

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  assertEnabledUser(ctx);

  return next();
});

export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  requirePlatformRole(ctx.currentUser, platformAdminRoles, 'Admin access required.');

  return next();
});

export const superAdminProcedure = t.procedure.use(({ ctx, next }) => {
  requireSuperAdmin(ctx.currentUser);

  return next();
});