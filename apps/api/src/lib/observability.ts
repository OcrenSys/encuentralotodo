import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import * as Sentry from '@sentry/node';

type RuntimeEnv = {
  NODE_ENV: 'development' | 'staging' | 'production';
  SENTRY_DSN?: string;
};

let sdk: NodeSDK | undefined;

export async function initializeObservability(env: RuntimeEnv) {
  if (env.SENTRY_DSN) {
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.NODE_ENV,
      tracesSampleRate: env.NODE_ENV === 'production' ? 0.2 : 1,
    });
  }

  if (env.NODE_ENV === 'development') {
    return;
  }

  sdk = new NodeSDK({
    instrumentations: [getNodeAutoInstrumentations()],
  });

  await sdk.start();
}

export async function shutdownObservability() {
  if (sdk) {
    await sdk.shutdown();
  }
}