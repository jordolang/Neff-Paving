import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Copy admin files to dist/admin
fs.copySync(
  path.resolve(__dirname, '../admin'),
  path.resolve(__dirname, '../dist/admin'),
  { overwrite: true }
);
