const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const rimraf = require('rimraf');

function prepareExtension() {
  // 1. Read version from manifest.json
  const manifestPath = path.join(__dirname, 'src', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const version = manifest.version;

  // 2. Create temp folders
  const tempChromePath = path.join(__dirname, 'temp-chrome');
  const tempFirefoxPath = path.join(__dirname, 'temp-firefox');
  fs.mkdirSync(tempChromePath);
  fs.mkdirSync(tempFirefoxPath);
  copyFolderRecursiveSync(path.join(__dirname, 'src'), tempChromePath);
  copyFolderRecursiveSync(path.join(__dirname, 'src'), tempFirefoxPath);

  // 3. Combine manifest files in temp-firefox
  const firefoxManifest = JSON.parse(fs.readFileSync(path.join(tempFirefoxPath, 'manifest.firefox.json'), 'utf8'));
  const combinedManifest = { ...manifest, ...firefoxManifest, ...{ action: undefined } };
  fs.writeFileSync(path.join(tempFirefoxPath, 'manifest.json'), JSON.stringify(combinedManifest));

  // 4. Delete manifest.firefox.json
  fs.unlinkSync(path.join(tempChromePath, 'manifest.firefox.json'));
  fs.unlinkSync(path.join(tempFirefoxPath, 'manifest.firefox.json'));

  // 5. Replace external API
  const apiUrl = process.env.APIURL;
  replaceTokens(tempChromePath, apiUrl);
  replaceTokens(tempFirefoxPath, apiUrl);

  // 6. Archive extensions
  archiveExtension(tempChromePath, `src-chrome-${version}.zip`, 'src');
  archiveExtension(tempFirefoxPath, `src-firefox-${version}.zip`);
}


function copyFolderRecursiveSync(srcPath, destPath) {
  const entries = fs.readdirSync(srcPath, { withFileTypes: true });
  fs.mkdirSync(destPath, { recursive: true });
  entries.forEach((entry) => {
    const src = path.join(srcPath, entry.name);
    const dest = path.join(destPath, entry.name);
    if (entry.isDirectory()) {
      copyFolderRecursiveSync(src, dest);
    } else {
      fs.copyFileSync(src, dest);
    }
  });
}

function archiveExtension(dirPath, name, dir = false) {
  const zipPath = path.join(__dirname, name);
  const zip = archiver('zip', { zlib: { level: 9 } });
  const zipStream = fs.createWriteStream(zipPath);
  zip.pipe(zipStream);
  zip.directory(dirPath, dir);
  zip.finalize();
  zipStream.on('close', () => {
    console.log(`Created ${zipPath}`);
    rimraf.sync(dirPath);
  });
}

function replaceTokens(dirPath, apiUrl) {
  const utilsFilePath = path.join(dirPath, 'utils.js');
  const utilsContent = fs.readFileSync(utilsFilePath, 'utf8');
  const replacedContent = utilsContent
    .replace(/%APIURL%/g, apiUrl)
  fs.writeFileSync(utilsFilePath, replacedContent);
}

prepareExtension();
