const { test, expect } = require('@playwright/test');

test.describe('Campus Exchange E2E Tests', () => {
  test('can access homepage', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Should see the auth page - be more specific with selectors
    await expect(page.getByRole('heading', { name: '📦 Campus Exchange' })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByText('Welcome Back!')).toBeVisible();
    
    console.log('✅ Homepage loads successfully');
  });

  test('can login with test user', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Fill login form
    await page.fill('input[type="email"]', 'demissied@wit.edu');
    await page.fill('input[type="password"]', 'Worknesh12!');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to marketplace
    await expect(page.getByText('WIT Student Marketplace')).toBeVisible({ timeout: 15000 });
    
    // Look for user email in header - be more specific about location
    await expect(page.locator('header').getByText('demissied@wit.edu')).toBeVisible();
    
    // Verify we're on the marketplace page
    await expect(page.getByText('Post New Item')).toBeVisible();
    await expect(page.getByText('Messages')).toBeVisible();
    await expect(page.getByText('Profile')).toBeVisible();
    
    console.log('✅ Login successful');
  });

  test('can post a new item', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000');
    await page.fill('input[type="email"]', 'demissied@wit.edu');
    await page.fill('input[type="password"]', 'Worknesh12!');
    await page.click('button[type="submit"]');
    
    // Wait for marketplace
    await expect(page.getByText('WIT Student Marketplace')).toBeVisible({ timeout: 15000 });
    
    // Click Post New Item
    await page.getByText('Post New Item').click();
    
    // Fill out the form
    await page.fill('input[placeholder*="Calculus"]', 'E2E Test Textbook');
    await page.fill('input[placeholder="0.00"]', '45');
    await page.selectOption('select', 'Textbooks');
    await page.fill('textarea[placeholder*="Describe"]', 'This is a test item for E2E testing');
    
    // Submit the form
    await page.getByText('Post Item').click();
    
    // Verify item appears (wait for it to show up)
    await expect(page.getByText('E2E Test Textbook')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('$45')).toBeVisible();
    
    console.log('✅ Item posting successful');
  });

  test('can search for items', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000');
    await page.fill('input[type="email"]', 'demissied@wit.edu');
    await page.fill('input[type="password"]', 'Worknesh12!');
    await page.click('button[type="submit"]');
    
    await expect(page.getByText('WIT Student Marketplace')).toBeVisible({ timeout: 15000 });
    
    // Search for textbooks
    await page.fill('input[placeholder*="Search"]', 'textbook');
    
    // Wait a moment for search to filter
    await page.waitForTimeout(1000);
    
    // Should show search results
    await expect(page.getByText('Textbooks')).toBeVisible();
    
    console.log('✅ Search functionality working');
  });

  test('can navigate to profile', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000');
    await page.fill('input[type="email"]', 'demissied@wit.edu');
    await page.fill('input[type="password"]', 'Worknesh12!');
    await page.click('button[type="submit"]');
    
    await expect(page.getByText('WIT Student Marketplace')).toBeVisible({ timeout: 15000 });
    
    // Click Profile button
    await page.getByText('Profile').click();
    
    // Should see profile page
    await expect(page.getByText('My Profile')).toBeVisible();
    await expect(page.getByText('Account Information')).toBeVisible();
    await expect(page.getByText('demissied@wit.edu')).toBeVisible();
    
    console.log('✅ Profile navigation successful');
  });

  test('can logout successfully', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000');
    await page.fill('input[type="email"]', 'testuser@wit.edu');
    await page.fill('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');
    
    await expect(page.getByText('WIT Student Marketplace')).toBeVisible({ timeout: 15000 });
    
    // Click Logout
    await page.getByText('Logout').click();
    
    // Should return to login page
    await expect(page.getByText('Welcome Back!')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    console.log('✅ Logout successful');
  });
});