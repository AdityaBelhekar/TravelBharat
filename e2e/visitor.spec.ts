import { expect, test } from "@playwright/test";

test("home → map → state → place, with nearby attractions", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: /Map of India/ }).getByRole("link", { name: /^Rajasthan,/ }).click();
  await expect(page).toHaveURL(/\/states\/rajasthan$/);
  await expect(page.getByRole("heading", { level: 1, name: "Rajasthan" })).toBeVisible();

  await page.getByRole("link", { name: "Amber Fort" }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Amber Fort" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Plan your visit" })).toBeVisible();

  // Seeded places have no photos; when a gallery exists, it must open and close.
  const photo = page.getByRole("button", { name: /photo|View all/i }).first();
  if (await photo.count()) {
    await photo.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  }

  const nearby = page.getByRole("region", { name: "Nearby" });
  await expect(nearby.getByRole("article").first()).toBeVisible();
  await expect(nearby).toContainText("km");
});

test("explore filters by state, category and month", async ({ page }) => {
  await page.goto("/explore", { waitUntil: "networkidle" }); // filters apply on change once hydrated
  await page.getByLabel("State").selectOption("kerala");
  await expect(page).toHaveURL(/state=kerala/);
  await page.getByLabel("Category").selectOption("nature");
  await expect(page).toHaveURL(/category=nature/);
  await page.getByLabel("Best in").selectOption("12");
  await expect(page).toHaveURL(/month=12/);

  const cards = page.getByRole("article");
  await expect(cards.first()).toBeVisible();
  for (const card of await cards.all()) {
    await expect(card).toContainText("Kerala");
    await expect(card).toContainText("Nature");
  }
});

test("header search suggests places and opens them", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const search = page.getByRole("combobox", { name: "Search TravelBharat" });
  await search.fill("taj");
  await expect(page.getByRole("option", { name: /Taj Mahal/ })).toBeVisible();
  await search.press("ArrowDown");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/places\/taj-mahal$/);
});
