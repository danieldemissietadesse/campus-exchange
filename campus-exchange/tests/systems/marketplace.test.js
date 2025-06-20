const { test, expect } = require('@playwright/test');

test.describe('Campus Exchange E2E Tests', () => {
  test('can access homepage', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Should see the auth page
    await expect(page.locator('text=Campus Exchange')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    console.log('✅ Homepage loads successfully');
  });

  test('can login with test user', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Fill login form
    await page.fill('input[type="email"]', 'testuser@wit.edu');
    await page.fill('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');
    
    // Should bypass verification and reach marketplace
    await expect(page.locator('text=WIT Student Marketplace')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=testuser@wit.edu')).toBeVisible();
    
    console.log('✅ Login successful');
  });
});