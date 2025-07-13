import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',         // איפה כל הטסטים שלך נמצאים
  timeout: 30 * 1000,          // timeout גלובלי לכל טסט
  retries: 1,                  // אם טסט נפל, לנסות עוד פעם
  use: {
    headless: false,           // שלא ירוץ ב-headless, שתראה את הדפדפן
    slowMo: 500,               // כל פעולה תתעכב 500ms
    viewport: { width: 1280, height: 720 }, // גודל חלון אחיד
    ignoreHTTPSErrors: true,   // אם יש SSL לא תקף, להתעלם
  },
});
