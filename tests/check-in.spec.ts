import { test, expect } from "@playwright/test";

test.describe("Apex Reps E2E - Check-in", () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage and login
    await page.context().clearCookies();
    await page.goto("/login");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "testpassword123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/");
  });

  test("check-in flow with measurements and photo", async ({ page }) => {
    // Navigate to check-in
    await page.click('a[href="/check-in"]');
    await expect(page).toHaveURL("/check-in");
    await expect(page.locator("h2")).toContainText("Check-In");

    // Fill measurements
    await page.fill('input[name="weight"]', "75");
    await page.fill('input[name="waist"]', "32");
    await page.fill('input[name="neck"]', "15");
    await page.fill('input[name="hip"]', "38");

    // Upload left photo (required)
    const fileInput = page.locator('input[name="photoLeft"]');
    await fileInput.setInputFiles({
      name: "test-left.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("fake-image-data"),
    });

    // Submit
    await page.click('button[type="submit"]:has-text("Submit Check-In")');

    // Wait for success toast and redirect
    await expect(
      page.locator("text=Stats saved successfully").first(),
    ).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL("/");

    // Verify new stat appears in summary
    await expect(page.locator("text=75 kg")).toBeVisible();
    await expect(page.locator("text=32 in")).toBeVisible();
  });
});
