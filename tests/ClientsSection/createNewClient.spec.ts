import { test } from '../../fixtures/auth';
import { appendAndReadClientTestData } from '../../fixtures/clientTestData';
import { ClientsPage } from '../../pages/clients';

test('Create a new client', async ({ authenticatedPage }) => {
    const clientsPage = new ClientsPage(authenticatedPage);
    const clientDetails = await appendAndReadClientTestData();

    await test.step('Click on the Clients section', async () => {
        await clientsPage.clickedClientSec();
    });

    await test.step('Click on New Client Button', async () => {
        await clientsPage.clickOnNewClientButton();
    });

    await test.step('Enter the details to create a client', async () => {
        await clientsPage.enterClientDetails(clientDetails);
        await clientsPage.checkedConsentConfirmed();
    });

    await test.step('Click on Create client button', async () => {
        await clientsPage.createClientButton();
    });

    await test.step('Verify Excel data matches the created client in the UI', async () => {
        await clientsPage.verifyClientDataMatchesUI(clientDetails);
    });
});