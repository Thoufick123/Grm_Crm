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
    console.log('Reloading page with cache bypassed...');
    await send('Page.reload', { ignoreCache: true });
    await sleep(3500);

    // 1. Check state after reload
    const check1 = await send('Runtime.evaluate', {
      expression: `(() => {
        return {
          customersCount: CRM_STATE?.customers?.length || 0,
          customerNames: (CRM_STATE?.customers || []).map(c => c.name),
          convKeys: Object.keys(CRM_STATE?.conversations || {}),
          queriesCount: CRM_STATE?.queries?.length || 0,
          activeCustId: ACTIVE_CUSTOMER_ID
        };
      })()`,
      returnByValue: true
    });
    console.log('State after reload (auto-cleanup verification):', check1.result.value);

    // 2. Click the Reset Inbox header button
    console.log('Clicking header Reset Inbox button...');
    const clickHeader = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.getElementById('header-reset-inbox-btn');
        if (!btn) return { error: 'header-reset-inbox-btn not found' };
        btn.click();
        const modal = document.getElementById('modal-reset-inbox-confirm');
        return {
          modalOpened: !modal.classList.contains('hidden'),
          modalText: modal.innerText.trim()
        };
      })()`,
      returnByValue: true
    });
    console.log('After clicking header Reset button:', clickHeader.result.value);

    await sleep(500);

    // 3. Click the confirm "Yes, Clear Inbox" button in the modal
    console.log('Confirming reset/clear inbox...');
    const confirmClick = await send('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.getElementById('modal-reset-inbox-confirm');
        const confirmBtn = modal.querySelector('button[onclick*="resetInboxMessages"]');
        if (!confirmBtn) return { error: 'Confirm button not found' };
        confirmBtn.click();
        return { clicked: true };
      })()`,
      returnByValue: true
    });
    console.log('Confirmed:', confirmClick.result.value);

    await sleep(1000);

    // 4. Verify post-reset clean state
    const postResetState = await send('Runtime.evaluate', {
      expression: `(() => {
        const leftQueueText = document.getElementById('conversation-list-container')?.innerText?.trim();
        const chatHeaderText = document.getElementById('chat-header-bar')?.innerText?.trim();
        const chatStreamText = document.getElementById('chat-messages-stream')?.innerText?.trim();
        const rightPanelText = document.getElementById('chat-right-panel')?.innerText?.trim();
        const toastText = document.getElementById('toast-container')?.innerText?.trim();

        return {
          customersCount: CRM_STATE?.customers?.length || 0,
          queriesCount: CRM_STATE?.queries?.length || 0,
          convKeysCount: Object.keys(CRM_STATE?.conversations || {}).length,
          activeCustId: ACTIVE_CUSTOMER_ID,
          leftQueueText,
          chatHeaderText,
          chatStreamText,
          rightPanelText,
          toastText
        };
      })()`,
      returnByValue: true
    });
    console.log('Post-Reset Clean State:', postResetState.result.value);

    // 5. Capture screenshot of the clean inbox
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\a08f7c42-63b9-402b-92b7-aee19011e121\\clean_inbox_no_hardcodes.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved clean_inbox_no_hardcodes.png');

    ws.close();
    process.exit(0);
  };
}

main().catch(console.error);
