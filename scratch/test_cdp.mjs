import fs from 'fs';
import path from 'path';

const targets = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
const page = targets.find(t => t.type === 'page' && t.url.includes('crm-app'));
if (!page) {
  console.log('No CRM page found');
  process.exit(1);
}
console.log('Target found:', page.title, page.url);

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

async function evalInPage(code) {
  const res = await send('Runtime.evaluate', {
    expression: code,
    returnByValue: true,
    awaitPromise: true
  });
  return res.result ? res.result.value : null;
}

async function saveScreenshot(filename) {
  const res = await send('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(res.data, 'base64');
  const filepath = path.join('C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\a08f7c42-63b9-402b-92b7-aee19011e121', filename);
  fs.writeFileSync(filepath, buffer);
  console.log(`Saved screenshot: ${filepath} (${buffer.length} bytes)`);
}

ws.onopen = async () => {
  console.log('CDP connected');

  // Close any stray modals
  await evalInPage(`(() => {
    const modal = document.getElementById('modal-brand-call');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
    if (typeof endBrandMaskedCall === 'function') {
      try { endBrandMaskedCall(); } catch(e) {}
    }
  })()`);

  // Ensure both panels are restored first to 320px / 350px
  await evalInPage(`(() => {
    toggleLeftPanel(true);
    toggleRightPanel(true, true);
    document.getElementById('inbox-left-panel').style.width = '320px';
    document.getElementById('chat-right-panel').style.width = '350px';
  })()`);
  await new Promise(r => setTimeout(r, 400));

  // 1. Initial State Screenshot
  const s1 = await evalInPage(`(() => ({
    leftWidth: document.getElementById('inbox-left-panel').offsetWidth,
    centerWidth: document.getElementById('chat-center-panel').offsetWidth,
    rightWidth: document.getElementById('chat-right-panel').offsetWidth
  }))()`);
  console.log('1. Normal State:', s1);
  await saveScreenshot('crm_01_all_panels_open.png');

  // 2. Minimize Left Panel
  await evalInPage(`toggleLeftPanel(false)`);
  await new Promise(r => setTimeout(r, 400));
  const s2 = await evalInPage(`(() => ({
    leftDisplay: document.getElementById('inbox-left-panel').style.display,
    centerWidth: document.getElementById('chat-center-panel').offsetWidth,
    floatingLeftVisible: document.getElementById('floating-left-panel-toggle-btn').style.display !== 'none'
  }))()`);
  console.log('2. Left Panel Minimized (Chat dynamically expands):', s2);
  await saveScreenshot('crm_02_left_panel_minimized.png');

  // 3. Restore Left Panel, Minimize Right Panel
  await evalInPage(`toggleLeftPanel(true)`);
  await evalInPage(`toggleRightPanel(false, true)`);
  await new Promise(r => setTimeout(r, 400));
  const s3 = await evalInPage(`(() => ({
    rightDisplay: document.getElementById('chat-right-panel').style.display,
    centerWidth: document.getElementById('chat-center-panel').offsetWidth,
    floatingRightVisible: document.getElementById('floating-panel-toggle-btn').style.display !== 'none'
  }))()`);
  console.log('3. Right Panel Minimized (Chat dynamically expands):', s3);
  await saveScreenshot('crm_03_right_panel_minimized.png');

  // 4. Minimize Both Panels -> Full Screen Ultra-Wide Chat
  await evalInPage(`toggleLeftPanel(false)`);
  await new Promise(r => setTimeout(r, 400));
  const s4 = await evalInPage(`(() => ({
    centerWidth: document.getElementById('chat-center-panel').offsetWidth
  }))()`);
  console.log('4. BOTH Minimized (Full Screen Chat):', s4);
  await saveScreenshot('crm_04_full_screen_chat.png');

  // 5. Restore Both Panels
  await evalInPage(`toggleLeftPanel(true); toggleRightPanel(true, true);`);
  await new Promise(r => setTimeout(r, 400));

  // 6. Test Mouse Drag Resizing on Left Splitter
  const resizerLeftPos = await evalInPage(`(() => {
    const r = document.getElementById('resizer-left-panel').getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + 200 };
  })()`);

  // Simulate mouse drag by +120px
  await evalInPage(`(() => {
    const resizer = document.getElementById('resizer-left-panel');
    resizer.dispatchEvent(new MouseEvent('mousedown', { clientX: ${resizerLeftPos.x}, clientY: ${resizerLeftPos.y}, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: ${resizerLeftPos.x + 120}, clientY: ${resizerLeftPos.y}, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  })()`);
  await new Promise(r => setTimeout(r, 300));

  const s6 = await evalInPage(`(() => ({
    leftWidth: document.getElementById('inbox-left-panel').offsetWidth,
    centerWidth: document.getElementById('chat-center-panel').offsetWidth,
    rightWidth: document.getElementById('chat-right-panel').offsetWidth
  }))()`);
  console.log('5. After Dragging Splitter (Left expanded dynamically):', s6);
  await saveScreenshot('crm_05_mouse_drag_resized.png');

  // Reset back to balanced widths for standard viewing
  await evalInPage(`(() => {
    document.getElementById('inbox-left-panel').style.width = '320px';
    document.getElementById('inbox-left-panel').style.minWidth = '320px';
    localStorage.setItem('GRM_INBOX_LEFT_WIDTH', '320');
  })()`);

  ws.close();
};
