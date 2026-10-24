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

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  ws.onopen = async () => {
    console.log('Connected to CDP, reloading page with ignoreCache: true...');
    await send('Page.reload', { ignoreCache: true });
    await sleep(2500);

    // 1. Check initial page state
    const initCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.getElementById('header-reset-inbox-btn');
        const modal = document.getElementById('modal-reset-inbox-confirm');
        return {
          btnFound: Boolean(btn),
          btnText: btn?.innerText?.trim(),
          onclick: btn?.getAttribute('onclick'),
          confirmFnType: typeof window.confirmResetInboxMessages,
          resetFnType: typeof window.resetInboxMessages,
          modalFound: Boolean(modal),
          modalHidden: modal?.classList.contains('hidden')
        };
      })()`,
      returnByValue: true
    });
    console.log('Initial Check:', initCheck.result.value);

    // 2. Click the header Reset Inbox button
    console.log('Clicking #header-reset-inbox-btn...');
    const clickRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.getElementById('header-reset-inbox-btn');
        if (!btn) return { error: 'Button not found' };
        btn.click();
        const modal = document.getElementById('modal-reset-inbox-confirm');
        return {
          modalHidden: modal.classList.contains('hidden'),
          modalDisplay: window.getComputedStyle(modal).display,
          modalZIndex: window.getComputedStyle(modal).zIndex
        };
      })()`,
      returnByValue: true
    });
    console.log('After click header btn:', clickRes.result.value);

    await sleep(600);

    // 3. Capture screenshot of open modal
    const modalShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\a08f7c42-63b9-402b-92b7-aee19011e121\\reset_modal_opened.png', Buffer.from(modalShot.data, 'base64'));
    console.log('Saved reset_modal_opened.png');

    // 4. Click the confirm button in the modal
    console.log('Clicking modal confirm button (resetInboxMessages)...');
    const confirmRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.getElementById('modal-reset-inbox-confirm');
        const confirmBtn = modal.querySelector('button[onclick*="resetInboxMessages"]');
        if (!confirmBtn) return { error: 'Confirm button not found' };
        confirmBtn.click();
        return { clicked: true };
      })()`,
      returnByValue: true
    });
    console.log('Confirm button clicked:', confirmRes.result.value);

    await sleep(1000);

    // 5. Verify post-reset inbox state
    const postResetState = await send('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.getElementById('modal-reset-inbox-confirm');
        const custCount = CRM_STATE?.customers?.length;
        const activeCustId = ACTIVE_CUSTOMER_ID;
        const activeCust = CRM_STATE?.customers?.find(c => c.id === activeCustId);
        const convCount = CRM_STATE?.conversations?.[activeCustId]?.length;
        const chatHeaderName = document.querySelector('#chat-header-customer-name')?.innerText || document.querySelector('.chat-header-name')?.innerText || document.querySelector('h2.font-bold')?.innerText;
        const convListItems = document.querySelectorAll('#conversation-list-container > div, #inbox-chat-list > div').length;
        const toast = document.querySelector('#toast-container')?.innerText;
        return {
          modalHidden: modal.classList.contains('hidden'),
          custCount,
          activeCustId,
          activeCustName: activeCust?.name,
          convCount,
          chatHeaderName,
          convListItems,
          toast
        };
      })()`,
      returnByValue: true
    });
    console.log('Post-Reset State:', postResetState.result.value);

    // 6. Capture screenshot of inbox post-reset
    const postShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\a08f7c42-63b9-402b-92b7-aee19011e121\\inbox_post_reset_verified.png', Buffer.from(postShot.data, 'base64'));
    console.log('Saved inbox_post_reset_verified.png');

    ws.close();
    process.exit(0);
  };
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
