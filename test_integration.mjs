import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = 'E:\\cn pro\\digital-twin-network';

function serveStatic(req, res) {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(rootDir, reqPath);

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  const ext = path.extname(filePath);
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.wasm': 'application/wasm'
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(serveStatic);

server.listen(8090, async () => {
  console.log('Test server started on port 8090');
  
  let failed = false;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`PASS: ${name}`);
    } catch (e) {
      console.error(`FAIL: ${name} - ${e.message}`);
      failed = true;
    }
  }

  // Test 1: Fetch main index.html
  await test('Main index.html is served and contains Netverse integration buttons', async () => {
    const res = await fetch('http://localhost:8090/index.html');
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (!text.includes('id="btn-open-netverse"')) throw new Error('btn-open-netverse missing');
    if (!text.includes('id="btn-sidebar-netverse"')) throw new Error('btn-sidebar-netverse missing');
    if (!text.includes('id="netverse-modal"')) throw new Error('netverse-modal missing');
    if (!text.includes('id="netverse-iframe"')) throw new Error('netverse-iframe missing');
  });

  // Test 2: Fetch styles.css
  await test('styles.css contains Netverse Ops styling', async () => {
    const res = await fetch('http://localhost:8090/css/styles.css');
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (!text.includes('.btn-netverse-launch')) throw new Error('.btn-netverse-launch class missing');
    if (!text.includes('.project-modal')) throw new Error('.project-modal class missing');
  });

  // Test 3: Fetch UIManager.js
  await test('UIManager.js contains setupProjectIntegrations logic', async () => {
    const res = await fetch('http://localhost:8090/js/UIManager.js');
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (!text.includes('setupProjectIntegrations')) throw new Error('setupProjectIntegrations missing');
    if (!text.includes('btn-open-netverse')) throw new Error('btn-open-netverse listener missing');
  });

  // Test 4: Fetch netverse/index.html
  await test('Netverse index.html is accessible', async () => {
    const res = await fetch('http://localhost:8090/netverse/index.html');
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (!text.includes('<div id="root"></div>')) throw new Error('Root div missing');
    if (!text.includes('Netverse Ops')) throw new Error('Title missing');
  });

  // Test 5: Fetch netverse bundle asset
  await test('Netverse JS bundle is accessible', async () => {
    const htmlRes = await fetch('http://localhost:8090/netverse/index.html');
    const htmlText = await htmlRes.text();
    const match = htmlText.match(/src="(\.\/assets\/[^"]+)"/);
    if (!match) throw new Error('Bundle src not found in netverse/index.html');
    const assetPath = match[1].replace('./', '/netverse/');
    const assetRes = await fetch(`http://localhost:8090${assetPath}`);
    if (assetRes.status !== 200) throw new Error(`Asset HTTP ${assetRes.status} for ${assetPath}`);
    const text = await assetRes.text();
    if (text.length < 100000) throw new Error('Asset bundle too small');
  });

  server.close(() => {
    console.log('Test server closed');
    if (failed) {
      console.log('VERDICT: FAIL');
      process.exit(1);
    } else {
      console.log('VERDICT: PASS');
      process.exit(0);
    }
  });
});
