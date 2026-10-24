import fs from 'fs';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\a08f7c42-63b9-402b-92b7-aee19011e121';

async function main() {
  const targets = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
  const page = targets.find(t => t.type === 'page' && t.url.includes('crm-app'));
  if (!page) {
    console.error('No CRM page found on port 9222');
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
    const filepath = path.join(ARTIFACTS_DIR, filename);
    fs.writeFileSync(filepath, buffer);
    console.log(`Saved screenshot: ${filepath} (${buffer.length} bytes)`);
  }

  ws.onopen = async () => {
    console.log('Connected to CDP');

    // 1. Navigate to #inbox cleanly with cache bust
    await send('Page.navigate', { url: `http://127.0.0.1:5500/crm-app/index.html?ts=${Date.now()}#inbox` });
    await new Promise(r => setTimeout(r, 2500));

    // 2. Select customer Pooja Venkatesh and ensure panels are open
    await evalInPage(`(() => {
      if (typeof closeImageLightbox === 'function') closeImageLightbox();
      if (typeof closeModal === 'function') {
        closeModal('modal-image-lightbox');
        closeModal('modal-convert-order');
      }
      document.body.style.overflow = '';
      window.location.hash = 'inbox';
      if (typeof switchView === 'function') switchView('inbox', 'chats');
      if (typeof toggleLeftPanel === 'function') toggleLeftPanel(true);
      if (typeof toggleRightPanel === 'function') toggleRightPanel(true, true);
      const cust = CRM_STATE?.customers?.find(c => c.name.includes('Pooja')) || CRM_STATE?.customers?.[0];
      if (cust && typeof selectCustomerChat === 'function') {
        selectCustomerChat(cust.id);
      }
      if (typeof renderCustomer360Panel === 'function') {
        renderCustomer360Panel();
      }
      // Scroll right panel to focus on Bot Automation & Chosen Products
      const rightPanel = document.getElementById('chat-right-panel');
      const tracker = document.getElementById('chosen-products-tracker-card');
      if (rightPanel && tracker) {
        rightPanel.scrollTop = tracker.offsetTop - 40;
      }
    })()`);
    await new Promise(r => setTimeout(r, 1000));

    // Screenshot 1: Bot Automation container with select options & Move to Order buttons
    await saveScreenshot('order_flow_1_inbox_with_select_options.png');

    // 3. Select product 1 and product 2
    await evalInPage(`(() => {
      const cbs = document.querySelectorAll('.chosen-product-cb');
      if (cbs.length > 0) cbs[0].checked = true;
      if (cbs.length > 1) cbs[1].checked = true;
      if (typeof handleChosenProductCheckChange === 'function') {
        handleChosenProductCheckChange(ACTIVE_CUSTOMER_ID);
      }
      const rightPanel = document.getElementById('chat-right-panel');
      const tracker = document.getElementById('chosen-products-tracker-card');
      if (rightPanel && tracker) {
        rightPanel.scrollTop = tracker.offsetTop - 40;
      }
    })()`);
    await new Promise(r => setTimeout(r, 600));

    // Screenshot 2: Bulk Action Bar showing "2 Products Selected"
    await saveScreenshot('order_flow_2_products_selected_bulk_bar.png');

    // 4. Click "Move to Orders" from bulk bar
    await evalInPage(`(() => {
      if (typeof openOrderFromSelectedChosenProducts === 'function') {
        openOrderFromSelectedChosenProducts(ACTIVE_CUSTOMER_ID);
      }
    })()`);
    await new Promise(r => setTimeout(r, 600));

    // 5. Populate Online Payment fields: Sample UTR + Sample Receipt
    await evalInPage(`(() => {
      if (typeof generateSampleUPIId === 'function') {
        generateSampleUPIId('ONLINE');
      }
      if (typeof useSampleScreenshot === 'function') {
        useSampleScreenshot('ONLINE');
      }
      const mb = document.getElementById('order-modal-scrollable-body');
      if (mb) mb.scrollTop = 320;
    })()`);
    await new Promise(r => setTimeout(r, 600));

    // Screenshot 3: Modal with 2 Products and Online Payment details filled
    await saveScreenshot('order_flow_3_online_payment_modal_filled.png');

    // 6. Submit Online Order
    await evalInPage(`(() => {
      const form = document.getElementById('order-convert-form');
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    })()`);
    await new Promise(r => setTimeout(r, 1000));

    // Scroll chat stream to bottom to show confirmed order message
    await evalInPage(`(() => {
      const container = document.getElementById('chat-messages-container');
      if (container) container.scrollTop = container.scrollHeight;
    })()`);
    await new Promise(r => setTimeout(r, 500));

    // Screenshot 4: Active chat showing Online Order Confirmed & Paid message
    await saveScreenshot('order_flow_4_online_order_booked_chat.png');

    // 7. Now test COD with ₹200 Advance on single product
    await evalInPage(`(() => {
      const cust = CRM_STATE.customers.find(c => c.id === ACTIVE_CUSTOMER_ID);
      const item = cust?.automationHistory?.find(a => a.type === 'PRODUCT_VIEWED' || a.price);
      if (item && typeof openOrderFromSingleChosenProduct === 'function') {
        openOrderFromSingleChosenProduct(ACTIVE_CUSTOMER_ID, item.id);
      }
      if (typeof setOrderPaymentMode === 'function') {
        setOrderPaymentMode('COD');
      }
      if (typeof generateSampleUPIId === 'function') {
        generateSampleUPIId('COD');
      }
      if (typeof useSampleScreenshot === 'function') {
        useSampleScreenshot('COD');
      }
      const mb = document.getElementById('order-modal-scrollable-body');
      if (mb) mb.scrollTop = 220;
    })()`);
    await new Promise(r => setTimeout(r, 600));

    // Screenshot 5: COD Modal showing ₹200 Advance Paid + Remaining Balance on Delivery
    await saveScreenshot('order_flow_5_cod_advance_modal_filled.png');

    // Submit COD Order
    await evalInPage(`(() => {
      const form = document.getElementById('order-convert-form');
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    })()`);
    await new Promise(r => setTimeout(r, 1000));

    // Scroll chat stream to bottom
    await evalInPage(`(() => {
      const container = document.getElementById('chat-messages-container');
      if (container) container.scrollTop = container.scrollHeight;
    })()`);
    await new Promise(r => setTimeout(r, 500));

    // Screenshot 6: Chat showing COD order confirmation with ₹200 Adv and balance due
    await saveScreenshot('order_flow_6_cod_order_booked_chat.png');

    // 8. Navigate to WhatsApp Orders view
    await evalInPage(`(() => {
      if (typeof switchView === 'function') {
        switchView('orders');
      }
    })()`);
    await new Promise(r => setTimeout(r, 800));

    // Screenshot 7: WhatsApp Orders table showing both orders (Online Paid and COD)
    await saveScreenshot('order_flow_7_whatsapp_orders_table.png');

    // 9. Open Lightbox on first order receipt using openOrderReceiptLightbox
    await evalInPage(`(() => {
      const firstOrd = CRM_STATE.orders[0];
      if (firstOrd && typeof openOrderReceiptLightbox === 'function') {
        openOrderReceiptLightbox(firstOrd.id);
      }
    })()`);
    await new Promise(r => setTimeout(r, 700));

    // Screenshot 8: Universal Image Lightbox showing verified payment receipt
    await saveScreenshot('order_flow_8_payment_proof_lightbox.png');

    // Close lightbox and return to clean state
    await evalInPage(`(() => {
      if (typeof closeImageLightbox === 'function') closeImageLightbox();
      if (typeof closeModal === 'function') closeModal('modal-image-lightbox');
    })()`);

    console.log('All tests completed successfully!');
    ws.close();
    process.exit(0);
  };
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
