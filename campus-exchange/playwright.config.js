module.exports = {
  testDir: './tests/systems',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: false, // See the browser
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...require('@playwright/test').devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      }
    }
  ]
};