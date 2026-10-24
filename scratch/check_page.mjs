async function main() {
  const targets = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
  const page = targets.find(t => t.type === 'page' && t.url.includes('crm-app'));
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  function send(method, params = {}) {
    return new Promise(res => {
      const id = Math.floor(Math.random() * 1000000);
      const h = m => {
        const d = JSON.parse(m.data);
        if (d.id === id) {
          ws.removeEventListener('message', h);
          res(d.result);
        }
      };
      ws.addEventListener('message', h);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }
  ws.onopen = async () => {
    const res = await send('Runtime.evaluate', {
      expression: `(() => {
        return {
          confirmFn: typeof window.confirmResetInboxMessages,
          resetFn: typeof window.resetInboxMessages,
          modal: Boolean(document.getElementById('modal-reset-inbox-confirm')),
          openModalType: typeof window.openModal
        };
      })()`,
      returnByValue: true
    });
    console.log('Evaluated in page right now:', res.result.value);
    ws.close();
  };
}
main();
