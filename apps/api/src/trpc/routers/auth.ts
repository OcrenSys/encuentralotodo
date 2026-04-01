import { TRPCError } from '@trpc/server';
import { signInInputSchema } from 'types';

import { publicProcedure, router } from '../trpc';

export const authRouter = router({
  me: publicProcedure.query(({ ctx }) => ({
    provider: ctx.authProvider.name,
    user: ctx.currentUser,
  })),
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