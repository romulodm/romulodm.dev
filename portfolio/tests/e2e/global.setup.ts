async function globalSetup(): Promise<void> {
  process.env.PLAYWRIGHT_TEST_BASE_URL ??= "http://127.0.0.1:3000";
}

export default globalSetup;
