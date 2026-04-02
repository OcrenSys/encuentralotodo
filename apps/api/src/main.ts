import { createApp } from './server';
import { initializeObservability } from './lib/observability';

async function bootstrap() {
    const { app, env } = await createApp();
    await initializeObservability(env);

    app.listen(env.API_PORT, env.HOST, () => {
        console.log(`[ready] EncuentraloTodo API on http://${env.HOST}:${env.API_PORT}`);
    });
}

bootstrap().catch((error) => {
    console.error('[fatal] API bootstrap failed', error);
    process.exit(1);
});
