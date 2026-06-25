// GitHub auto-updater for Kanota portable
// Downloads .zip (preferred) or .exe from release assets, replaces current
const { app, dialog, shell } = require('electron');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const REPO_OWNER = 'asuka091241-ai';
const REPO_NAME = 'Kanota';
const CACHE_FILE = path.join(app.getPath('userData'), 'update-cache.json');

function loadCache() {
  try { if (fs.existsSync(CACHE_FILE)) return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8')); } catch (_) {}
  return {};
}
function saveCache(c) {
  try { fs.writeFileSync(CACHE_FILE, JSON.stringify(c), 'utf-8'); } catch (_) {}
}

function httpGet(url, binary) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const opts = { headers: { 'User-Agent': 'Kanota-Updater/1.0', 'Accept': binary ? 'application/octet-stream' : 'application/json' } };
    mod.get(url, opts, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
        return httpGet(res.headers.location, binary).then(resolve).catch(reject);
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(binary ? Buffer.concat(chunks) : JSON.parse(Buffer.concat(chunks).toString('utf-8'))));
    }).on('error', reject);
  });
}

function download(url, dest, onProgress) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'Kanota-Updater/1.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
        return download(res.headers.location, dest, onProgress).then(resolve).catch(reject);
      if (res.statusCode !== 200) return reject(new Error('Download HTTP ' + res.statusCode));
      const total = parseInt(res.headers['content-length'] || '0', 10);
      let done = 0;
      const file = fs.createWriteStream(dest);
      res.on('data', c => { done += c.length; if (onProgress && total) onProgress(Math.floor(done * 100 / total)); });
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
      file.on('error', reject);
    }).on('error', reject);
  });
}

function cmpVersion(a, b) {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return 1;
    if ((pa[i] || 0) < (pb[i] || 0)) return -1;
  }
  return 0;
}

function isPackaged() {
  return app.isPackaged && !process.defaultApp;
}

function extractZip(zipPath, outDir) {
  return new Promise((resolve, reject) => {
    exec(`powershell -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${outDir}' -Force"`, (err) => {
      if (err) return reject(new Error('extract failed: ' + (err.message || '')));
      resolve();
    });
  });
}

function findExeInDir(dir) {
  function walk(d) {
    let items;
    try { items = fs.readdirSync(d); } catch (_) { return null; }
    for (const name of items) {
      const full = path.join(d, name);
      if (name === 'Kanota.exe') return full;
      try { if (fs.statSync(full).isDirectory()) { const f = walk(full); if (f) return f; } } catch (_) {}
    }
    return null;
  }
  return walk(dir);
}

function writeBatAndInstall(finalExe, tmpDir, dlFile, extractDir, win) {
  const currentExe = app.getPath('exe');
  const batchFile = path.join(tmpDir, 'kanota-update.bat');
  const cleanup = [];
  if (dlFile) cleanup.push(`if exist "${dlFile}" del /f /q "${dlFile}" 2>nul`);
  if (extractDir) cleanup.push(`if exist "${extractDir}" rmdir /s /q "${extractDir}" 2>nul`);
  const bat = [
    '@echo off',
    'chcp 65001 >nul',
    'echo Kanota updating...',
    ':wait',
    'timeout /t 2 /nobreak >nul',
    `if exist "${currentExe}" goto :wait`,
    `move /Y "${finalExe}" "${currentExe}"`,
    'if %errorlevel% neq 0 (',
    '  echo Replace failed! Please update manually.',
    '  pause',
    ') else (',
    '  echo Update complete, starting...',
    `  start "" "${currentExe}"`,
    ')',
    ...cleanup,
    'del /f /q "%~f0"',
  ].join('\r\n');
  fs.writeFileSync(batchFile, bat, 'utf-8');
  if (win && !win.isDestroyed()) {
    win.webContents.send('update:status', 'Restarting...');
    win.webContents.send('update:progress', 100);
    win.setProgressBar(1);
  }
  exec(`start "" cmd /c "${batchFile}"`, { detached: true, stdio: 'ignore' });
  app.quit();
}

async function checkForUpdates(silent) {
  try {
    const currentVersion = app.getVersion();
    const cache = loadCache();
    const now = Date.now();
    if (cache.lastCheck && (now - cache.lastCheck) < 3600000 && silent) {
      return { currentVersion, latestVersion: cache.latestVersion, upToDate: true, cached: true };
    }
    const release = await httpGet('https://api.github.com/repos/' + REPO_OWNER + '/' + REPO_NAME + '/releases/latest');
    const latestVersion = (release.tag_name || '').replace(/^v/i, '');
    if (!latestVersion) return { currentVersion, error: 'no version found' };
    saveCache({ lastCheck: now, latestVersion });
    if (cmpVersion(latestVersion, currentVersion) <= 0) {
      if (!silent) {
        await dialog.showMessageBox({ type: 'info', title: 'Kanota Update', message: 'v' + currentVersion + ' is the latest', buttons: ['OK'] });
      }
      return { currentVersion, latestVersion, upToDate: true };
    }
    return { currentVersion, latestVersion, upToDate: false, release };
  } catch (e) {
    if (!silent) {
      await dialog.showMessageBox({ type: 'error', title: 'Update Check Failed', message: e.message || 'Network error', buttons: ['OK'] });
    }
    return { currentVersion: app.getVersion(), error: e.message };
  }
}

async function downloadAndInstall(release, win) {
  const tmpDir = app.getPath('temp');
  let asset = (release.assets || []).find(a => a.name && a.name.toLowerCase().endsWith('.zip'));
  const isZip = !!asset;
  if (!asset) asset = (release.assets || []).find(a => a.name && a.name.toLowerCase().endsWith('.exe'));
  if (!asset) throw new Error('No .zip or .exe found in release assets');

  const dlFile = path.join(tmpDir, asset.name);
  const extractDir = isZip ? path.join(tmpDir, 'kanota-' + release.tag_name) : null;

  if (win && !win.isDestroyed()) {
    win.setProgressBar(0.01);
    win.webContents.send('update:progress', 0);
    win.webContents.send('update:status', 'Downloading...');
  }

  let finalExe;
  try {
    await download(asset.browser_download_url, dlFile, (pct) => {
      if (win && !win.isDestroyed()) {
        const overall = isZip ? Math.floor(pct * 0.8) : pct;
        win.setProgressBar(overall / 100);
        win.webContents.send('update:progress', overall);
      }
    });

    if (isZip) {
      if (win && !win.isDestroyed()) {
        win.webContents.send('update:status', 'Extracting...');
        win.webContents.send('update:progress', 82);
      }
      if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true, force: true });
      fs.mkdirSync(extractDir, { recursive: true });
      await extractZip(dlFile, extractDir);
      finalExe = findExeInDir(extractDir);
      if (!finalExe) throw new Error('Kanota.exe not found in zip');
      try { fs.unlinkSync(dlFile); } catch (_) {}
    } else {
      finalExe = dlFile;
    }

    if (!isPackaged()) {
      await dialog.showMessageBox({
        type: 'info', title: 'Download Complete',
        message: release.tag_name + ' ready',
        detail: 'Dev mode: manual replace needed.\n\nExe: ' + finalExe,
        buttons: ['Open location', 'OK'],
      }).then(({ response }) => { if (response === 0) shell.showItemInFolder(finalExe); });
      if (win && !win.isDestroyed()) win.setProgressBar(-1);
      return;
    }

    writeBatAndInstall(finalExe, tmpDir, null, extractDir, win);
  } catch (e) {
    try { if (fs.existsSync(dlFile)) fs.unlinkSync(dlFile); } catch (_) {}
    try { if (extractDir && fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true, force: true }); } catch (_) {}
    if (win && !win.isDestroyed()) win.setProgressBar(-1);
    throw e;
  }
}

module.exports = { checkForUpdates, downloadAndInstall, cmpVersion };
