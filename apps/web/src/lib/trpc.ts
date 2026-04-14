'use client';

import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from 'api-contract';

export const trpc = createTRPCReact<AppRouter>();