import fs from 'fs';

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
    const res = await send('Runtime.evaluate', {
      expression: `(() => {
        return CRM_STATE.orders.map(o => ({
          id: o.id,
          method: o.paymentMethod,
          screenshotLen: o.paymentScreenshot ? o.paymentScreenshot.length : 0,
          screenshotPrefix: o.paymentScreenshot ? o.paymentScreenshot.slice(0, 50) : null
        }));
      })()`,
      returnByValue: true
    });
    console.log('Orders screenshot info:', res.result.value);
    ws.close();
    process.exit(0);
  };
}

main();
