import cors from 'cors';
import express from 'express';
import * as trpcExpress from '@trpc/server/adapters/express';

import { parseServerEnv } from 'config';

import { createTrpcContext } from './trpc/context';
import { appRouter } from './trpc/router';

export async function createApp() {
  const env = parseServerEnv(process.env);
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_request, response) => {
    response.send({ status: 'ok', mode: env.DATA_MODE, timestamp: new Date().toISOString() });
  });

  app.use(
    '/trpc',
    trpcExpress.createExpressMiddleware({
      router: appRouter,
      createContext: ({ req, res }) => createTrpcContext({ req, res, env }),
    })
  );

  app.get('/', (_request, response) => {
    response.send({
      name: 'EncuentraloTodo API',
      transport: 'tRPC',
      endpoint: '/trpc',
    });
  });

  return { app, env };
}