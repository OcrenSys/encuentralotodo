import { signInInputSchema } from 'types';

import { publicProcedure, router } from '../trpc';

export const authRouter = router({
  me: publicProcedure.query(async ({ ctx }) => ({
    provider: ctx.env.AUTH_PROVIDER,
    user: await ctx.authProvider.getUser(),
  })),
  signIn: publicProcedure.input(signInInputSchema).mutation(async ({ ctx, input }) => ({
    provider: ctx.env.AUTH_PROVIDER,
    user: await ctx.authProvider.signIn(input),
  })),
  signOut: publicProcedure.mutation(async ({ ctx }) => {
    await ctx.authProvider.signOut();
    return { ok: true };
  }),
});