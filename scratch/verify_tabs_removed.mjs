import fs from 'fs';

async function main() {
  const targets = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
  const page = targets.find(t => t.type === 'page' && t.url.includes('crm-app'));
  if (!page) {
    console.error('No CRM page found in CDP targets');
    process.exit(1);
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  function send(method, params = {}) {
    return new Promise(resolve => {
      const id = Math.floor(Math.random() * 1000000);
      const handler = m => {
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

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  ws.onopen = async () => {
    console.log('Reloading page with ignoreCache: true...');
    await send('Page.reload', { ignoreCache: true });
    await sleep(3500);

    const check = await send('Runtime.evaluate', {
      expression: `(() => {
        const autoReplyTab = document.getElementById('tab-sub-inbox-autoreply');
        const broadcastTab = document.getElementById('tab-sub-inbox-broadcast');
        const chatsTab = document.getElementById('tab-sub-inbox-chats');
        const navStrip = chatsTab ? chatsTab.closest('div.min-h-\\[46px\\]') || chatsTab.parentElement?.parentElement : null;

        return {
          autoReplyTabExists: Boolean(autoReplyTab),
          broadcastTabExists: Boolean(broadcastTab),
          chatsTabExists: Boolean(chatsTab),
          navStripHtml: navStrip?.outerHTML?.substring(0, 300)
        };
      })()`,
      returnByValue: true
    });
    console.log('Check result:', check.result.value);

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\a08f7c42-63b9-402b-92b7-aee19011e121\\inbox_tabs_removed.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved inbox_tabs_removed.png');

    ws.close();
    process.exit(0);
  };
}

main().catch(console.error);
