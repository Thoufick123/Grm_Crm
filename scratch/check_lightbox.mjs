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
        const img = document.getElementById('lightbox-image');
        return {
          id: img?.id,
          tagName: img?.tagName,
          src: img?.src?.slice(0, 60),
          complete: img?.complete,
          naturalWidth: img?.naturalWidth,
          naturalHeight: img?.naturalHeight,
          width: img?.width,
          height: img?.height,
          outerHTML: img?.outerHTML?.slice(0, 200)
        };
      })()`,
      returnByValue: true
    });
    console.log('Lightbox image test:', res.result.value);
    ws.close();
    process.exit(0);
  };
}

main();
