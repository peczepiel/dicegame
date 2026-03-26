import { app } from './app';
import { closeDatabase, connectToDatabase } from './db';
import { env } from './env';

const start = async (): Promise<void> => {
  await connectToDatabase();

  const server = app.listen(env.port, () => {
    console.log(`[backend] listening on http://localhost:${env.port}`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`[backend] received ${signal}, shutting down`);
    server.close(async () => {
      await closeDatabase();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
};

start().catch((error) => {
  console.error('[backend] failed to start', error);
  process.exit(1);
});

