import { router } from './trpc';
import { adminRouter } from './routers/admin';
import { authRouter } from './routers/auth';
import { businessRouter } from './routers/business';
import { leadRouter } from './routers/lead';
import { productRouter } from './routers/product';
import { promotionRouter } from './routers/promotion';
import { reviewRouter } from './routers/review';

export const appRouter = router({
  auth: authRouter,
  business: businessRouter,
  lead: leadRouter,
  product: productRouter,
  promotion: promotionRouter,
  review: reviewRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;