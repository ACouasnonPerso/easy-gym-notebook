const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const i18nDir = path.join(__dirname, '..', 'src', 'app', 'assets', 'i18n');

if (!fs.existsSync(path.join(i18nDir, 'en.json'))) {
  console.error(`Error: i18n directory not found or missing en.json: ${i18nDir}`);
  process.exit(1);
}

const langs = ['ar', 'de', 'es', 'fr', 'hi', 'it', 'ja', 'ko', 'nl', 'pl', 'pt', 'ru', 'sv', 'th', 'tr', 'vi'];

for (const lang of langs) {
  console.log(`Translating en -> ${lang}...`);
  execSync(
    `i18n-auto-translation -a deepl-pro -k ae6dab27-2eb1-2ddd-17d2-1193f0af3391 -d . -f en -t ${lang}`,
    { cwd: i18nDir, stdio: 'inherit' }
  );
}

console.log('Done.');
