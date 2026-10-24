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
        const btn = document.getElementById('header-reset-inbox-btn');
        const modal = document.getElementById('modal-reset-inbox-confirm');
        return {
          btnExists: Boolean(btn),
          btnDisplay: btn ? window.getComputedStyle(btn).display : null,
          btnOffsetWidth: btn?.offsetWidth,
          btnOffsetHeight: btn?.offsetHeight,
          onclickAttr: btn?.getAttribute('onclick'),
          confirmFn: typeof window.confirmResetInboxMessages,
          resetFn: typeof window.resetInboxMessages,
          modalExists: Boolean(modal),
          modalClass: modal?.className,
          modalDisplay: modal ? window.getComputedStyle(modal).display : null
        };
      })()`,
      returnByValue: true
    });
    console.log('Reset button status:', res.result.value);

    // Test openModal directly
    const modalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        openModal('modal-reset-inbox-confirm');
        const modal = document.getElementById('modal-reset-inbox-confirm');
        return {
          opened: !modal.classList.contains('hidden'),
          display: window.getComputedStyle(modal).display,
          zIndex: window.getComputedStyle(modal).zIndex
        };
      })()`,
      returnByValue: true
    });
    console.log('openModal result:', modalRes.result.value);

    // Save screenshot of the modal open
    const scr = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\a08f7c42-63b9-402b-92b7-aee19011e121\\modal_reset_inbox_test.png', Buffer.from(scr.data, 'base64'));
    console.log('Saved screenshot of modal');

    // Close modal
    await send('Runtime.evaluate', { expression: `closeModal('modal-reset-inbox-confirm')` });

    ws.close();
    process.exit(0);
  };
}

main();
