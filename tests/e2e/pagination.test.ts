import { expect, test, type Page } from "@playwright/test";

async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@looply.ai");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15000 });
}

async function uploadKnowledgeDocument(page: Page, name: string, content: string) {
  await page
    .locator('input[type="file"]')
    .setInputFiles({
      buffer: Buffer.from(content, "utf8"),
      mimeType: "text/plain",
      name,
    });
}

test.describe("Workspace pagination", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("customers canonicalize invalid params and preserve filters across pages", async ({
    page,
  }) => {
    await page.goto("/customers?page=abc&pageSize=999");
    await expect(page).toHaveURL(/\/customers\?page=1&pageSize=50$/);

    await page.goto("/customers?page=2&pageSize=1");
    await page.getByRole("combobox").nth(0).selectOption("enterprise");
    await page.getByRole("combobox").nth(1).selectOption("churn");
    await page.getByRole("button", { name: "Apply" }).click();

    await expect(page).toHaveURL(
      /\/customers\?page=1&pageSize=1&segment=enterprise&sort=churn/
    );

    const firstRow = page.getByTestId("customer-row").first();
    const firstPageText = await firstRow.textContent();

    await page.getByTestId("pagination-next").click();
    await expect(page).toHaveURL(
      /\/customers\?page=2&pageSize=1&segment=enterprise&sort=churn/
    );

    const secondPageText = await page.getByTestId("customer-row").first().textContent();
    expect(secondPageText).not.toEqual(firstPageText);
  });

  test("campaigns keep status filter while paging", async ({ page }) => {
    await page.goto("/campaigns?status=draft&page=1&pageSize=1");

    const firstCardText = await page.getByTestId("campaign-card").first().textContent();

    await page.getByTestId("pagination-next").click();
    await expect(page).toHaveURL(/\/campaigns\?status=draft&page=2&pageSize=1/);

    const secondCardText = await page.getByTestId("campaign-card").first().textContent();
    expect(secondCardText).not.toEqual(firstCardText);
  });

  test("system logs keep type filter while paging", async ({ page }) => {
    await page.goto("/system-logs?type=campaign&page=1&pageSize=1");

    const firstEntryText = await page
      .getByTestId("system-log-entry")
      .first()
      .textContent();

    await page.getByTestId("pagination-next").click();
    await expect(page).toHaveURL(
      /\/system-logs\?type=campaign&page=2&pageSize=1/
    );

    const secondEntryText = await page
      .getByTestId("system-log-entry")
      .first()
      .textContent();
    expect(secondEntryText).not.toEqual(firstEntryText);
  });

  test("telemetry preserves day window and keeps summary stable while paging rag rows", async ({
    page,
  }) => {
    await page.goto("/telemetry?days=90&page=1&pageSize=1");

    const summaryValue = await page
      .getByText("Messages")
      .locator("..")
      .textContent();
    const firstRowText = await page.getByTestId("rag-row").first().textContent();

    await page.getByTestId("pagination-next").click();
    await expect(page).toHaveURL(/\/telemetry\?days=90&page=2&pageSize=1/);

    const secondRowText = await page.getByTestId("rag-row").first().textContent();
    const summaryValueAfter = await page
      .getByText("Messages")
      .locator("..")
      .textContent();

    expect(secondRowText).not.toEqual(firstRowText);
    expect(summaryValueAfter).toEqual(summaryValue);
  });

  test("knowledge base upload resets to page 1, search paginates, and delete backs up from an empty page", async ({
    page,
  }) => {
    const prefix = `playwright-kb-${Date.now()}`;
    const firstFileName = `${prefix}-a.txt`;
    const secondFileName = `${prefix}-b.txt`;

    await page.goto("/knowledge-base?page=2&pageSize=1");

    await uploadKnowledgeDocument(
      page,
      firstFileName,
      `${prefix} first knowledge document`
    );
    await expect(page).toHaveURL(/\/knowledge-base\?page=1&pageSize=1/, {
      timeout: 30000,
    });
    await expect(page.getByText(firstFileName)).toBeVisible({ timeout: 30000 });

    await uploadKnowledgeDocument(
      page,
      secondFileName,
      `${prefix} second knowledge document`
    );
    await expect(page.getByText(secondFileName)).toBeVisible({ timeout: 30000 });

    await page.goto(
      `/knowledge-base?q=${encodeURIComponent(prefix)}&page=1&pageSize=1`
    );
    await expect(page.getByTestId("knowledge-row")).toHaveCount(1);

    await page.getByTestId("pagination-next").click();
    await expect(page).toHaveURL(
      new RegExp(
        `/knowledge-base\\?q=${encodeURIComponent(prefix)}&page=2&pageSize=1`
      )
    );

    await page.getByTestId("knowledge-row").first().getByRole("button").click();
    await expect(page).toHaveURL(
      new RegExp(
        `/knowledge-base\\?q=${encodeURIComponent(prefix)}&page=1&pageSize=1`
      ),
      { timeout: 30000 }
    );
    await expect(page.getByText(secondFileName)).not.toBeVisible();
  });
});
