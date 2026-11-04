import { randomInt, randomUUID } from 'node:crypto';
import { open, rename, unlink } from 'node:fs/promises';
import { readFile, utils, writeFile } from '@e965/xlsx';
import path from 'node:path';
import type { ClientDetails } from '../pages/clients';

type ClientTestDataRow = {
    'Full name': string;
    'Client type': string;
    'Trade name': string;
    'Mobile number': string;
    'WhatsApp mobile number': string;
    Email: string;
    Pan: string;
    GSTIN: string;
    Aadhaar: string;
};

type ClientTypeRow = {
    'Client type': string;
};

const clientTypesSheetName = 'Client Types';
const clientsSheetName = 'Clients';

const panEntityTypes: Record<string, string> = {
    'Hindu Undivided Family': 'H',
    Firm: 'F',
    LLP: 'F',
    Company: 'C',
    Trust: 'T',
    AOP: 'A',
    BOI: 'B',
    'Co-Operative Society': 'F',
    Partnership: 'F',
    Individual: 'P',
};

const verhoeffMultiplication = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const verhoeffPermutation = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

const verhoeffInverse = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

function randomLetter(): string {
    return String.fromCharCode(65 + randomInt(26));
}

function createPan(clientType: string): string {
    const entityType = panEntityTypes[clientType] ?? 'P';
    const numericPart = String(randomInt(0, 10_000)).padStart(4, '0');

    return `${randomLetter()}${randomLetter()}${randomLetter()}${entityType}${randomLetter()}${numericPart}${randomLetter()}`;
}

function createAadhaar(): string {
    const firstElevenDigits = `${randomInt(2, 10)}${Array.from(
        { length: 10 },
        () => randomInt(0, 10),
    ).join('')}`;
    let checksum = 0;

    for (let index = 0; index < firstElevenDigits.length; index += 1) {
        const digit = Number(firstElevenDigits[firstElevenDigits.length - 1 - index]);
        checksum =
            verhoeffMultiplication[checksum][
                verhoeffPermutation[(index + 1) % 8][digit]
            ];
    }

    return `${firstElevenDigits}${verhoeffInverse[checksum]}`;
}

function createNewClientRow(template: ClientTestDataRow, clientType: string): ClientTestDataRow {
    const uniqueId = randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase();
    const pan = createPan(clientType);
    const mobileNumber = `9${randomInt(100_000_000, 1_000_000_000)}`;

    return {
        'Full name': `${template['Full name']} ${uniqueId}`,
        'Client type': clientType,
        'Trade name': `${template['Trade name']} ${uniqueId}`,
        'Mobile number': mobileNumber,
        'WhatsApp mobile number': mobileNumber,
        Email: `qa.${uniqueId.toLowerCase()}@example.com`,
        Pan: pan,
        GSTIN: `27${pan}1Z5`,
        Aadhaar: createAadhaar(),
    };
}

function toClientDetails(row: ClientTestDataRow): ClientDetails {
    return {
        fullName: row['Full name'],
        clientType: row['Client type'],
        tradeName: row['Trade name'],
        mobileNumber: row['Mobile number'],
        whatsappMobileNumber: row['WhatsApp mobile number'],
        email: row.Email,
        pan: row.Pan,
        gstin: row.GSTIN,
        aadhaar: row.Aadhaar,
    };
}

function isFileExistsError(error: unknown): boolean {
    return error instanceof Error && 'code' in error && error.code === 'EEXIST';
}

export async function appendAndReadClientTestData(): Promise<ClientDetails> {
    const workbookPath = path.resolve(__dirname, '../testdata/client-data.xlsx');
    const lockPath = `${workbookPath}.lock`;
    const tempPath = `${workbookPath}.${randomUUID()}.tmp.xlsx`;
    let lockHandle: Awaited<ReturnType<typeof open>> | undefined;

    for (let attempt = 0; attempt < 300; attempt += 1) {
        try {
            lockHandle = await open(lockPath, 'wx');
            break;
        } catch (error) {
            if (!isFileExistsError(error)) {
                throw error;
            }

            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }

    if (!lockHandle) {
        throw new Error(`Timed out waiting to update client test data: ${lockPath}`);
    }

    try {
        const workbook = readFile(workbookPath);
        const clientTypesWorksheet = workbook.Sheets[clientTypesSheetName];
        const clientsWorksheet = workbook.Sheets[clientsSheetName];

        if (!clientTypesWorksheet) {
            throw new Error(`No "${clientTypesSheetName}" worksheet found in ${workbookPath}`);
        }

        if (!clientsWorksheet) {
            throw new Error(`No "${clientsSheetName}" worksheet found in ${workbookPath}`);
        }

        const clientTypes = utils
            .sheet_to_json<ClientTypeRow>(clientTypesWorksheet, { defval: '' })
            .map((row) => row['Client type'])
            .filter((clientType) => clientType.length > 0);

        if (clientTypes.length === 0) {
            throw new Error(`No client types found in the "${clientTypesSheetName}" worksheet`);
        }

        const clientRows = utils.sheet_to_json<ClientTestDataRow>(clientsWorksheet, {
            defval: '',
        });
        const [template] = clientRows;

        if (!template) {
            throw new Error(`No client test data template found in the "${clientsSheetName}" worksheet`);
        }

        const normalizedRows = clientRows.map((row) => ({
            ...row,
            'WhatsApp mobile number': row['Mobile number'],
        }));
        const nextClientTypeIndex = Math.max(0, clientRows.length - 1) % clientTypes.length;
        const clientType = clientTypes[nextClientTypeIndex];
        const newRow = createNewClientRow(template, clientType);
        const headers = [
            'Full name',
            'Client type',
            'Trade name',
            'Mobile number',
            'WhatsApp mobile number',
            'Email',
            'Pan',
            'GSTIN',
            'Aadhaar',
        ];
        workbook.Sheets[clientsSheetName] = utils.json_to_sheet(
            [...normalizedRows, newRow],
            { header: headers },
        );
        writeFile(workbook, tempPath);
        await rename(tempPath, workbookPath);

        return toClientDetails(newRow);
    } finally {
        await lockHandle.close();
        await unlink(lockPath);
    }
}
