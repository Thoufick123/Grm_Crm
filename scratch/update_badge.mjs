import fs from 'fs';
import path from 'path';

const files = [
  path.resolve('crm_app.js'),
  path.resolve('assets/js/crm_app.js')
];

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');

  // Add dynamic subtabUnread in updateBadgeCounters
  const targetUnread = `  // 1. Unread count in inbox
  const unreadEl = document.getElementById('badge-total-unread');
  if (unreadEl) {
    let unreadCount = 0;
    (CRM_STATE.queries || []).forEach(q => {
      if (q.status !== 'DND') {
        unreadCount += (q.unreadCount || 0);
      }
    });
    unreadEl.innerText = unreadCount > 0 ? unreadCount : '0';
  }`;

  const replaceUnread = `  // 1. Unread count in inbox
  const unreadEl = document.getElementById('badge-total-unread');
  const subtabUnread = document.getElementById('subtab-unread-badge');
  let unreadCount = 0;
  (CRM_STATE.queries || []).forEach(q => {
    if (q.status !== 'DND') {
      unreadCount += (q.unreadCount || 0);
    }
  });
  if (unreadEl) {
    unreadEl.innerText = unreadCount > 0 ? unreadCount : '0';
  }
  if (subtabUnread) {
    subtabUnread.innerText = unreadCount > 0 ? unreadCount : '0';
  }`;

  // Normalize line endings for replacement
  content = content.replace(/\r\n/g, '\n');
  const targetNormalized = targetUnread.replace(/\r\n/g, '\n');
  const replaceNormalized = replaceUnread.replace(/\r\n/g, '\n');

  if (content.includes(targetNormalized)) {
    content = content.replace(targetNormalized, replaceNormalized);
    console.log('Updated updateBadgeCounters in', f);
  } else {
    console.log('Target unread block not found in', f);
  }

  // Restore CRLF for Windows
  content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(f, content, 'utf8');
}
console.log('Done');
