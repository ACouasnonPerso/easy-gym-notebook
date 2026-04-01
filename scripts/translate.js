const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const secretsPath = path.join(__dirname, '..', 'src', 'environments', 'secrets.json');
if (!fs.existsSync(secretsPath)) {
  console.error(`Error: secrets.json not found at ${secretsPath}`);
  console.error('Create src/environments/secrets.json with: { "deeplApiKey": "YOUR_KEY" }');
  process.exit(1);
}
const { deeplApiKey } = JSON.parse(fs.readFileSync(secretsPath, 'utf-8'));

const i18nDir = path.join(__dirname, '..', 'src', 'app', 'assets', 'i18n');

if (!fs.existsSync(path.join(i18nDir, 'en.json'))) {
  console.error(`Error: i18n directory not found or missing en.json: ${i18nDir}`);
  process.exit(1);
}

const langs = ['ar', 'de', 'es', 'fr', 'hi', 'it', 'ja', 'ko', 'nl', 'pl', 'pt', 'ru', 'sv', 'th', 'tr', 'vi'];

for (const lang of langs) {
  console.log(`Translating en -> ${lang}...`);
  execSync(
    `i18n-auto-translation -a deepl-pro -k ${deeplApiKey} -d . -f en -t ${lang}`,
    { cwd: i18nDir, stdio: 'inherit' }
  );
}

console.log('Done.');
