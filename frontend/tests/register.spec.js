import { test, expect } from '@playwright/test';

test('user registration works with valid data', async ({ page }) => {
  await page.goto('http://localhost:3000/register');
  await page.waitForSelector('input[name="first_name"]');

  await page.fill('input[name="first_name"]', 'רוי');
  await page.fill('input[name="last_name"]', 'בוקר');
  await page.fill('input[name="email"]', 'roy4552@test.com');  // מייל ייחודי
  await page.fill('input[name="id_number"]', '85456521');
  await page.fill('input[name="phone_number"]', '0501234567');

  // בחר מחלקה (אם נטען לך Select)
  await page.selectOption('select[name="department"]', { index: 1 });

  await page.fill('input[name="password"]', 'Pass123');
  await page.fill('input[name="confirmPassword"]', 'Pass123');

  // לחץ על הירשם
  await page.click('button[type="submit"]');

  // חכה קצת כי ההודעה עולה ב-Modal
  await page.waitForTimeout(1000);

  // ודא שמופיעה הודעה שהצליח
  await expect(page.locator('text=נרשמת בהצלחה')).toBeVisible();
});
