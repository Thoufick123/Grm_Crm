import fs from 'fs';

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

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  ws.onopen = async () => {
    console.log('Testing header Reset Inbox button click...');
    const click1 = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.getElementById('header-reset-inbox-btn');
        if (!btn) return { error: 'header-reset-inbox-btn not found' };
        btn.click();
        const modal = document.getElementById('modal-reset-inbox-confirm');
        return {
          clicked: true,
          modalFound: Boolean(modal),
          modalHidden: modal ? modal.classList.contains('hidden') : null,
          modalDisplay: modal ? window.getComputedStyle(modal).display : null,
          modalZIndex: modal ? window.getComputedStyle(modal).zIndex : null
        };
      })()`,
      returnByValue: true
    });
    console.log('Step 1 - Click Reset Inbox button:', click1.result.value);

    await sleep(400);

    // Capture screenshot with modal open
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\a08f7c42-63b9-402b-92b7-aee19011e121\\modal_reset_inbox_dialog.png', Buffer.from(shot1.data, 'base64'));
    console.log('Saved modal_reset_inbox_dialog.png');

    // Step 2 - Click "Yes, Reset Messages"
    const click2 = await send('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.getElementById('modal-reset-inbox-confirm');
        const confirmBtn = modal.querySelector('button[onclick*="resetInboxMessages"]');
        if (!confirmBtn) return { error: 'Confirm button not found' };
        confirmBtn.click();
        return { confirmClicked: true };
      })()`,
      returnByValue: true
    });
    console.log('Step 2 - Click "Yes, Reset Messages":', click2.result.value);

    await sleep(800);

    // Step 3 - Check post-reset state
    const state = await send('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.getElementById('modal-reset-inbox-confirm');
        const custCount = CRM_STATE?.customers?.length;
        const activeCustId = ACTIVE_CUSTOMER_ID;
        const activeCust = CRM_STATE?.customers?.find(c => c.id === activeCustId);
        const convs = CRM_STATE?.conversations?.[activeCustId] || [];
        const leftQueueCards = document.querySelectorAll('#conversation-list-container > div, #inbox-chat-list > div').length;
        const chatMessages = document.querySelectorAll('#chat-messages-container > div, #messages-stream > div').length;
        const toast = document.querySelector('#toast-container')?.innerText;
        return {
          modalHidden: modal ? modal.classList.contains('hidden') : null,
          custCount,
          activeCustId,
          activeCustName: activeCust?.name,
          convCount: convs.length,
          leftQueueCards,
          chatMessages,
          toast
        };
      })()`,
      returnByValue: true
    });
    console.log('Step 3 - Post-reset state:', state.result.value);

    // Capture screenshot post-reset
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\a08f7c42-63b9-402b-92b7-aee19011e121\\inbox_after_reset_dialog.png', Buffer.from(shot2.data, 'base64'));
    console.log('Saved inbox_after_reset_dialog.png');

    ws.close();
    process.exit(0);
  };
}

main().catch(console.error);
