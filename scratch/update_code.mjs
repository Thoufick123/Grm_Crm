import fs from 'fs';
import path from 'path';

const files = [
  path.resolve('crm_app.js'),
  path.resolve('assets/js/crm_app.js')
];

const newResetInboxMessages = `function resetInboxMessages(skipAlert) {
  try {
    // 1. Completely clear all inbox conversations, active inquiries, customers, and temporary chat data
    CRM_STATE.conversations = {};
    CRM_STATE.queries = [];
    CRM_STATE.customers = [];
    CRM_STATE.orders = [];
    CRM_STATE.deletedSlots = [];
    CRM_STATE.whatsappLines = null;
    ACTIVE_CUSTOMER_ID = null;
    ACTIVE_SEND_ACCOUNT_ID = 'all';

    if (INITIAL_CRM_DATA && INITIAL_CRM_DATA.whatsappAccount) {
      CRM_STATE.whatsappAccount = JSON.parse(JSON.stringify(INITIAL_CRM_DATA.whatsappAccount));
    }
    if (INITIAL_CRM_DATA && INITIAL_CRM_DATA.dailyMessageTarget) {
      CRM_STATE.dailyMessageTarget = JSON.parse(JSON.stringify(INITIAL_CRM_DATA.dailyMessageTarget));
    }

    // 2. Call backend API to clear messages and live message queue
    fetch('api.php?action=clear_inbox', { method: 'POST' }).catch(() => {});

    // 3. Persist clean state to local storage
    saveCRMState();

    // 4. Re-render UI components cleanly
    renderInbox();
    if (typeof renderCustomer360Panel === 'function') renderCustomer360Panel();
    if (typeof renderChatHeader === 'function') renderChatHeader();
    if (typeof renderChatMessages === 'function') renderChatMessages();
    if (typeof updateBadgeCounters === 'function') updateBadgeCounters();
    if (typeof renderPhoneSwitcherDropdown === 'function') renderPhoneSwitcherDropdown();
    if (typeof updateConfiguredPhoneDisplays === 'function') updateConfiguredPhoneDisplays();
    if (typeof renderEnquiriesTable === 'function') renderEnquiriesTable();
    if (typeof renderOrdersTable === 'function') renderOrdersTable();
    if (typeof renderMultiAccountsHub === 'function') renderMultiAccountsHub();

    if (typeof closeModal === 'function') {
      closeModal('modal-reset-inbox-confirm');
      closeModal('modal-inbound-simulator');
      closeModal('modal-inbound-sim');
    }

    if (!skipAlert && typeof showToast === 'function') {
      showToast(
        'Inbox Cleared',
        'All chat conversations and messages have been cleared.',
        'delete_sweep',
        'emerald'
      );
      if (typeof playChime === 'function') playChime('inbound');
    }
  } catch (err) {
    console.error('Error resetting inbox messages:', err);
    if (typeof showToast === 'function') {
      showToast('Reset Error', err.message, 'error', 'rose');
    }
  }
}
window.resetInboxMessages = resetInboxMessages;`;

const newApplySimPreset = `function applySimPreset(preset) {
  const presets = {
    feeding: { name: 'Customer (Feeding Kurti)', phone: '+91 98000 00001', msg: 'i want a feeding kurti' },
    frock: { name: 'Customer (Baby Frock)', phone: '+91 98000 00002', msg: 'Hello! Is Baby Frock BF-001 Pink colour in 2-3 Years size available in your shop?' },
    maternity: { name: 'Customer (Maternity Gown)', phone: '+91 98000 00003', msg: 'Hi GRM, can you please send me photos and fabric details for the Maternity Maxi Gown?' },
    kavitha: { name: 'Customer (Kids Wear)', phone: '+91 98000 00004', msg: 'Do you have boys organic cotton t-shirt pack in 4-5Y size?' },
    custom: { name: '', phone: '', msg: '' }
  };

  if (presets[preset]) {
    const nameEl = document.getElementById('sim-name');
    const phoneEl = document.getElementById('sim-phone');
    const msgEl = document.getElementById('sim-message');
    if (nameEl) nameEl.value = presets[preset].name;
    if (phoneEl) phoneEl.value = presets[preset].phone;
    if (msgEl) msgEl.value = presets[preset].msg;
  }
}`;

const newToggleNotificationDrawer = `function toggleNotificationDrawer() {
  const pendingFu = (CRM_STATE.followups || []).find(f => f.status === 'PENDING');
  if (pendingFu) {
    showToast('Follow-up Reminder', \`\${pendingFu.customerName} follow-up is scheduled for today at \${pendingFu.time || '12:00 PM'}\`, 'alarm', 'blue');
  } else {
    showToast('Notifications', 'No pending follow-ups or alerts for today', 'notifications', 'emerald');
  }
}`;

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');

  // 1. Replace resetInboxMessages block
  const resetRegex = /function resetInboxMessages\(skipAlert\) \{[\s\S]*?window\.resetInboxMessages = resetInboxMessages;/;
  if (!resetRegex.test(content)) {
    console.error('Failed to find resetInboxMessages in', f);
  } else {
    content = content.replace(resetRegex, newResetInboxMessages);
    console.log('Successfully replaced resetInboxMessages in', f);
  }

  // 2. Replace applySimPreset block
  const simRegex = /function applySimPreset\(preset\) \{[\s\S]*?\n\}/;
  if (!simRegex.test(content)) {
    console.error('Failed to find applySimPreset in', f);
  } else {
    content = content.replace(simRegex, newApplySimPreset);
    console.log('Successfully replaced applySimPreset in', f);
  }

  // 3. Replace toggleNotificationDrawer
  const toggleRegex = /function toggleNotificationDrawer\(\) \{[\s\S]*?\n\}/;
  if (!toggleRegex.test(content)) {
    console.error('Failed to find toggleNotificationDrawer in', f);
  } else {
    content = content.replace(toggleRegex, newToggleNotificationDrawer);
    console.log('Successfully replaced toggleNotificationDrawer in', f);
  }

  // 4. Ensure followups in INITIAL_CRM_DATA is empty
  const followupsRegex = /followups:\s*\[[\s\S]*?id:\s*'FU-2026-0001'[\s\S]*?\],/;
  if (followupsRegex.test(content)) {
    content = content.replace(followupsRegex, 'followups: [],');
    console.log('Successfully emptied INITIAL_CRM_DATA.followups in', f);
  }

  // 5. Ensure initCRMState cleans mock customer data
  const mockCleanMarker = "c && c.id !== 'cust_89660115_account_1'";
  if (!content.includes(mockCleanMarker)) {
    const custInitRegex = /if \(!Array\.isArray\(CRM_STATE\.customers\)\) CRM_STATE\.customers = \[\];/;
    const cleanLogic = `if (!Array.isArray(CRM_STATE.customers)) CRM_STATE.customers = [];
      // Clean up any stale dummy mock customers from state
      CRM_STATE.customers = CRM_STATE.customers.filter(c => 
        c && c.id !== 'cust_89660115_account_1' && c.id !== 'cust_101' && c.id !== 'cust_102' && c.id !== 'cust_103' && c.name !== 'Pooja Venkatesh'
      );
      if (!Array.isArray(CRM_STATE.queries)) CRM_STATE.queries = [];
      CRM_STATE.queries = CRM_STATE.queries.filter(q =>
        q && q.customerId !== 'cust_89660115_account_1' && q.customerId !== 'cust_101' && q.customerId !== 'cust_102' && q.customerId !== 'cust_103'
      );
      if (!CRM_STATE.conversations || typeof CRM_STATE.conversations !== 'object') CRM_STATE.conversations = {};
      delete CRM_STATE.conversations['cust_89660115_account_1'];
      delete CRM_STATE.conversations['cust_101'];
      delete CRM_STATE.conversations['cust_102'];
      delete CRM_STATE.conversations['cust_103'];
      if (!Array.isArray(CRM_STATE.orders)) CRM_STATE.orders = [];
      if (!Array.isArray(CRM_STATE.products)) CRM_STATE.products = [];
      if (!Array.isArray(CRM_STATE.followups)) CRM_STATE.followups = [];
      CRM_STATE.followups = CRM_STATE.followups.filter(f =>
        f && f.customerId !== 'cust_89660115_account_1' && f.customerId !== 'cust_101' && f.customerId !== 'cust_102' && f.customerId !== 'cust_103'
      );`;
    content = content.replace(custInitRegex, cleanLogic);
    console.log('Added mock cleanup to initCRMState in', f);
  }

  fs.writeFileSync(f, content, 'utf8');
}
console.log('Update script completed successfully.');
