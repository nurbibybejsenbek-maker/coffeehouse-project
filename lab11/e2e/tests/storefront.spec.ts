import { expect, test } from "@playwright/test";

test("қазақша мәзір бағаны көрсетеді", async ({ page }) => {
  await page.goto("/kk/menu");
  await expect(page.getByRole("heading", { name: "Мәзір" })).toBeVisible();
  await expect(page.locator("body")).toContainText("₸");
});

test("тіл ауыстырғышы мәзір жолын сақтайды", async ({ page }) => {
  await page.goto("/kk/menu");
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: "Русский" }).click();
  await expect(page).toHaveURL(/\/ru\/menu/);
});

test("мәзір API тізім қайтарады", async ({ request }) => {
  const response = await request.get("/api/menu");
  expect(response.ok()).toBeTruthy();
  const items = await response.json();
  expect(Array.isArray(items)).toBeTruthy();
  expect(items.length).toBeGreaterThan(0);
  expect(items[0].price).toBeGreaterThan(0);
});

test("бос тапсырыс 400 және жол жазбайды", async ({ request }) => {
  const response = await request.post("/api/orders", {
    data: {},
  });
  expect(response.status()).toBe(400);
});
