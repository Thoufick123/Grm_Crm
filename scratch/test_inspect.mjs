import fs from 'fs';

async function main() {
  const targets = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
  const page = targets.find(t => t.type === 'page' && t.url.includes('crm-app'));
  if (!page) {
    console.error('No CRM page found');
    process.exit(1);
  }

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
        if (typeof switchView === 'function') switchView('inbox', 'chats');
        const rightPanel = document.getElementById('chat-right-panel');
        const tracker = document.getElementById('chosen-products-tracker-card');
        if (rightPanel && tracker) {
          rightPanel.scrollTop = tracker.offsetTop - 40;
        }
        return {
          scrollTop: rightPanel ? rightPanel.scrollTop : null
        };
      })()`,
      returnByValue: true
    });

    console.log('Browser State:', JSON.stringify(res.result.value, null, 2));
    await new Promise(r => setTimeout(r, 600));

    const scr = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(scr.data, 'base64');
    const filepath = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\a08f7c42-63b9-402b-92b7-aee19011e121\\order_flow_1_inbox_with_select_options.png';
    fs.writeFileSync(filepath, buffer);
    console.log('Saved order_flow_1:', filepath);
    ws.close();
    process.exit(0);
  };
}

main();
