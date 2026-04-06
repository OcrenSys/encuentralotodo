import { TRPCError } from '@trpc/server';
import { selfProfileUpdateInputSchema, signInInputSchema } from 'types';

import { protectedProcedure, publicProcedure, router } from '../trpc';

export const authRouter = router({
  me: publicProcedure.query(({ ctx }) => ({
    provider: ctx.authProvider.name,
    user: ctx.currentUser,
  })),
  profile: protectedProcedure.query(({ ctx }) => ctx.userAdminService.getSelfProfile()),
  updateProfile: protectedProcedure.input(selfProfileUpdateInputSchema).mutation(({ ctx, input }) => {
    return ctx.userAdminService.updateSelfProfile(input);
  }),
  signIn: publicProcedure.input(signInInputSchema).mutation(({ ctx, input }) => {
    if (ctx.env.AUTH_PROVIDER !== 'mock') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Use the active auth provider client SDK to sign in and send its ID token to the backend.',
      });
    }

    const user = ctx.store.findUserByEmail(input.email);
    return {
      provider: ctx.authProvider.name,
      user,
    };
  }),
  signOut: publicProcedure.mutation(() => ({ ok: true })),
});