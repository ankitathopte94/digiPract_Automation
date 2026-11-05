import { test as base, type Page } from '@playwright/test';
import { LoginPage } from '../pages/login';

type Fixtures = {
    authenticatedPage: Page;
};

function getCredentials() {
    const env = (globalThis as typeof globalThis & {
        process?: { env?: Record<string, string | undefined> };
    }).process?.env ?? {};
    const username = env.DIGIPRACT_USERNAME;
    const password = env.DIGIPRACT_PASSWORD;

    if (!username || !password) {
        throw new Error(
            'Set DIGIPRACT_USERNAME and DIGIPRACT_PASSWORD in .env/.envdev or the environment to use the authenticatedPage fixture.',
        );
    }

    return { username, password };
}

export const test = base.extend<Fixtures>({
    authenticatedPage: async ({ page }, use) => {
        const { username, password } = getCredentials();
        const loginPage = new LoginPage(page);

        await loginPage.navigateToLoginPage();
        await loginPage.Login(username, password);
        await use(page);
    },
});

export { expect } from '@playwright/test';
