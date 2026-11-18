# digiPract_Automation
Avsario_Digi_Pract_Automation

## Authenticated tests

Tests that need to sign in can use the `authenticatedPage` fixture exported from
`fixtures/auth.ts`. The fixture signs in before the test runs and gets its
credentials from `DIGIPRACT_USERNAME` and `DIGIPRACT_PASSWORD`, so credentials
do not need to be written in individual test files.

Create `.env/.envdev` using `.env/.envdev.example` as a template, then run the
tests:

```env
DIGIPRACT_USERNAME=your-username
DIGIPRACT_PASSWORD=your-password
```

```powershell
npm test
npm run allure:generate
```

Playwright is configured to launch Chromium, Firefox, and WebKit in headed
(visible browser) mode, including when tests are run individually.
Screenshots, videos, and traces are retained for failed tests. The Playwright
HTML report is written to `playwright-report/`; the Allure results are written
to `allure-results/` and the generated Allure HTML report is written to
`allure-report/`. Open the generated report locally with `npm run allure:open`.
Each test run starts with fresh Allure results. Both reports show passed, failed,
and skipped tests.

The `.env/.envdev` credentials file is ignored by Git. In GitHub Actions,
configure repository secrets with the same names. Tests that do not need an
authenticated session can continue to use Playwright's standard `page` fixture
by importing `test` from `@playwright/test`.

The first sheet in `testdata/client-data.xlsx`, `Client Types`, contains the
client types used by the create-client test. Each run cycles through that list,
appends a fresh client record with the selected type to the `Clients` sheet, and
uses that record for the form. Keep the workbook closed in Excel while tests
are running so the test can update it.
