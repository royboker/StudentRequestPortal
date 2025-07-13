import { test, expect } from '@playwright/test';

test('login works with valid credentials', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForSelector('input[name="email"]');

  await page.fill('input[name="email"]', 'roy4552@test.com');
  await page.fill('input[name="password"]', 'Pass123');

  await page.click('button[type="submit"]');

  // חכה לוודא שהדשבורד נטען
  await page.waitForTimeout(2000);

  // בדוק טקסט כללי יותר
  await expect(page.locator('text=כיף')).toBeVisible();
});
