process.env.NODE_ENV = "test";
process.env.TEST_SUITE = "integration";
process.env.TEST_DATABASE_URL ??= "postgres://127.0.0.1:5432/romulodm_test";
process.env.TEST_REDIS_URL ??= "redis://127.0.0.1:6379/15";
process.env.DATABASE_URL ??= process.env.TEST_DATABASE_URL;
process.env.REDIS_URL ??= process.env.TEST_REDIS_URL;
