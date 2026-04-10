export interface IntegrationRuntime {
  surface: string;
  databaseUrl: string;
  redisUrl: string;
  suite: string | undefined;
}

export function getIntegrationRuntime(surface: string): IntegrationRuntime {
  return {
    surface,
    databaseUrl: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? "",
    redisUrl: process.env.TEST_REDIS_URL ?? process.env.REDIS_URL ?? "",
    suite: process.env.TEST_SUITE,
  };
}
