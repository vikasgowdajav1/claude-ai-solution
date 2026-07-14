import { existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const currentDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(currentDir, '../../..');
const envFiles = [
  resolve(repoRoot, '.env.local'),
  resolve(repoRoot, '.env')
];

for (const envFile of envFiles) {
  if (existsSync(envFile)) {
    dotenv.config({ path: envFile });
  }
}

export const ROOT_ENV_PATH = resolve(repoRoot, '.env');