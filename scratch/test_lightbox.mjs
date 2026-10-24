import fs from 'fs';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\a08f7c42-63b9-402b-92b7-aee19011e121';

async function main() {
  const targets = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
  const page = targets.find(t => t.type === 'page' && t.url.includes('crm-app'));
  const ws = new WebSocket(page.webSocketDebuggerUrl);

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = Math.floor(Math.random() * 1000000);
      const handler = (m) => {
        const data = JSON.parse(m.data);
        if (data.id === id) {
          ws.removeEventListener('message', handler);
          resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onopen = async () => {
    // Call openOrderReceiptLightbox on the first order
    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        if (typeof openOrderReceiptLightbox === 'function' && CRM_STATE.orders.length > 0) {
          openOrderReceiptLightbox(CRM_STATE.orders[0].id);
        }
        const img = document.getElementById('lightbox-image');
        return {
          srcLen: img?.src?.length,
          naturalWidth: img?.naturalWidth,
          naturalHeight: img?.naturalHeight
        };
      })()`,
      returnByValue: true
    });
    console.log('Lightbox eval result:', evalRes.result.value);

    await new Promise(r => setTimeout(r, 600));

    const res = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const filepath = path.join(ARTIFACTS_DIR, 'order_flow_8_payment_proof_lightbox.png');
    fs.writeFileSync(filepath, buffer);
    console.log(`Saved screenshot: ${filepath} (${buffer.length} bytes)`);

    ws.close();
    process.exit(0);
  };
}

main();
