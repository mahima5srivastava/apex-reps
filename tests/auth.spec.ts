import { test, expect } from "@playwright/test";

test.describe("Apex Reps E2E - Auth", () => {
  test("redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.locator("text=Enter your credentials to access your account"),
    ).toBeVisible();
  });

  test("login with valid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "testpassword123");
    await page.click('button[type="submit"]');
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    const url = page.url();
    if (url.includes("/login")) {
      const error = await page.locator('[role="alert"]').textContent();
      console.log("Login error:", error);
    }
    await expect(page).toHaveURL("/");
    await expect(page.locator("h2")).toContainText("Welcome");
  });
});
