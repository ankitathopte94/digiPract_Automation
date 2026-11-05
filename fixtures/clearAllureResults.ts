import { rmSync } from 'node:fs';
import path from 'node:path';

async function clearAllureResults(): Promise<void> {
    rmSync(path.resolve(__dirname, '../allure-results'), {
        recursive: true,
        force: true,
    });
}

export default clearAllureResults;
