import { expect, Locator, Page } from '@playwright/test';

export type ClientDetails = {
    fullName: string;
    clientType: string;
    tradeName: string;
    mobileNumber: string;
    whatsappMobileNumber: string;
    email: string;
    pan: string;
    gstin: string;
    aadhaar: string;
};

export class ClientsPage {
    private readonly page: Page;
    private readonly clickedClientsSection: Locator;
    private readonly clickedNewClientButton: Locator;
    private readonly fullName: Locator;
    private readonly clientType: Locator;
    private readonly tradeName: Locator;
    private readonly mobileNumber: Locator;
    private readonly whatsappMobileNumber: Locator;
    private readonly email: Locator;
    private readonly pan: Locator;
    private readonly gstin: Locator;
    private readonly aadhaar: Locator;
    private readonly taxAndPiiSection: Locator;
    private readonly confirmedConsentcheckbox: Locator;
    private readonly createdClientButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.clickedClientsSection = page.getByTestId('nav-clients');
        this.clickedNewClientButton = page.getByTestId('clients-add-btn');
        this.fullName = page.locator('input[name="name"]');
        this.clientType = page.getByRole('combobox');
        this.tradeName = page.locator('input[name="contact"]');
        this.mobileNumber = page
            .getByRole('group')
            .filter({ hasText: /^Mobile number/ })
            .getByPlaceholder('10-digit mobile number');
        this.whatsappMobileNumber = page
            .getByRole('group')
            .filter({ hasText: /^WhatsApp number/ })
            .getByPlaceholder('10-digit mobile number');
        this.email = page.locator('input[name="email"]');
        this.pan = page.locator('input[name="pan"]');
        this.gstin = page.locator('input[name="gstin"]');
        this.aadhaar = page.locator('input[name="aadhaar"]');
        this.taxAndPiiSection = page.getByRole('button', { name: 'TAX & PII' });
        this.confirmedConsentcheckbox = page.locator('#consent_confirmed');
        this.createdClientButton = page.getByTestId('client-form-save');
    
    }

    async clickedClientSec(): Promise<void> {
        await this.clickedClientsSection.click();
    }

    async clickOnNewClientButton(): Promise<void> {
        await this.clickedNewClientButton.click();
    }

    async enterClientDetails(details: ClientDetails): Promise<void> {
        await this.fullName.fill(details.fullName);
        await this.clientType.click();
        await this.page.getByRole('option', { name: details.clientType, exact: true }).click();
        await this.tradeName.fill(details.tradeName);
        await this.mobileNumber.fill(details.mobileNumber);
        await this.whatsappMobileNumber.fill(details.whatsappMobileNumber);
        await this.email.fill(details.email);
        await this.taxAndPiiSection.click();
        await this.pan.fill(details.pan);
        await this.gstin.fill(details.gstin);
        await this.aadhaar.fill(details.aadhaar);
    }

    async checkedConsentConfirmed(): Promise<void>{
        await this.confirmedConsentcheckbox.click();
    }

    async createClientButton(): Promise<void>{
        await this.createdClientButton.click();
    }

    async verifyClientDataMatchesUI(details: ClientDetails): Promise<void> {
        const clientLink = this.page.getByRole('link', {
            name: details.fullName,
            exact: true,
        });
        await expect(clientLink).toBeVisible();
        const opensInNewTab = (await clientLink.getAttribute('target')) === '_blank';
        let clientPage = this.page;

        if (opensInNewTab) {
            [clientPage] = await Promise.all([
                this.page.waitForEvent('popup'),
                clientLink.click(),
            ]);
        } else {
            await Promise.all([
                this.page.waitForURL((url) => url.pathname.endsWith('/history')),
                clientLink.click(),
            ]);
        }

        const detailsTab = clientPage.getByText('Details', { exact: true });
        await expect(detailsTab).toBeVisible();
        await detailsTab.click();

        await expect(clientPage.getByText(details.tradeName, { exact: true })).toBeVisible();
        await expect(clientPage.getByText(details.email, { exact: true })).toBeVisible();
        await expect(clientPage.getByText(details.gstin, { exact: true })).toBeVisible();
        await expect(
            clientPage.getByText(
                new RegExp(
                    `\\+?91\\s*${details.mobileNumber.slice(0, 5)}\\s*${details.mobileNumber.slice(5)}$`,
                ),
            ),
        ).toBeVisible();
    }
}