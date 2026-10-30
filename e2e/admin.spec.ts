import { type Browser, expect, type Page, test } from "@playwright/test";

const editor = { email: process.env.E2E_EDITOR_EMAIL!, password: process.env.E2E_EDITOR_PASSWORD! };
const admin = { email: process.env.E2E_ADMIN_EMAIL!, password: process.env.E2E_ADMIN_PASSWORD! };

async function signIn(browser: Browser, user: { email: string; password: string }) {
  const page = await (await browser.newContext()).newPage();
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  return page;
}

const buttons = (page: Page) => page.locator("form:has([name=shortDescription]) button[type=submit]");

test.skip(!editor.email || !admin.email, "Set E2E_EDITOR_* and E2E_ADMIN_* to run the admin journey");

test("an editor submits a place, an admin approves it, and it goes live", async ({ browser }) => {
  const slug = `e2e-test-place-${Date.now()}`;

  // Editor creates the place and submits it for review.
  const ed = await signIn(browser, editor);
  await ed.goto("/admin/places/new");
  await ed.getByLabel("Name").fill("E2E Test Place");
  await ed.getByLabel("Web address").fill(slug);
  await ed.getByLabel("State").selectOption("goa");
  await ed.getByLabel("City").selectOption("old-goa");
  await ed.getByLabel("Type of place").selectOption("fort");
  await ed.getByLabel("Heritage", { exact: true }).check();
  await ed.getByLabel("Short description").fill("A place created by the end-to-end test.");
  await ed.getByLabel(/^Description/).fill("Created by an automated test and deleted at the end.");
  await ed.getByLabel("Dec", { exact: true }).check();
  await ed.getByLabel("Latitude").fill("15.5");
  await ed.getByLabel("Longitude").fill("73.91");
  await ed.getByLabel("Address", { exact: true }).fill("Old Goa, Goa");
  await ed.getByLabel("Where the facts come from").fill("Test source | https://en.wikipedia.org/wiki/Goa");
  await expect(buttons(ed)).toHaveText(["Submit for review", "Save draft"]); // no publish button for editors
  await ed.getByRole("button", { name: "Submit for review" }).click();
  await expect(ed.getByText("Saved and sent for review.")).toBeVisible();
  const editUrl = ed.url().replace(/\?.*$/, "");

  // Not public yet.
  const anon = await (await browser.newContext()).newPage();
  await anon.goto(`/places/${slug}`);
  await expect(anon.getByText("Page not found")).toBeVisible();

  // Admin adds a photo and publishes.
  const ad = await signIn(browser, admin);
  await ad.goto(editUrl);
  await ad.getByLabel("Image URL").fill("https://upload.wikimedia.org/wikipedia/commons/4/4e/Mahabodhitemple.jpg");
  await ad.getByRole("button", { name: "Add", exact: true }).click();
  await ad.getByLabel("Photo 1 description").fill("Test photo");
  await ad.getByRole("button", { name: "Save and publish" }).click();
  await expect(ad.getByText("Published. It's live on the site now.")).toBeVisible();

  // Live on the public site straight away.
  await anon.goto(`/places/${slug}`);
  await expect(anon.getByRole("heading", { level: 1, name: "E2E Test Place" })).toBeVisible();

  // Clean up.
  ad.on("dialog", (d) => d.accept());
  await ad.getByRole("button", { name: "Delete permanently" }).click();
  await expect(ad).toHaveURL(/\/admin\/places\?deleted=1/);
});
