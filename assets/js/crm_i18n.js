/**
 * GRM WHATSAPP CRM — MULTI-LANGUAGE & I18N TRANSLATION ENGINE
 * Supports: English (en), Tamil (ta), Hindi (hi), Telugu (te), Malayalam (ml), Kannada (kn)
 */

(function () {
  'use strict';

  // 1. Cross-Platform SVG Country Flags (Guaranteed to render on Windows, Mac, Linux, iOS & Android)
  const FLAG_SVGS = {
    in: `<svg class="w-5 h-3.5 rounded-[2px] shadow-2xs inline-block align-middle shrink-0 border border-slate-300" viewBox="0 0 900 600" aria-label="India Flag"><rect width="900" height="200" fill="#FF9933"/><rect y="200" width="900" height="200" fill="#FFFFFF"/><rect y="400" width="900" height="200" fill="#128807"/><g transform="translate(450, 300)"><circle r="60" fill="none" stroke="#000088" stroke-width="8"/><circle r="12" fill="#000088"/><line x1="0" y1="-60" x2="0" y2="60" stroke="#000088" stroke-width="2.5"/><line x1="-15.5" y1="-58" x2="15.5" y2="58" stroke="#000088" stroke-width="2.5"/><line x1="-30" y1="-52" x2="30" y2="52" stroke="#000088" stroke-width="2.5"/><line x1="-42.4" y1="-42.4" x2="42.4" y2="42.4" stroke="#000088" stroke-width="2.5"/><line x1="-52" y1="-30" x2="52" y2="30" stroke="#000088" stroke-width="2.5"/><line x1="-58" y1="-15.5" x2="58" y2="15.5" stroke="#000088" stroke-width="2.5"/><line x1="-60" y1="0" x2="60" y2="0" stroke="#000088" stroke-width="2.5"/><line x1="-58" y1="15.5" x2="58" y2="-15.5" stroke="#000088" stroke-width="2.5"/><line x1="-52" y1="30" x2="52" y2="-30" stroke="#000088" stroke-width="2.5"/><line x1="-42.4" y1="42.4" x2="42.4" y2="-42.4" stroke="#000088" stroke-width="2.5"/><line x1="-30" y1="52" x2="30" y2="-52" stroke="#000088" stroke-width="2.5"/><line x1="-15.5" y1="58" x2="15.5" y2="-58" stroke="#000088" stroke-width="2.5"/></g></svg>`,
    gb: `<svg class="w-5 h-3.5 rounded-[2px] shadow-2xs inline-block align-middle shrink-0 border border-slate-300" viewBox="0 0 60 30" aria-label="UK Flag"><clipPath id="uk-flag-clip"><rect width="60" height="30"/></clipPath><g clip-path="url(#uk-flag-clip)"><rect width="60" height="30" fill="#012169"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/><path d="M0,0 L30,15 M60,30 L30,15 M60,0 L30,15 M0,30 L30,15" stroke="#C8102E" stroke-width="2"/><path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10"/><path d="M30,0 v30 M0,15 h60" stroke="#C8102E" stroke-width="6"/></g></svg>`
  };

  const LANGUAGES = [
    { code: 'en', flag: '🇬🇧', flagSvg: FLAG_SVGS.gb, label: 'English', native: 'English' },
    { code: 'ta', flag: '🇮🇳', flagSvg: FLAG_SVGS.in, label: 'Tamil', native: 'தமிழ்' },
    { code: 'hi', flag: '🇮🇳', flagSvg: FLAG_SVGS.in, label: 'Hindi', native: 'हिन्दी' },
    { code: 'te', flag: '🇮🇳', flagSvg: FLAG_SVGS.in, label: 'Telugu', native: 'తెలుగు' },
    { code: 'ml', flag: '🇮🇳', flagSvg: FLAG_SVGS.in, label: 'Malayalam', native: 'മലയാളം' },
    { code: 'kn', flag: '🇮🇳', flagSvg: FLAG_SVGS.in, label: 'Kannada', native: 'ಕನ್ನಡ' }
  ];

  // 2. Comprehensive Multi-Language Translation Dictionaries
  const DICTIONARY = {
    en: {
      // Navigation
      'nav.inbox': 'Live Conversations',
      'nav.enquiries': 'Customer Enquiries',
      'nav.dashboard': 'Dashboard',
      'nav.catalog': 'Product Catalog',
      'nav.orders': 'Sales Orders',
      'nav.followups': 'Follow-up Workstation',
      'nav.customers': 'Customer 360',
      'nav.dnd': 'DND / Opt-Out List',
      'nav.staff': 'Staff Management',
      'nav.audit': 'Audit Logs',
      'nav.settings': 'Settings & Backup',
      'nav.backup': 'Data Backup & Restore',
      'nav.autoreply': 'Auto-Reply Rules',
      'nav.broadcast': 'Broadcast Engine',

      // Header & Global Actions
      'header.live_queue': 'Live Queue',
      'header.switch_phone': 'Switch WhatsApp Line',
      'header.masking': 'Masking:',
      'header.masking_on': 'ON',
      'header.masking_off': 'OFF',
      'header.reset_inbox': 'Reset Inbox',
      'header.logout': 'Logout',
      'header.search_placeholder': 'Search chats, leads, customers (Ctrl+K)...',
      'header.language': 'Select Language',

      // Common Actions
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.search': 'Search',
      'common.export_all': 'Export All',
      'common.refresh': 'Refresh',
      'common.filter': 'Filter',
      'common.status': 'Status',
      'common.priority': 'Priority:',
      'common.action': 'Action',
      'common.close': 'Close',
      'common.view': 'View',
      'common.active': 'Active',
      'common.today': 'Today',
      'common.all': 'All',
      'common.notes': 'Notes',
      'common.hide': 'Hide',
      'common.optional': 'Optional',
      'common.assign': 'Assign',
      'common.call': 'Call',

      // Query & Customer Status
      'status.new': 'New Lead',
      'status.pending': 'Payment Pending',
      'status.follow_up': 'Follow Up',
      'status.in_progress': 'In Progress',
      'status.assigned': 'Assigned',
      'status.resolved': 'Resolved / Closed',
      'status.converted': 'Converted to Sale',
      'status.dnd': 'DND / Not Interested',
      'status.lost': 'Lead Lost',

      // Customer 360 & Chat
      'customer.title': 'Customer 360 Details',
      'customer.hide_profile': 'Hide Profile',
      'customer.profile': 'Profile',
      'customer.handled_by': 'Handled by:',
      'customer.unassigned': 'Unassigned',
      'customer.call_via': 'Call via',
      'customer.masked_caller_id': 'Masked Caller ID',
      'customer.call_subtext': 'Customer sees only',
      'customer.sim_hidden': 'Staff SIM hidden',
      'customer.profile_details': 'Customer Profile Details',
      'customer.editing_mode': 'Editing Mode',
      'customer.saved_locked': 'Saved & Locked',
      'customer.name': 'Customer Name *:',
      'customer.full_name': 'Full Name',
      'customer.phone': 'WhatsApp Phone *:',
      'customer.auto_fetched': 'Auto-Fetched',
      'customer.gender': 'Gender:',
      'customer.select': '-- Select --',
      'customer.female': 'Female',
      'customer.male': 'Male',
      'customer.other': 'Other',
      'customer.address': 'Delivery Address:',
      'customer.address_placeholder': 'Door No, Street, Landmark, City, Pincode',
      'customer.mindset_notes': 'Customer Mindset & Notes:',
      'customer.mindset_log': 'Mindset Log',
      'customer.notes_placeholder': 'Record customer mindset, fabric/size preferences, wholesale budget, buying behavior, or special instructions...',
      'customer.save_details': 'Save Customer Details',
      'customer.edit_details': 'Edit Customer Details & Notes',
      'customer.enquiry_status': 'Enquiry Status & State',
      'customer.change_status': 'Change Status:',
      'customer.editable': 'Editable',
      'customer.callback_date': 'Callback Date:',
      'customer.status_notes': 'Status Change Notes & Remarks:',
      'customer.add_note_state': 'Add Note for State',
      'customer.notes_log': 'Notes Log',
      'customer.quick': 'Quick:',
      'customer.add_note': 'Add Note',
      'customer.type_note': 'Type new note...',
      'customer.pay_option': 'Payment Pending Option',
      'customer.total_amount': 'Total Amount:',
      'customer.shipping': 'Shipping:',
      'customer.payment_mode': 'Mode:',
      'customer.advance': 'Advance:',
      'customer.balance': 'Balance:',
      'customer.advance_payment': 'Advance Payment (₹):',
      'customer.due_date': 'Payment Due Date:',
      'customer.quoted_items': 'Quoted Items:',
      'customer.promise_notes': 'Payment Promise Notes:',
      'customer.share_payment': 'Share Payment Request to Chat',
      'customer.save_status_log': 'Save Status & Log History',
      'customer.type_message': 'Type a message or response to customer (Press Enter to send)...',
      'customer.send': 'Send',
      'customer.send_catalog': 'Stock & Share',
      'customer.order_booking': 'Book Order',

      // Header Titles
      'header.title.dashboard': 'WhatsApp Operations Dashboard',
      'header.sub.dashboard': 'Real-time overview of inquiries, active sessions, and communication health',
      'header.title.inbox': 'WhatsApp Inbox & Customer Queue',
      'header.sub.inbox': 'Live conversation management with instant staff assignment & order booking',
      'header.title.followups': 'Customer Follow-up Scheduler',
      'header.sub.followups': 'Automated reminders to prevent lost customer enquiries',
      'header.title.catalog': 'Garment Product Catalog & Live Stock',
      'header.sub.catalog': 'Live available stock calculator and 1-click WhatsApp card sharing',
      'header.title.orders': 'WhatsApp Sales Orders & Reservations',
      'header.sub.orders': 'Direct orders booked from WhatsApp chats with reserved inventory',
      'header.title.customers': 'Customer 360 & Tag Directory',
      'header.sub.customers': 'Profiles, purchase history, and communication preferences',
      'header.title.dnd': 'DND & Opt-Out Customer Hub',
      'header.sub.dnd': 'Customers who requested not to receive garment product offers or messages',
      'header.title.staff': 'Staff & Team Management Hub',
      'header.sub.staff': 'Onboard team members, assign operational roles & permissions, and monitor workloads',
      'header.title.audit': 'System Audit Trail & Security Logs',
      'header.sub.audit': 'Tamper-proof record of every staff assignment and order update',
      'header.title.analytics': 'Staff Performance Analytics & KPIs',
      'header.sub.analytics': 'Factual metrics on response times, volume handled, and conversions',
      'header.title.settings': 'WhatsApp Business Settings & Phone Configuration',
      'header.sub.settings': 'Set your primary WhatsApp Business number for dynamic live message routing',
      'header.title.backup': 'Data Backup & Recovery Hub',
      'header.sub.backup': 'Full database snapshot export, restore, and zero-data-loss protection',

      // Dashboard
      'dash.total_enquiries': 'Total Enquiries Today',
      'dash.inbound_capture': '100% Inbound Capture',
      'dash.unassigned_queries': 'Unassigned Queries',
      'dash.action_required': 'Action required by Admin',
      'dash.orders_booked': 'WhatsApp Orders Booked',
      'dash.total_sales': 'Total Sales',
      'dash.followups_scheduled': 'Follow-ups Scheduled',
      'dash.automated_reminders': 'Automated Reminders Active',
      'dash.active_conversations': 'Active WhatsApp Conversations',
      'dash.active_conversations_sub': 'Live feed of pending customer chats across all staff',
      'dash.open_inbox': 'Open Inbox →',
      'dash.staff_performance': 'Staff Performance Snapshot',
      'dash.orders_converted': 'Orders Converted',
      'dash.active_leads': 'Active Leads',
      'dash.open': 'Open',

      // Inbox Queue & Workstation
      'inbox.todays_messages': 'Today\'s Messages:',
      'inbox.search_placeholder': 'Search customer, phone, SKU, Query ID...',
      'inbox.all': 'All',
      'inbox.unassigned': 'Unassigned',
      'inbox.my_queue': 'My Queue',
      'inbox.urgent': 'Urgent',
      'inbox.autoreply_paused': 'Auto-Reply is PAUSED:',
      'inbox.autoreply_paused_sub': 'Automated WhatsApp messages are OFF. Manual staff reply is required for incoming messages.',
      'inbox.resume_autoreply': 'Resume Auto-Reply',
      'inbox.no_messages': 'No messages recorded in this chat yet',
      'inbox.quick_templates': 'Quick Templates:',
      'inbox.repeat_customer': 'Repeat Customer',
      'inbox.new_customer': 'New Customer',
      'inbox.reassign': 'Reassign',
      'inbox.staff_label': 'Staff',
      'inbox.customer': 'Customer',

      // Auto-Reply Hub
      'ar.title': 'WhatsApp Pre-Set Templates & Auto-Reply Hub',
      'ar.subtitle': 'Admin pre-set questions, stock templates & instant automated responses',
      'ar.bot_label': 'Auto-Reply Bot:',
      'ar.back_to_chats': 'Back to Chats',
      'ar.search_placeholder': 'Search pre-set questions or keywords (e.g. feeding kurti, frocks, address)...',
      'ar.all_templates': 'All Templates',
      'ar.active_only': 'Active Auto-Replies Only',
      'ar.category_links': 'Category Stock Links',
      'ar.custom_answers': 'Custom Answers',
      'ar.add_template': '+ Add Pre-Set Question & Reply',
      'ar.active_templates': 'Active Templates',

      // Toasts & Notifications
      'toast.lang_changed': 'Language Updated',
      'toast.lang_desc': 'CRM language successfully switched to',
      'header.title.inbox_chats': "WhatsApp Inbox & Customer Queue",
      'header.sub.inbox_chats': "Live conversation management with instant staff assignment & order booking",
      'header.title.inbox_autoreply': "WhatsApp Inbox — Pre-Set Templates & Auto-Reply Hub",
      'header.sub.inbox_autoreply': "Configure automated responses, stock catalog links, trigger keywords & smart question answering",
      'header.title.inbox_broadcast': "WhatsApp Inbox — Automated Template Broadcast",
      'header.sub.inbox_broadcast': "Send personalized promotional templates & announcements to customer chats with variable tags",
      'chat.select_conversation': "Select a conversation to start chatting",
      'chat.staff_prefix': "Staff: ",
      'chat.customer_prefix': "Customer: ",
      'chat.staff_label': "Staff",
      'chat.staff': "Staff:",
      'chat.recent': "Recent",
      'chat.no_messages': "No messages yet",
      'badge.urgent': "URGENT",
      'badge.high': "HIGH",
      'badge.dnd': "DND",
      'badge.payment_pending': "PAYMENT PENDING",
      'badge.follow_up': "FOLLOW-UP",
      'badge.in_progress': "IN PROGRESS",
      'badge.resolved': "RESOLVED",
      'badge.converted': "CONVERTED",
      'common.my_queue': "My Queue",
      'common.unassigned': "Unassigned",
      'common.reset': "Reset",
      'common.reassign': "Reassign",
      'common.assigned': "Assigned",
      'common.customer': "Customer",
      'inbox.title': "WhatsApp Inbox & Customer Queue",
      'inbox.subtitle': "Live conversation management with instant staff assignment & order booking",
      'inbox.scan_qr': "+ Scan New WhatsApp Line / QR",
      'inbox.active_lines': "Active Lines",
      'broadcast.title': "Automated WhatsApp Template Broadcast",
      'broadcast.safe_badge': "Free & Safe Dispatch",
      'broadcast.desc': "Send personalized promotional templates & announcements to customer chats with instant variable personalization",
      'broadcast.back_chats': "Back to Chats",
      'broadcast.choose_template': "Choose Message Template:",
      'broadcast.save_new': "Save New",
      'broadcast.msg_content': "Message Content:",
      'broadcast.quick_insert': "Quick Insert:",
      'broadcast.dynamic_values': "Set Dynamic Template Values",
      'broadcast.live_sync': "Live Sync",
      'broadcast.add_variable': "Add Variable",
      'broadcast.start_broadcast': "Start Automated Broadcast"
    },

    ta: {
      // Navigation
      'nav.inbox': 'நேரலை உரையாடல்கள்',
      'nav.enquiries': 'வாடிக்கையாளர் விசாரணைகள்',
      'nav.dashboard': 'டாஷ்போர்டு',
      'nav.catalog': 'தயாரிப்பு பட்டியல்',
      'nav.orders': 'விற்பனை ஆர்டர்கள்',
      'nav.followups': 'பின்தொடர்தல் மையம்',
      'nav.customers': 'வாடிக்கையாளர் 360',
      'nav.dnd': 'அழைக்காதே (DND) பட்டியல்',
      'nav.staff': 'பணியாளர் மேலாண்மை',
      'nav.audit': 'தணிக்கை பதிவுகள்',
      'nav.settings': 'அமைப்புகள் & காப்புநகல்',
      'nav.backup': 'தரவு காப்பு & மீட்டெடுப்பு',
      'nav.autoreply': 'தானியங்கி பதில்கள்',
      'nav.broadcast': 'செய்தி ஒளிபரப்பு',

      // Header & Global Actions
      'header.live_queue': 'நேரலை வரிசை',
      'header.switch_phone': 'வாட்ஸ்அப் எண் மாற்று',
      'header.masking': 'மறைத்தல்:',
      'header.masking_on': 'இயக்கத்தில்',
      'header.masking_off': 'முடக்கப்பட்டது',
      'header.reset_inbox': 'இன்பாக்ஸ் மீட்டமை',
      'header.logout': 'வெளியேறு',
      'header.search_placeholder': 'அரட்டைகள், வாடிக்கையாளர்களைத் தேடுங்கள்...',
      'header.language': 'மொழியைத் தேர்ந்தெடுக்கவும்',

      // Common Actions
      'common.save': 'சேமிக்க',
      'common.cancel': 'ரத்து செய்',
      'common.delete': 'நீக்கு',
      'common.edit': 'திருத்து',
      'common.search': 'தேடுக',
      'common.export_all': 'அனைத்தும் ஏற்றுமதி',
      'common.refresh': 'புதுப்பி',
      'common.filter': 'வடிகட்டுக',
      'common.status': 'நிலை',
      'common.priority': 'முன்னுரிமை:',
      'common.action': 'செயல்',
      'common.close': 'மூடு',
      'common.view': 'பார்வை',
      'common.active': 'செயலில்',
      'common.today': 'இன்று',
      'common.all': 'அனைத்தும்',
      'common.notes': 'குறிப்புகள்',
      'common.hide': 'மறைக்க',
      'common.optional': 'விருப்பத்தேர்வு',
      'common.assign': 'ஒதுக்க',
      'common.call': 'அழை',

      // Query & Customer Status
      'status.new': 'புதிய வாடிக்கையாளர்',
      'status.pending': 'பணம் நிலுவையில்',
      'status.follow_up': 'பின்தொடரவும்',
      'status.in_progress': 'செயலில் உள்ளது',
      'status.assigned': 'ஒதுக்கப்பட்டது',
      'status.resolved': 'முடிவுற்றது',
      'status.converted': 'விற்பனையானது',
      'status.dnd': 'விருப்பமில்லை (DND)',
      'status.lost': 'இழக்கப்பட்ட லீட்',

      // Customer 360 & Chat
      'customer.title': 'வாடிக்கையாளர் 360 விபரம்',
      'customer.hide_profile': 'விவரங்களை மறை',
      'customer.profile': 'சுயவிவரம்',
      'customer.handled_by': 'கையாளுபவர்:',
      'customer.unassigned': 'ஒதுக்கப்படவில்லை',
      'customer.call_via': 'அழைப்பு மூலம்',
      'customer.masked_caller_id': 'மறைக்கப்பட்ட அழைப்பாளர் ஐடி',
      'customer.call_subtext': 'வாடிக்கையாளர் காண்பது',
      'customer.sim_hidden': 'பணியாளர் சிம் மறைக்கப்பட்டது',
      'customer.profile_details': 'வாடிக்கையாளர் சுயவிவரம்',
      'customer.editing_mode': 'திருத்தும் முறை',
      'customer.saved_locked': 'சேமிக்கப்பட்டு பூட்டப்பட்டது',
      'customer.name': 'வாடிக்கையாளர் பெயர் *:',
      'customer.full_name': 'முழுப் பெயர்',
      'customer.phone': 'வாட்ஸ்அப் எண் *:',
      'customer.auto_fetched': 'தானாகப் பெறப்பட்டது',
      'customer.gender': 'பாலினம்:',
      'customer.select': '-- தேர்ந்தெடுக்கவும் --',
      'customer.female': 'பெண்',
      'customer.male': 'ஆண்',
      'customer.other': 'மற்றவை',
      'customer.address': 'விநியோக முகவரி:',
      'customer.address_placeholder': 'கதவு எண், தெரு, பகுதி, நகரம், பின்கோடு',
      'customer.mindset_notes': 'வாடிக்கையாளர் எண்ணம் & குறிப்புகள்:',
      'customer.mindset_log': 'எண்ணப் பதிவு',
      'customer.notes_placeholder': 'வாடிக்கையாளர் விருப்பம், அளவு, பட்ஜெட் மற்றும் சிறப்பு குறிப்புகள்...',
      'customer.save_details': 'வாடிக்கையாளர் விவரங்களைச் சேமி',
      'customer.edit_details': 'வாடிக்கையாளர் விபரம் திருத்து',
      'customer.enquiry_status': 'விசாரணை நிலை',
      'customer.change_status': 'நிலையை மாற்றுக:',
      'customer.editable': 'திருத்தக்கூடியது',
      'customer.callback_date': 'அழைப்பு தேதி:',
      'customer.status_notes': 'நிலை மாற்றக் குறிப்புகள்:',
      'customer.add_note_state': 'நிலைக்கு குறிப்பு சேர்',
      'customer.notes_log': 'குறிப்பு பதிவு',
      'customer.quick': 'விரைவு:',
      'customer.add_note': 'குறிப்பு சேர்',
      'customer.type_note': 'புதிய குறிப்பை உள்ளிடவும்...',
      'customer.pay_option': 'பணம் நிலுவை விருப்பம்',
      'customer.total_amount': 'மொத்த தொகை:',
      'customer.shipping': 'டெலிவரி கட்டணம்:',
      'customer.payment_mode': 'முறை:',
      'customer.advance': 'முன்பணம்:',
      'customer.balance': 'மீதித் தொகை:',
      'customer.advance_payment': 'முன்பணம் (₹):',
      'customer.due_date': 'பணம் செலுத்த வேண்டிய தேதி:',
      'customer.quoted_items': 'பொருட்கள் விபரம்:',
      'customer.promise_notes': 'பணம் உறுதியளிப்பு குறிப்புகள்:',
      'customer.share_payment': 'அரட்டையில் கட்டண கோரிக்கையைப் பகிரவும்',
      'customer.save_status_log': 'நிலையைச் சேமித்து வரலாற்றைப் பதிவு செய்',
      'customer.type_message': 'செய்தியை உள்ளிடவும் (அனுப்ப Enter அழுத்தவும்)...',
      'customer.send': 'அனுப்புக',
      'customer.send_catalog': 'பட்டியல் பகிர்வு',
      'customer.order_booking': 'ஆர்டர் பதிவு',

      // Header Titles
      'header.title.dashboard': 'வாட்ஸ்அப் செயல்பாடுகள் டாஷ்போர்டு',
      'header.sub.dashboard': 'விசாரணைகள், உரையாடல்கள் மற்றும் செயல்பாடுகளின் நேரலை கண்ணோட்டம்',
      'header.title.inbox': 'வாட்ஸ்அப் இன்பாக்ஸ் & வாடிக்கையாளர் வரிசை',
      'header.sub.inbox': 'பணியாளர் ஒதுக்கீடு மற்றும் நேரலை உரையாடல் மேலாண்மை',
      'header.title.followups': 'பின்தொடர்தல் அட்டவணை மையம்',
      'header.sub.followups': 'விசாரணைகள் தவறாமல் இருக்க தானியங்கி நினைவூட்டல்கள்',
      'header.title.catalog': 'ஆடை பட்டியல் & நேரடி இருப்பு',
      'header.sub.catalog': 'நேரடி இருப்பு கணக்கீடு மற்றும் வாட்ஸ்அப் பகிர்வு',
      'header.title.orders': 'வாட்ஸ்அப் விற்பனை ஆர்டர்கள்',
      'header.sub.orders': 'வாட்ஸ்அப் அரட்டையிலிருந்து முன்பதிவு செய்யப்பட்ட ஆர்டர்கள்',
      'header.title.customers': 'வாடிக்கையாளர் 360 & விபரங்கள்',
      'header.sub.customers': 'சுயவிவரங்கள், வாங்கிய வரலாறு மற்றும் விருப்பங்கள்',
      'header.title.dnd': 'DND & விலகல் வாடிக்கையாளர் மையம்',
      'header.sub.dnd': 'சலுகை செய்திகள் பெற விரும்பாத வாடிக்கையாளர்கள்',
      'header.title.staff': 'பணியாளர் மேலாண்மை மையம்',
      'header.sub.staff': 'பணியாளர் பொறுப்புகள் மற்றும் பணிச்சுமை கண்காணிப்பு',
      'header.title.audit': 'பாதுகாப்பு & தணிக்கை பதிவுகள்',
      'header.sub.audit': 'பணியாளர் மாற்றங்கள் மற்றும் ஆர்டர் பதிவுகள்',
      'header.title.analytics': 'பணியாளர் செயல்திறன் & அறிக்கைகள்',
      'header.sub.analytics': 'பதிலளிக்கும் நேரம் மற்றும் ஆர்டர் மாற்றங்களின் அளவீடுகள்',
      'header.title.settings': 'வாட்ஸ்அப் வணிக அமைப்புகள்',
      'header.sub.settings': 'வாட்ஸ்அப் எண்கள் மற்றும் தானியங்கி கட்டமைப்பு',
      'header.title.backup': 'தரவு காப்பு & மீட்டெடுப்பு',
      'header.sub.backup': 'முழு தரவுத்தள காப்புநகல் மற்றும் பாதுகாப்பு',

      // Dashboard
      'dash.total_enquiries': 'இன்றைய மொத்த விசாரணைகள்',
      'dash.inbound_capture': '100% நேரலை பிடிப்பு',
      'dash.unassigned_queries': 'ஒதுக்கப்படாத விசாரணைகள்',
      'dash.action_required': 'நிர்வாகி நடவடிக்கை தேவை',
      'dash.orders_booked': 'பதிவு செய்யப்பட்ட ஆர்டர்கள்',
      'dash.total_sales': 'மொத்த விற்பனை',
      'dash.followups_scheduled': 'திட்டமிடப்பட்ட பின்தொடர்தல்கள்',
      'dash.automated_reminders': 'தானியங்கி நினைவூட்டல்கள் செயலில்',
      'dash.active_conversations': 'செயலில் உள்ள வாட்ஸ்அப் உரையாடல்கள்',
      'dash.active_conversations_sub': 'பணியாளர்கள் கையாளும் நேரலை அரட்டைகள்',
      'dash.open_inbox': 'இன்பாக்ஸ் திற →',
      'dash.staff_performance': 'பணியாளர் செயல்திறன் சுருக்கம்',
      'dash.orders_converted': 'மாற்றப்பட்ட ஆர்டர்கள்',
      'dash.active_leads': 'செயலில் உள்ள விசாரணைகள்',
      'dash.open': 'திறக்க',

      // Inbox Queue & Workstation
      'inbox.todays_messages': 'இன்றைய செய்திகள்:',
      'inbox.search_placeholder': 'வாடிக்கையாளர் பெயர், எண், SKU, விசாரணை தேடு...',
      'inbox.all': 'அனைத்தும்',
      'inbox.unassigned': 'ஒதுக்கப்படாதவை',
      'inbox.my_queue': 'எனது வரிசை',
      'inbox.urgent': 'அவசரம்',
      'inbox.autoreply_paused': 'தானியங்கி பதில் இடைநிறுத்தப்பட்டுள்ளது:',
      'inbox.autoreply_paused_sub': 'தானியங்கி வாட்ஸ்அப் செய்திகள் முடக்கப்பட்டுள்ளன. கைமுறையாக பதிலளிக்கவும்.',
      'inbox.resume_autoreply': 'தானியங்கி பதிலை இயக்கு',
      'inbox.no_messages': 'இந்த உரையாடலில் இன்னும் செய்திகள் இல்லை',
      'inbox.quick_templates': 'விரைவு மாதிரிகள்:',
      'inbox.repeat_customer': 'மீண்டும் வந்த வாடிக்கையாளர்',
      'inbox.new_customer': 'புதிய வாடிக்கையாளர்',
      'inbox.reassign': 'மீண்டும் ஒதுக்கு',
      'inbox.staff_label': 'பணியாளர்',
      'inbox.customer': 'வாடிக்கையாளர்',

      // Auto-Reply Hub
      'ar.title': 'முன்செட் மாதிரிகள் & தானியங்கி பதில் மையம்',
      'ar.subtitle': 'முன்பதிவு செய்யப்பட்ட கேள்விகள் மற்றும் உடனடி தானியங்கி பதில்கள்',
      'ar.bot_label': 'தானியங்கி பாட்:',
      'ar.back_to_chats': 'அரட்டைக்குத் திரும்பு',
      'ar.search_placeholder': 'முன்செட் கேள்விகள் அல்லது முக்கிய வார்த்தைகளைத் தேடுங்கள்...',
      'ar.all_templates': 'அனைத்து மாதிரிகள்',
      'ar.active_only': 'செயலில் உள்ளவை மட்டும்',
      'ar.category_links': 'பிரிவு இருப்பு இணைப்புகள்',
      'ar.custom_answers': 'தனிப்பயன் பதில்கள்',
      'ar.add_template': '+ புதிய கேள்வி & பதிலைச் சேர்',
      'ar.active_templates': 'செயலில் உள்ள மாதிரிகள்',

      // Toasts & Notifications
      'toast.lang_changed': 'மொழி மாற்றப்பட்டது',
      'toast.lang_desc': 'CRM மொழி வெற்றிகரமாக மாற்றப்பட்டது:',
      'header.title.inbox_chats': "வாட்ஸ்அப் இன்பாக்ஸ் & வாடிக்கையாளர் வரிசை",
      'header.sub.inbox_chats': "உடனடி பணியாளர் ஒதுக்கீடு மற்றும் ஆர்டர் முன்பதிவுடன் நேரலை உரையாடல் மேலாண்மை",
      'header.title.inbox_autoreply': "வாட்ஸ்அப் இன்பாக்ஸ் — முன்செட் மாதிரிகள் & தானியங்கி பதில் மையம்",
      'header.sub.inbox_autoreply': "தானியங்கி பதில்கள், பங்கு பட்டியல் இணைப்புகள் மற்றும் முக்கிய வார்த்தைகளை உள்ளமைக்கவும்",
      'header.title.inbox_broadcast': "வாட்ஸ்அப் இன்பாக்ஸ் — தானியங்கி மாதிரி செய்தி ஒளிபரப்பு",
      'header.sub.inbox_broadcast': "தனிப்பயனாக்கப்பட்ட விளம்பர மாதிரிகள் மற்றும் அறிவிப்புகளை வாடிக்கையாளர்களுக்கு அனுப்பவும்",
      'chat.select_conversation': "அரட்டையைத் தொடங்க உரையாடலைத் தேர்ந்தெடுக்கவும்",
      'chat.staff_prefix': "பணியாளர்: ",
      'chat.customer_prefix': "வாடிக்கையாளர்: ",
      'chat.staff_label': "பணியாளர்",
      'chat.staff': "பணியாளர்:",
      'chat.recent': "சமீபத்திய",
      'chat.no_messages': "செய்திகள் எதுவும் இல்லை",
      'badge.urgent': "அவசரம்",
      'badge.high': "முக்கியம்",
      'badge.dnd': "DND",
      'badge.payment_pending': "பணம் நிலுவையில்",
      'badge.follow_up': "பின்தொடர்தல்",
      'badge.in_progress': "செயலில் உள்ளது",
      'badge.resolved': "தீர்க்கப்பட்டது",
      'badge.converted': "மாற்றப்பட்டது",
      'common.my_queue': "எனது வரிசை",
      'common.unassigned': "ஒதுக்கப்படாதவை",
      'common.reset': "மீட்டமை",
      'common.reassign': "மீண்டும் ஒதுக்கு",
      'common.assigned': "ஒதுக்கப்பட்டது",
      'common.customer': "வாடிக்கையாளர்",
      'inbox.title': "வாட்ஸ்அப் இன்பாக்ஸ் & வாடிக்கையாளர் வரிசை",
      'inbox.subtitle': "உடனடி பணியாளர் ஒதுக்கீடு மற்றும் ஆர்டர் முன்பதிவுடன் நேரலை உரையாடல் மேலாண்மை",
      'inbox.scan_qr': "+ புதிய வாட்ஸ்அப் / QR ஐ ஸ்கேன் செய்யவும்",
      'inbox.active_lines': "செயலில் உள்ள எண்கள்",
      'broadcast.title': "தானியங்கி வாட்ஸ்அப் மாதிரி செய்தி ஒளிபரப்பு",
      'broadcast.safe_badge': "இலவச & பாதுகாப்பான அனுப்புதல்",
      'broadcast.desc': "தனிப்பயனாக்கப்பட்ட விளம்பர மாதிரிகள் மற்றும் அறிவிப்புகளை வாடிக்கையாளர்களுக்கு உடனடியாக அனுப்பவும்",
      'broadcast.back_chats': "அரட்டைக்குத் திரும்பு",
      'broadcast.choose_template': "செய்தி மாதிரியைத் தேர்ந்தெடுக்கவும்:",
      'broadcast.save_new': "புதியதாகச் சேமி",
      'broadcast.msg_content': "செய்தி உள்ளடக்கம்:",
      'broadcast.quick_insert': "விரைவு செருகு:",
      'broadcast.dynamic_values': "டைனமிக் மாதிரி மதிப்புகளை அமைக்கவும்",
      'broadcast.live_sync': "நேரலை ஒத்திசைவு",
      'broadcast.add_variable': "மாறியைச் சேர்",
      'broadcast.start_broadcast': "தானியங்கி ஒளிபரப்பைத் தொடங்கு"
    },

    hi: {
      // Navigation
      'nav.inbox': 'लाइव बातचीत',
      'nav.enquiries': 'ग्राहक पूछताछ',
      'nav.dashboard': 'डैशबोर्ड',
      'nav.catalog': 'उत्पाद सूची',
      'nav.orders': 'बिक्री ऑर्डर',
      'nav.followups': 'फॉलो-अप वर्कस्टेशन',
      'nav.customers': 'ग्राहक 360',
      'nav.dnd': 'डीएनडी / ऑप्ट-आउट सूची',
      'nav.staff': 'कर्मचारी प्रबंधन',
      'nav.audit': 'ऑडिट लॉग',
      'nav.settings': 'सेटिंग्स और बैकअप',
      'nav.backup': 'डेटा बैकअप व पुनर्स्थापना',
      'nav.autoreply': 'ऑटो-रिप्लाई नियम',
      'nav.broadcast': 'ब्रॉडकास्ट इंजन',

      // Header & Global Actions
      'header.live_queue': 'लाइव कतार',
      'header.switch_phone': 'व्हाट्सएप लाइन बदलें',
      'header.masking': 'मास्किंग:',
      'header.masking_on': 'चालू',
      'header.masking_off': 'बंद',
      'header.reset_inbox': 'रीसेट इनबॉक्स',
      'header.logout': 'लॉगआउट',
      'header.search_placeholder': 'चैट, ग्राहक, लीड खोजें...',
      'header.language': 'भाषा चुनें',

      // Common Actions
      'common.save': 'सहेजें',
      'common.cancel': 'रद्द करें',
      'common.delete': 'हटाएं',
      'common.edit': 'संपादित करें',
      'common.search': 'खोजें',
      'common.export_all': 'सभी निर्यात करें',
      'common.refresh': 'ताज़ा करें',
      'common.filter': 'फ़िल्टर',
      'common.status': 'स्थिति',
      'common.priority': 'प्राथमिकता:',
      'common.action': 'कार्रवाई',
      'common.close': 'बंद करें',
      'common.view': 'देखें',
      'common.active': 'सक्रिय',
      'common.today': 'आज',
      'common.all': 'सभी',
      'common.notes': 'टिप्पणियाँ',
      'common.hide': 'छुपाएं',
      'common.optional': 'वैकल्पिक',
      'common.assign': 'आवंटित करें',
      'common.call': 'कॉल',

      // Query & Customer Status
      'status.new': 'नया लीड',
      'status.pending': 'भुगतान लंबित',
      'status.follow_up': 'फॉलो-अप',
      'status.in_progress': 'प्रगति पर',
      'status.assigned': 'सौंपा गया',
      'status.resolved': 'समाधान हो गया',
      'status.converted': 'बिक्री में परिवर्तित',
      'status.dnd': 'रुचि नहीं (DND)',
      'status.lost': 'लीड खो गई',

      // Customer 360 & Chat
      'customer.title': 'ग्राहक 360 विवरण',
      'customer.hide_profile': 'प्रोफ़ाइल छुपाएं',
      'customer.profile': 'प्रोफ़ाइल',
      'customer.handled_by': 'प्रभारी:',
      'customer.unassigned': 'आवंटित नहीं',
      'customer.call_via': 'के माध्यम से कॉल',
      'customer.masked_caller_id': 'मास्क्ड कॉलर आईडी',
      'customer.call_subtext': 'ग्राहक केवल देखता है',
      'customer.sim_hidden': 'कर्मचारी सिम छुपा हुआ',
      'customer.profile_details': 'ग्राहक प्रोफ़ाइल विवरण',
      'customer.editing_mode': 'संपादन मोड',
      'customer.saved_locked': 'सहेजा और लॉक किया गया',
      'customer.name': 'ग्राहक का नाम *:',
      'customer.full_name': 'पूरा नाम',
      'customer.phone': 'व्हाट्सएप फोन *:',
      'customer.auto_fetched': 'स्वचालित प्राप्त',
      'customer.gender': 'लिंग:',
      'customer.select': '-- चुनें --',
      'customer.female': 'महिला',
      'customer.male': 'पुरुष',
      'customer.other': 'अन्य',
      'customer.address': 'डिलीवरी का पता:',
      'customer.address_placeholder': 'मकान नंबर, सड़क, क्षेत्र, शहर, पिनकोड',
      'customer.mindset_notes': 'ग्राहक मानसिकता और नोट्स:',
      'customer.mindset_log': 'माइंडसेट लॉग',
      'customer.notes_placeholder': 'ग्राहक की पसंद, कपड़े/आकार का चयन, बजट, या विशेष निर्देश लिखें...',
      'customer.save_details': 'ग्राहक विवरण सहेजें',
      'customer.edit_details': 'ग्राहक विवरण और नोट्स संपादित करें',
      'customer.enquiry_status': 'पूछताछ की स्थिति',
      'customer.change_status': 'स्थिति बदलें:',
      'customer.editable': 'संपादन योग्य',
      'customer.callback_date': 'कॉलबैक तिथि:',
      'customer.status_notes': 'स्थिति परिवर्तन नोट्स और टिप्पणियाँ:',
      'customer.add_note_state': 'स्थिति के लिए नोट जोड़ें',
      'customer.notes_log': 'नोट्स लॉग',
      'customer.quick': 'त्वरित:',
      'customer.add_note': 'नोट जोड़ें',
      'customer.type_note': 'नया नोट लिखें...',
      'customer.pay_option': 'भुगतान लंबित विकल्प',
      'customer.total_amount': 'कुल राशि:',
      'customer.shipping': 'शिपिंग:',
      'customer.payment_mode': 'मोड:',
      'customer.advance': 'अग्रिम:',
      'customer.balance': 'शेष राशि:',
      'customer.advance_payment': 'अग्रिम भुगतान (₹):',
      'customer.due_date': 'भुगतान की देय तिथि:',
      'customer.quoted_items': 'कोट किए गए आइटम:',
      'customer.promise_notes': 'भुगतान वादा नोट्स:',
      'customer.share_payment': 'चैट पर भुगतान अनुरोध साझा करें',
      'customer.save_status_log': 'स्थिति सहेजें और इतिहास रिकॉर्ड करें',
      'customer.type_message': 'संदेश लिखें (भेजने के लिए Enter दबाएं)...',
      'customer.send': 'भेजें',
      'customer.send_catalog': 'स्टॉक और शेयर',
      'customer.order_booking': 'ऑर्डर बुक करें',

      // Header Titles
      'header.title.dashboard': 'व्हाट्सएप संचालन डैशबोर्ड',
      'header.sub.dashboard': 'पूछताछ, सक्रिय सत्र और संचार स्वास्थ्य का वास्तविक समय अवलोकन',
      'header.title.inbox': 'व्हाट्सएप इनबॉक्स और ग्राहक कतार',
      'header.sub.inbox': 'त्वरित कर्मचारी आवंटन और ऑर्डर बुकिंग के साथ बातचीत प्रबंधन',
      'header.title.followups': 'ग्राहक फॉलो-अप अनुसूचक',
      'header.sub.followups': 'पूछताछ छूटने से रोकने के लिए स्वचालित अनुस्मारक',
      'header.title.catalog': 'कपड़ा उत्पाद सूची और लाइव स्टॉक',
      'header.sub.catalog': 'लाइव स्टॉक कैलकुलेटर और व्हाट्सएप कार्ड साझाकरण',
      'header.title.orders': 'व्हाट्सएप बिक्री ऑर्डर',
      'header.sub.orders': 'व्हाट्सएप चैट से सीधे बुक किए गए ऑर्डर',
      'header.title.customers': 'ग्राहक 360 और निर्देशिका',
      'header.sub.customers': 'प्रोफाइल, खरीद इतिहास और प्राथमिकताएं',
      'header.title.dnd': 'डीएनडी और ऑप्ट-आउट ग्राहक हब',
      'header.sub.dnd': 'ऑफर संदेश प्राप्त न करने का अनुरोध करने वाले ग्राहक',
      'header.title.staff': 'कर्मचारी प्रबंधन हब',
      'header.sub.staff': 'टीम के सदस्य, भूमिकाएं और कार्यभार की निगरानी',
      'header.title.audit': 'सुरक्षा और ऑडिट लॉग',
      'header.sub.audit': 'कर्मचारी आवंटन और ऑर्डर अपडेट का रिकॉर्ड',
      'header.title.analytics': 'कर्मचारी प्रदर्शन और विश्लेषण',
      'header.sub.analytics': 'प्रतिक्रिया समय और ऑर्डर रूपांतरण के आंकड़े',
      'header.title.settings': 'व्हाट्सएप व्यापार सेटिंग्स',
      'header.sub.settings': 'लाइव संदेश रूटिंग के लिए प्राथमिक व्हाट्सएप नंबर सेट करें',
      'header.title.backup': 'डेटा बैकअप और रिकवरी',
      'header.sub.backup': 'पूर्ण डेटाबेस बैकअप और सुरक्षा',

      // Dashboard
      'dash.total_enquiries': 'आज की कुल पूछताछ',
      'dash.inbound_capture': '100% इनबाउंड कैप्चर',
      'dash.unassigned_queries': 'अनावंटित पूछताछ',
      'dash.action_required': 'व्यवस्थापक कार्रवाई आवश्यक',
      'dash.orders_booked': 'व्हाट्सएप ऑर्डर बुक किए गए',
      'dash.total_sales': 'कुल बिक्री',
      'dash.followups_scheduled': 'फॉलो-अप निर्धारित',
      'dash.automated_reminders': 'स्वचालित अनुस्मारक सक्रिय',
      'dash.active_conversations': 'सक्रिय व्हाट्सएप बातचीत',
      'dash.active_conversations_sub': 'सभी कर्मचारियों में लंबित चैट का लाइव फीड',
      'dash.open_inbox': 'इनबॉक्स खोलें →',
      'dash.staff_performance': 'कर्मचारी प्रदर्शन सारांश',
      'dash.orders_converted': 'ऑर्डर परिवर्तित',
      'dash.active_leads': 'सक्रिय लीड',
      'dash.open': 'खोलें',

      // Inbox Queue & Workstation
      'inbox.todays_messages': 'आज के संदेश:',
      'inbox.search_placeholder': 'ग्राहक, फोन, एसकेयू, पूछताछ खोजें...',
      'inbox.all': 'सभी',
      'inbox.unassigned': 'अनावंटित',
      'inbox.my_queue': 'मेरी कतार',
      'inbox.urgent': 'अति आवश्यक',
      'inbox.autoreply_paused': 'ऑटो-रिप्लाई रुका हुआ है:',
      'inbox.autoreply_paused_sub': 'स्वचालित संदेश बंद हैं। कर्मचारियों द्वारा हस्तचालित उत्तर आवश्यक है।',
      'inbox.resume_autoreply': 'ऑटो-रिप्लाई फिर चालू करें',
      'inbox.no_messages': 'इस चैट में अभी तक कोई संदेश नहीं है',
      'inbox.quick_templates': 'त्वरित टेम्पलेट:',
      'inbox.repeat_customer': 'पुनरावर्ती ग्राहक',
      'inbox.new_customer': 'नया ग्राहक',
      'inbox.reassign': 'पुनः सौंपें',
      'inbox.staff_label': 'कर्मचारी',
      'inbox.customer': 'ग्राहक',

      // Auto-Reply Hub
      'ar.title': 'प्री-सेट टेम्पलेट और ऑटो-रिप्लाई हब',
      'ar.subtitle': 'व्यवस्थापक प्री-सेट प्रश्न, स्टॉक टेम्पलेट और त्वरित स्वचालित प्रतिक्रियाएं',
      'ar.bot_label': 'ऑटो-रिप्लाई बॉट:',
      'ar.back_to_chats': 'चैट पर वापस जाएं',
      'ar.search_placeholder': 'प्रश्न या कीवर्ड खोजें...',
      'ar.all_templates': 'सभी टेम्पलेट',
      'ar.active_only': 'केवल सक्रिय ऑटो-रिप्लाई',
      'ar.category_links': 'श्रेणी स्टॉक लिंक',
      'ar.custom_answers': 'कस्टम उत्तर',
      'ar.add_template': '+ नया प्रश्न और उत्तर जोड़ें',
      'ar.active_templates': 'सक्रिय टेम्पलेट',

      // Toasts & Notifications
      'toast.lang_changed': 'भाषा बदली गई',
      'toast.lang_desc': 'सीआरएम भाषा सफलतापूर्वक बदल दी गई:',
      'header.title.inbox_chats': "व्हाट्सएप इनबॉक्स और ग्राहक कतार",
      'header.sub.inbox_chats': "त्वरित कर्मचारी आवंटन और ऑर्डर बुकिंग के साथ लाइव बातचीत प्रबंधन",
      'header.title.inbox_autoreply': "व्हाट्सएप इनबॉक्स — प्री-सेट टेम्पलेट और ऑटो-रिप्लाई हब",
      'header.sub.inbox_autoreply': "स्वचालित प्रतिक्रियाएं, स्टॉक कैटलॉग लिंक और ट्रिगर कीवर्ड कॉन्फ़िगर करें",
      'header.title.inbox_broadcast': "व्हाट्सएप इनबॉक्स — स्वचालित टेम्पलेट प्रसारण",
      'header.sub.inbox_broadcast': "वेरिएबल टैग के साथ ग्राहकों को व्यक्तिगत प्रचार संदेश और घोषणाएं भेजें",
      'chat.select_conversation': "बातचीत शुरू करने के लिए एक चैट चुनें",
      'chat.staff_prefix': "कर्मचारी: ",
      'chat.customer_prefix': "ग्राहक: ",
      'chat.staff_label': "कर्मचारी",
      'chat.staff': "कर्मचारी:",
      'chat.recent': "हाल ही में",
      'chat.no_messages': "कोई संदेश नहीं",
      'badge.urgent': "अति आवश्यक",
      'badge.high': "उच्च",
      'badge.dnd': "डीएनडी",
      'badge.payment_pending': "भुगतान लंबित",
      'badge.follow_up': "फॉलो-अप",
      'badge.in_progress': "प्रगति पर है",
      'badge.resolved': "समाधान हो गया",
      'badge.converted': "रूपांतरित",
      'common.my_queue': "मेरी कतार",
      'common.unassigned': "असाइन नहीं किया गया",
      'common.reset': "रीसेट",
      'common.reassign': "पुनः सौंपें",
      'common.assigned': "सौंपा गया",
      'common.customer': "ग्राहक",
      'inbox.title': "व्हाट्सएप इनबॉक्स और ग्राहक कतार",
      'inbox.subtitle': "त्वरित कर्मचारी आवंटन और ऑर्डर बुकिंग के साथ लाइव बातचीत प्रबंधन",
      'inbox.scan_qr': "+ नया व्हाट्सएप लाइन / क्यूआर स्कैन करें",
      'inbox.active_lines': "सक्रिय लाइनें",
      'broadcast.title': "स्वचालित व्हाट्सएप टेम्पलेट प्रसारण",
      'broadcast.safe_badge': "मुफ्त और सुरक्षित प्रेषण",
      'broadcast.desc': "त्वरित वेरिएबल निजीकरण के साथ ग्राहकों को व्यक्तिगत प्रचार संदेश भेजें",
      'broadcast.back_chats': "चैट पर वापस जाएं",
      'broadcast.choose_template': "संदेश टेम्पलेट चुनें:",
      'broadcast.save_new': "नया सहेजें",
      'broadcast.msg_content': "संदेश सामग्री:",
      'broadcast.quick_insert': "त्वरित प्रविष्टि:",
      'broadcast.dynamic_values': "डायनामिक टेम्पलेट मान सेट करें",
      'broadcast.live_sync': "लाइव सिंक",
      'broadcast.add_variable': "चर जोड़ें",
      'broadcast.start_broadcast': "स्वचालित प्रसारण शुरू करें"
    },

    te: {
      // Navigation
      'nav.inbox': 'ప్రత్యక్ష సంభాషణలు',
      'nav.enquiries': 'కస్టమర్ విచారణలు',
      'nav.dashboard': 'డాష్‌బోర్డ్',
      'nav.catalog': 'ఉత్పత్తి కేటలాగ్',
      'nav.orders': 'విక్రయ ఆర్డర్లు',
      'nav.followups': 'ఫాలో-అప్ కేంద్రం',
      'nav.customers': 'కస్టమర్ 360',
      'nav.dnd': 'డిఎన్‌డి జాబితా',
      'nav.staff': 'సిబ్బంది నిర్వహణ',
      'nav.audit': 'ఆడిట్ లాగ్‌లు',
      'nav.settings': 'సెట్టింగ్‌లు & బ్యాకప్',
      'nav.backup': 'డేటా బ్యాకప్',
      'nav.autoreply': 'ఆటో-రిప్లై నియమాలు',
      'nav.broadcast': 'బ్రాడ్‌కాస్ట్ ఇంజిన్',

      // Header & Global Actions
      'header.live_queue': 'లైవ్ క్యూ',
      'header.switch_phone': 'వాట్సాప్ నంబర్ మార్చండి',
      'header.masking': 'మాస్కింగ్:',
      'header.masking_on': 'ఆన్',
      'header.masking_off': 'ఆఫ్',
      'header.reset_inbox': 'ఇన్‌బాక్స్ రీసెట్',
      'header.logout': 'లాగ్అవుట్',
      'header.search_placeholder': 'చాట్‌లు, కస్టమర్లను శోధించండి...',
      'header.language': 'భాషను ఎంచుకోండి',

      // Common Actions
      'common.save': 'సేవ్ చేయండి',
      'common.cancel': 'రద్దు చేయండి',
      'common.delete': 'తొలగించండి',
      'common.edit': 'సవరించండి',
      'common.search': 'శోధించండి',
      'common.export_all': 'అన్నీ ఎగుమతి చేయండి',
      'common.refresh': 'రిఫ్రెష్',
      'common.filter': 'ఫిల్టర్',
      'common.status': 'స్థితి',
      'common.priority': 'ప్రాధాన్యత:',
      'common.action': 'చర్య',
      'common.close': 'మూసివేయి',
      'common.view': 'చూడండి',
      'common.active': 'యాక్టివ్',
      'common.today': 'ఈ రోజు',
      'common.all': 'అన్నీ',
      'common.notes': 'గమనికలు',
      'common.hide': 'దాచు',
      'common.optional': 'ఐచ్ఛికం',
      'common.assign': 'కేటాయించండి',
      'common.call': 'కాల్',

      // Query & Customer Status
      'status.new': 'కొత్త లీడ్',
      'status.pending': 'చెల్లింపు పెండింగ్',
      'status.follow_up': 'ఫాలో-అప్',
      'status.in_progress': 'పురోగతిలో ఉంది',
      'status.assigned': 'కేటాయించబడింది',
      'status.resolved': 'పరిష్కరించబడింది',
      'status.converted': 'విక్రయంగా మారింది',
      'status.dnd': 'ఆసక్తి లేదు (DND)',
      'status.lost': 'కోల్పోయిన లీడ్',

      // Customer 360 & Chat
      'customer.title': 'కస్టమర్ 360 వివరాలు',
      'customer.hide_profile': 'ప్రొఫైల్ దాచు',
      'customer.profile': 'ప్రొఫైల్',
      'customer.handled_by': 'నిర్వహించేది:',
      'customer.unassigned': 'కేటాయించబడలేదు',
      'customer.call_via': 'ద్వారా కాల్',
      'customer.masked_caller_id': 'మాస్క్డ్ కాలర్ ఐడి',
      'customer.call_subtext': 'కస్టమర్ మాత్రమే చూస్తారు',
      'customer.sim_hidden': 'సిబ్బంది సిమ్ దాచబడింది',
      'customer.profile_details': 'కస్టమర్ ప్రొఫైల్ వివరాలు',
      'customer.editing_mode': 'సవరణ మోడ్',
      'customer.saved_locked': 'సేవ్ చేసి లాక్ చేయబడింది',
      'customer.name': 'కస్టమర్ పేరు *:',
      'customer.full_name': 'పూర్తి పేరు',
      'customer.phone': 'వాట్సాప్ ఫోన్ *:',
      'customer.auto_fetched': 'ఆటో-పొందబడింది',
      'customer.gender': 'లింగం:',
      'customer.select': '-- ఎంచుకోండి --',
      'customer.female': 'స్త్రీ',
      'customer.male': 'పురుషుడు',
      'customer.other': 'ఇతర',
      'customer.address': 'డెలివరీ చిరునామా:',
      'customer.address_placeholder': 'డోర్ నంబర్, వీధి, నగరం, పిన్‌కోడ్',
      'customer.mindset_notes': 'కస్టమర్ మనస్తత్వం & గమనికలు:',
      'customer.mindset_log': 'మైండ్‌సెట్ లాగ్',
      'customer.notes_placeholder': 'కస్టమర్ మనస్తత్వం, ప్రాధాన్యతలు, బడ్జెట్ లేదా సూచనలు రికార్డ్ చేయండి...',
      'customer.save_details': 'కస్టమర్ వివరాలను సేవ్ చేయండి',
      'customer.edit_details': 'కస్టమర్ వివరాలు సవరించండి',
      'customer.enquiry_status': 'విచారణ స్థితి',
      'customer.change_status': 'స్థితిని మార్చండి:',
      'customer.editable': 'సవరించదగినది',
      'customer.callback_date': 'కాల్‌బ్యాక్ తేదీ:',
      'customer.status_notes': 'స్థితి మార్పు గమనికలు:',
      'customer.add_note_state': 'స్థితి కోసం గమనిక జోడించండి',
      'customer.notes_log': 'గమనికల లాగ్',
      'customer.quick': 'త్వరిత:',
      'customer.add_note': 'గమనిక జోడించండి',
      'customer.type_note': 'కొత్త గమనికను టైప్ చేయండి...',
      'customer.pay_option': 'చెల్లింపు పెండింగ్ ఎంపిక',
      'customer.total_amount': 'మొత్తం మొత్తం:',
      'customer.shipping': 'షిప్పింగ్:',
      'customer.payment_mode': 'మోడ్:',
      'customer.advance': 'అడ్వాన్స్:',
      'customer.balance': 'బ్యాలెన్స్:',
      'customer.advance_payment': 'అడ్వాన్స్ చెల్లింపు (₹):',
      'customer.due_date': 'చెల్లింపు గడువు తేదీ:',
      'customer.quoted_items': 'కోట్ చేసిన అంశాలు:',
      'customer.promise_notes': 'చెల్లింపు వాగ్దానం గమనికలు:',
      'customer.share_payment': 'చాట్‌కు చెల్లింపు అభ్యర్థనను భాగస్వామ్యం చేయండి',
      'customer.save_status_log': 'స్థితిని సేవ్ చేసి రికార్డ్ చేయండి',
      'customer.type_message': 'సందేశాన్ని టైప్ చేయండి...',
      'customer.send': 'పంపండి',
      'customer.send_catalog': 'కేటలాగ్ షేర్',
      'customer.order_booking': 'ఆర్డర్ బుకింగ్',

      // Header Titles
      'header.title.dashboard': 'వాట్సాప్ ఆపరేషన్స్ డాష్‌బోర్డ్',
      'header.sub.dashboard': 'విచారణలు మరియు సమాచార ప్రసారాల ప్రత్యక్ష సమీక్ష',
      'header.title.inbox': 'వాట్సాప్ ఇన్‌బాక్స్ & కస్టమర్ వరుసక్రమం',
      'header.sub.inbox': 'సిబ్బంది కేటాయింపు మరియు ప్రత్యక్ష సంభాషణ నిర్వహణ',
      'header.title.followups': 'కస్టమర్ ఫాలో-అప్ షెడ్యూలర్',
      'header.sub.followups': 'విచారణలు తప్పిపోకుండా ఆటోమేటిక్ రిమైండర్లు',
      'header.title.catalog': 'వస్త్ర ఉత్పత్తుల కేటలాగ్ & ప్రత్యక్ష స్టాక్',
      'header.sub.catalog': 'ప్రత్యక్ష స్టాక్ లెక్కింపు మరియు వాట్సాప్ భాగస్వామ్యం',
      'header.title.orders': 'వాట్సాప్ విక్రయ ఆర్డర్లు',
      'header.sub.orders': 'వాట్సాప్ చాట్ నుండి నేరుగా బుక్ చేసిన ఆర్డర్లు',
      'header.title.customers': 'కస్టమర్ 360 & డైరెక్టరీ',
      'header.sub.customers': 'ప్రొఫైల్స్, కొనుగోలు చరిత్ర మరియు ప్రాధాన్యతలు',
      'header.title.dnd': 'DND & నిలిపివేత కస్టమర్ హబ్',
      'header.sub.dnd': 'సందేశాలు వద్దనుకున్న కస్టమర్లు',
      'header.title.staff': 'సిబ్బంది నిర్వహణ కేంద్రం',
      'header.sub.staff': 'సిబ్బంది బాధ్యతలు మరియు పనిభారం పర్యవేక్షణ',
      'header.title.audit': 'భద్రత & ఆడిట్ లాగ్స్',
      'header.sub.audit': 'సిబ్బంది కేటాయింపులు మరియు ఆర్డర్ నవీకరణల రికార్డు',
      'header.title.analytics': 'సిబ్బంది పనితీరు విశ్లేషణ',
      'header.sub.analytics': 'ప్రతిస్పందన సమయాలు మరియు ఆర్డర్ గణాంకాలు',
      'header.title.settings': 'వాట్సాప్ వ్యాపార సెట్టింగ్‌లు',
      'header.sub.settings': 'సందేశ రూటింగ్ కోసం ప్రాథమిక వాట్సాప్ నంబర్ సెట్ చేయండి',
      'header.title.backup': 'డేటా బ్యాకప్ & పునరుద్ధరణ',
      'header.sub.backup': 'పూర్తి డేటాబేస్ బ్యాకప్ మరియు రక్షణ',

      // Dashboard
      'dash.total_enquiries': 'నేటి మొత్తం విచారణలు',
      'dash.inbound_capture': '100% ప్రత్యక్ష క్యాప్చర్',
      'dash.unassigned_queries': 'కేటాయించని విచారణలు',
      'dash.action_required': 'నిర్వాహక చర్య అవసరం',
      'dash.orders_booked': 'బుక్ చేసిన ఆర్డర్లు',
      'dash.total_sales': 'మొత్తం అమ్మకాలు',
      'dash.followups_scheduled': 'షెడ్యూల్ చేసిన ఫాలో-అప్‌లు',
      'dash.automated_reminders': 'ఆటోమేటెడ్ రిమైండర్‌లు యాక్టివ్',
      'dash.active_conversations': 'క్రియాశీల వాట్సాప్ సంభాషణలు',
      'dash.active_conversations_sub': 'సిబ్బంది నిర్వహిస్తున్న చాట్‌ల ఫీడ్',
      'dash.open_inbox': 'ఇన్‌బాక్స్ తెరవండి →',
      'dash.staff_performance': 'సిబ్బంది పనితీరు సంక్షిప్తం',
      'dash.orders_converted': 'ఆర్డర్లు మారినవి',
      'dash.active_leads': 'యాక్టివ్ లೀడ్స్',
      'dash.open': 'తెరవండి',

      // Inbox Queue & Workstation
      'inbox.todays_messages': 'నేటి సందేశాలు:',
      'inbox.search_placeholder': 'కస్టమర్, ఫోన్, SKU, విచారణ శోధించండి...',
      'inbox.all': 'అన్నీ',
      'inbox.unassigned': 'కేటాయించనివి',
      'inbox.my_queue': 'నా క్యూ',
      'inbox.urgent': 'అత్యవసరం',
      'inbox.autoreply_paused': 'ఆటో-రిప్లై నిలిపివేయబడింది:',
      'inbox.autoreply_paused_sub': 'ఆటోమేటెడ్ సందేశాలు ఆఫ్‌లో ఉన్నాయి. మాన్యువల్ సమాధానం అవసరం.',
      'inbox.resume_autoreply': 'ఆటో-రిప్లై పునఃప్రారంభించండి',
      'inbox.no_messages': 'ఈ చాట్‌లో ఇంకా సందేశాలు లేవు',
      'inbox.quick_templates': 'త్వరిత టెంప్లేట్‌లు:',
      'inbox.repeat_customer': 'పునరావృత కస్టమర్',
      'inbox.new_customer': 'కొత్త కస్టమర్',
      'inbox.reassign': 'తిరిగి కేటాయించండి',
      'inbox.staff_label': 'సిబ్బంది',
      'inbox.customer': 'కస్టమర్',

      // Auto-Reply Hub
      'ar.title': 'ప్రీ-సెట్ టెంప్లేట్‌లు & ఆటో-రిప్లై హబ్',
      'ar.subtitle': 'ముందుగా నిర్ణయించిన ప్రశ్నలు మరియు తక్షణ సమాధానాలు',
      'ar.bot_label': 'ఆటో-రిప్లై బాట్:',
      'ar.back_to_chats': 'చాట్‌లకు తిరిగి వెళ్ళండి',
      'ar.search_placeholder': 'ప్రశ్నలు లేదా కీలకపదాలను శోధించండి...',
      'ar.all_templates': 'అన్ని టెంప్లేట్‌లు',
      'ar.active_only': 'యాక్టివ్ మాత్రమే',
      'ar.category_links': 'వర్గం స్టాక్ లింకులు',
      'ar.custom_answers': 'అనుకూల సమాధానాలు',
      'ar.add_template': '+ కొత్త ప్రశ్న & సమాధానం జోడించండి',
      'ar.active_templates': 'క్రియాశీల టెంప్లేట్‌లు',

      // Toasts & Notifications
      'toast.lang_changed': 'భాష మార్చబడింది',
      'toast.lang_desc': 'CRM భాష విజయవంతంగా మార్చబడింది:',
      'header.title.inbox_chats': "వాట్సాప్ ఇన్‌బాక్స్ & కస్టమర్ క్యూ",
      'header.sub.inbox_chats': "తక్షణ సిబ్బంది కేటాయింపు మరియు ఆర్డర్ బుకింగ్‌తో ప్రత్యక్ష సంభాషణ నిర్వహణ",
      'header.title.inbox_autoreply': "వాట్సాప్ ఇన్‌బాక్స్ — ప్రీ-సెట్ టెంప్లేట్‌లు & ఆటో-రిప్లై హబ్",
      'header.sub.inbox_autoreply': "స్వయంచాలక ప్రతిస్పందనలు, స్టాక్ కేటలాగ్ లింక్‌లు మరియు ట్రిగ్గర్ కీలకపదాలను కాన్ఫిగర్ చేయండి",
      'header.title.inbox_broadcast': "వాట్సాప్ ఇన్‌బాక్స్ — ఆటోమేటెడ్ టెంప్లేట్ ప్రసారం",
      'header.sub.inbox_broadcast': "వేరియబుల్ ట్యాగ్‌లతో కస్టమర్‌లకు వ్యక్తిగతీకరించిన ప్రచార టెంప్లేట్‌లను పంపండి",
      'chat.select_conversation': "చాటింగ్ ప్రారంభించడానికి సంభాషణను ఎంచుకోండి",
      'chat.staff_prefix': "సిబ్బంది: ",
      'chat.customer_prefix': "కస్టమర్: ",
      'chat.staff_label': "సిబ్బంది",
      'chat.staff': "సిబ్బంది:",
      'chat.recent': "ఇటీవలి",
      'chat.no_messages': "ఇంకా సందేశాలు లేవు",
      'badge.urgent': "అత్యవసరం",
      'badge.high': "అధిక",
      'badge.dnd': "డిఎన్‌డి",
      'badge.payment_pending': "చెల్లింపు పెండింగ్‌లో ఉంది",
      'badge.follow_up': "ఫాలో-అప్",
      'badge.in_progress': "పురోగతిలో ఉంది",
      'badge.resolved': "పరిష్కరించబడింది",
      'badge.converted': "మార్చబడింది",
      'common.my_queue': "నా క్యూ",
      'common.unassigned': "కేటాయించబడలేదు",
      'common.reset': "రీసెట్",
      'common.reassign': "తిరిగి కేటాయించండి",
      'common.assigned': "కేటాయించబడింది",
      'common.customer': "కస్టమర్",
      'inbox.title': "వాట్సాప్ ఇన్‌బాక్స్ & కస్టమర్ క్యూ",
      'inbox.subtitle': "తక్షణ సిబ్బంది కేటాయింపు మరియు ఆర్డర్ బుకింగ్‌తో ప్రత్యక్ష సంభాషణ నిర్వహణ",
      'inbox.scan_qr': "+ కొత్త వాట్సాప్ లైన్ / QR స్కాన్ చేయండి",
      'inbox.active_lines': "క్రియాశీల లైన్లు",
      'broadcast.title': "ఆటోమేటెడ్ వాట్సాప్ టెంప్లేట్ ప్రసారం",
      'broadcast.safe_badge': "ఉచిత & సురక్షిత డిస్పాచ్",
      'broadcast.desc': "తక్షణ వేరియబుల్ వ్యక్తిగతీకరణతో కస్టమర్ చాట్‌లకు వ్యక్తిగతీకరించిన ప్రచార టెంప్లేట్‌లను పంపండి",
      'broadcast.back_chats': "చాట్‌లకు తిరిగి వెళ్ళు",
      'broadcast.choose_template': "సందేశ టెంప్లేట్‌ను ఎంచుకోండి:",
      'broadcast.save_new': "కొత్తది సేవ్ చేయండి",
      'broadcast.msg_content': "సందేశ కంటెంట్:",
      'broadcast.quick_insert': "శీఘ్ర చొప్పించు:",
      'broadcast.dynamic_values': "డైనమిక్ టెంప్లేట్ విలువలను సెట్ చేయండి",
      'broadcast.live_sync': "లైవ్ సమకాలీకరణ",
      'broadcast.add_variable': "వేరియబుల్ జోడించండి",
      'broadcast.start_broadcast': "ఆటోమేటెడ్ ప్రసారాన్ని ప్రారంభించండి"
    },

    ml: {
      // Navigation
      'nav.inbox': 'തത്സമയ സംഭാഷണങ്ങൾ',
      'nav.enquiries': 'ഉപഭോക്തൃ അന്വേഷണങ്ങൾ',
      'nav.dashboard': 'ഡാഷ്‌ബോർഡ്',
      'nav.catalog': 'ഉൽപ്പന്ന കാറ്റലോഗ്',
      'nav.orders': 'വിൽപ്പന ഓർഡറുകൾ',
      'nav.followups': 'ഫോളോ-അപ്പ് കേന്ദ്രം',
      'nav.customers': 'ഉപഭോക്താവ് 360',
      'nav.dnd': 'ഡിഎൻഡി പട്ടിക',
      'nav.staff': 'ജീവനക്കാരുടെ മാനേജ്മെന്റ്',
      'nav.audit': 'ഓഡിറ്റ് ലോഗുകൾ',
      'nav.settings': 'ക്രമീകരണങ്ങളും ബാക്കപ്പും',
      'nav.backup': 'ഡാറ്റ ബാക്കപ്പ്',
      'nav.autoreply': 'ഓട്ടോ-മറുപടി നിയമങ്ങൾ',
      'nav.broadcast': 'ബ്രോഡ്കാസ്റ്റ് എഞ്ചിൻ',

      // Header & Global Actions
      'header.live_queue': 'തത്സമയ ക്യൂ',
      'header.switch_phone': 'വാട്ട്‌സ്ആപ്പ് നമ്പർ മാറ്റുക',
      'header.masking': 'മാസ്കിംഗ്:',
      'header.masking_on': 'ഓൺ',
      'header.masking_off': 'ഓഫ്',
      'header.reset_inbox': 'റീസെറ്റ് ഇൻബോക്സ്',
      'header.logout': 'ലോഗ്ഔട്ട്',
      'header.search_placeholder': 'ചാറ്റുകൾ, ഉപഭോക്താക്കൾ തിരയുക...',
      'header.language': 'ഭാഷ തിരഞ്ഞെടുക്കുക',

      // Common Actions
      'common.save': 'സംരക്ഷിക്കുക',
      'common.cancel': 'റദ്ദാക്കുക',
      'common.delete': 'ഇല്ലാതാക്കുക',
      'common.edit': 'മാറ്റുക',
      'common.search': 'തിരയുക',
      'common.export_all': 'എല്ലാം എക്സ്പോർട്ട് ചെയ്യുക',
      'common.refresh': 'പുതുക്കുക',
      'common.filter': 'ഫിൽട്ടർ',
      'common.status': 'നില',
      'common.priority': 'മുൻഗണന:',
      'common.action': 'നടപടി',
      'common.close': 'അടയ്ക്കുക',
      'common.view': 'കാണുക',
      'common.active': 'സജീവം',
      'common.today': 'ഇന്ന്',
      'common.all': 'എല്ലാം',
      'common.notes': 'കുറിപ്പുകൾ',
      'common.hide': 'മറയ്ക്കുക',
      'common.optional': 'ഓപ്ഷണൽ',
      'common.assign': 'നിയോഗിക്കുക',
      'common.call': 'വിളിക്കുക',

      // Query & Customer Status
      'status.new': 'പുതിയ ലീഡ്',
      'status.pending': 'പേയ്‌മെന്റ് ബാക്കി',
      'status.follow_up': 'ഫോളോ-അപ്പ്',
      'status.in_progress': 'പുരോഗമിക്കുന്നു',
      'status.assigned': 'നിയോഗിച്ചു',
      'status.resolved': 'പൂർത്തിയായി',
      'status.converted': 'വിൽപ്പനയായി',
      'status.dnd': 'താൽപ്പര്യമില്ല (DND)',
      'status.lost': 'നഷ്ടപ്പെട്ട ലീഡ്',

      // Customer 360 & Chat
      'customer.title': 'ഉപഭോക്താവ് 360 വിശദാംശങ്ങൾ',
      'customer.hide_profile': 'പ്രൊഫൈൽ മറയ്ക്കുക',
      'customer.profile': 'പ്രൊഫൈൽ',
      'customer.handled_by': 'കൈകാര്യം ചെയ്യുന്നത്:',
      'customer.unassigned': 'നിയോഗിച്ചിട്ടില്ല',
      'customer.call_via': 'വഴി വിളിക്കുക',
      'customer.masked_caller_id': 'മാസ്ക് ചെയ്ത കോളർ ഐഡി',
      'customer.call_subtext': 'ഉപഭോക്താവ് കാണുന്നത് മാത്രം',
      'customer.sim_hidden': 'സ്റ്റാഫ് സിം മറച്ചിരിക്കുന്നു',
      'customer.profile_details': 'ഉപഭോക്തൃ പ്രൊഫൈൽ വിശദാംശങ്ങൾ',
      'customer.editing_mode': 'എഡിറ്റിംഗ് മോഡ്',
      'customer.saved_locked': 'സംരക്ഷിച്ച് പൂട്ടി',
      'customer.name': 'ഉപഭോക്താവിന്റെ പേര് *:',
      'customer.full_name': 'പൂർണ്ണമായ പേര്',
      'customer.phone': 'വാട്ട്‌സ്ആപ്പ് ഫോൺ *:',
      'customer.auto_fetched': 'സ്വയമേവ ലഭിച്ചത്',
      'customer.gender': 'ലിംഗഭേദം:',
      'customer.select': '-- തിരഞ്ഞെടുക്കുക --',
      'customer.female': 'സ്ത്രീ',
      'customer.male': 'പുരുഷൻ',
      'customer.other': 'മറ്റുള്ളവ',
      'customer.address': 'ഡെലിവറി വിലാസം:',
      'customer.address_placeholder': 'വീട്ടുനമ്പർ, തെരുവ്, നഗരം, പിൻകോഡ്',
      'customer.mindset_notes': 'ഉപഭോക്തൃ ചിന്താഗതിയും കുറിപ്പുകളും:',
      'customer.mindset_log': 'മൈൻഡ്‌സെറ്റ് ലോഗ്',
      'customer.notes_placeholder': 'ഉപഭോക്താവിന്റെ മുൻഗണനകൾ, ബജറ്റ് അല്ലെങ്കിൽ പ്രത്യേക നിർദ്ദേശങ്ങൾ...',
      'customer.save_details': 'ഉപഭോക്തൃ വിവരങ്ങൾ സംരക്ഷിക്കുക',
      'customer.edit_details': 'വിവരങ്ങളും കുറിപ്പുകളും എഡിറ്റ് ചെയ്യുക',
      'customer.enquiry_status': 'അന്വേഷണ നില',
      'customer.change_status': 'നില മാറ്റുക:',
      'customer.editable': 'എഡിറ്റ് ചെയ്യാവുന്നത്',
      'customer.callback_date': 'കോൾബാക്ക് തീയതി:',
      'customer.status_notes': 'നില മാറ്റ കുറിപ്പുകൾ:',
      'customer.add_note_state': 'കുറിപ്പ് ചേർക്കുക',
      'customer.notes_log': 'കുറിപ്പുകളുടെ ലോഗ്',
      'customer.quick': 'ദ്രുതം:',
      'customer.add_note': 'കുറിപ്പ് ചേർക്കുക',
      'customer.type_note': 'പുതിയ കുറിപ്പ് എഴുതുക...',
      'customer.pay_option': 'പേയ്‌മെന്റ് പെൻഡിംഗ് ഓപ്ഷൻ',
      'customer.total_amount': 'ആകെ തുക:',
      'customer.shipping': 'ഷിപ്പിംഗ്:',
      'customer.payment_mode': 'രീതി:',
      'customer.advance': 'മുൻകൂർ:',
      'customer.balance': 'ബാക്കി:',
      'customer.advance_payment': 'മുൻകൂർ പേയ്‌മെന്റ് (₹):',
      'customer.due_date': 'അടയ്‌ക്കേണ്ട തീയതി:',
      'customer.quoted_items': 'ഇനങ്ങൾ:',
      'customer.promise_notes': 'പേയ്‌മെന്റ് വാഗ്ദാന കുറിപ്പുകൾ:',
      'customer.share_payment': 'പേയ്‌മെന്റ് അഭ്യർത്ഥന ചാറ്റിൽ പങ്കിടുക',
      'customer.save_status_log': 'നില സംരക്ഷിച്ച് രേഖപ്പെടുത്തുക',
      'customer.type_message': 'സന്ദേശം എഴുതുക...',
      'customer.send': 'അയക്കുക',
      'customer.send_catalog': 'കാറ്റലോഗ് അയക്കുക',
      'customer.order_booking': 'ഓർഡർ ബുക്കിംഗ്',

      // Header Titles
      'header.title.dashboard': 'വാട്ട്‌സ്ആപ്പ് പ്രവർത്തന ഡാഷ്‌ബോർഡ്',
      'header.sub.dashboard': 'അന്വേഷണങ്ങളുടെയും സംഭാഷണങ്ങളുടെയും തത്സമയ അവലോകനം',
      'header.title.inbox': 'വാട്ട്‌സ്ആപ്പ് ഇൻബോക്സും ഉപഭോക്തൃ നിരയും',
      'header.sub.inbox': 'തത്സമയ സംഭാഷണങ്ങളും ഓർഡർ ബുക്കിംഗും',
      'header.title.followups': 'ഫോളോ-അപ്പ് ഷെഡ്യൂളർ',
      'header.sub.followups': 'അന്വേഷണങ്ങൾ നഷ്ടപ്പെടാതിരിക്കാൻ ഓർമ്മപ്പെടുത്തലുകൾ',
      'header.title.catalog': 'ഉൽപ്പന്ന കാറ്റലോഗും തത്സമയ സ്റ്റോക്കും',
      'header.sub.catalog': 'സ്റ്റോക്ക് കണക്കുകൂട്ടലും വാട്ട്‌സ്ആപ്പ് ഷെയറിംഗും',
      'header.title.orders': 'വാട്ട്‌സ്ആപ്പ് വിൽപ്പന ഓർഡറുകൾ',
      'header.sub.orders': 'വാട്ട്‌സ്ആപ്പ് ചാറ്റുകളിൽ നിന്നുള്ള നേരിട്ടുള്ള ഓർഡറുകൾ',
      'header.title.customers': 'ഉപഭോക്താവ് 360 & ഡയറക്ടറി',
      'header.sub.customers': 'പ്രൊഫൈലുകൾ, വാങ്ങൽ ചരിത്രം, മുൻഗണനകൾ',
      'header.title.dnd': 'ഡിഎൻഡി ഉപഭോക്തൃ കേന്ദ്രം',
      'header.sub.dnd': 'സന്ദേശങ്ങൾ ഒഴിവാക്കാൻ അഭ്യർത്ഥിച്ച ഉപഭോക്താക്കൾ',
      'header.title.staff': 'ജീവനക്കാരുടെ മാനേജ്മെന്റ്',
      'header.sub.staff': 'ടീം അംഗങ്ങളുടെ ചുമതലകളും നിരീക്ഷണവും',
      'header.title.audit': 'സുരക്ഷാ & ഓഡിറ്റ് ലോഗുകൾ',
      'header.sub.audit': 'ഓർഡർ അപ്‌ഡേറ്റുകളുടെ സുരക്ഷിത രേഖ',
      'header.title.analytics': 'പ്രകടന വിശകലനം & റിപ്പോർട്ടുകൾ',
      'header.sub.analytics': 'പ്രതികരണ സമയവും ഓർഡർ പരിവർത്തന നിരക്കും',
      'header.title.settings': 'വാട്ട്‌സ്ആപ്പ് ബിസിനസ്സ് ക്രമീകരണങ്ങൾ',
      'header.sub.settings': 'പ്രാഥമിക വാട്ട്‌സ്ആപ്പ് നമ്പർ സജ്ജീകരിക്കുക',
      'header.title.backup': 'ഡാറ്റ ബാക്കപ്പും വീണ്ടെടുക്കലും',
      'header.sub.backup': 'പൂർണ്ണ ഡാറ്റാബേസ് ബാക്കപ്പും സംരക്ഷണവും',

      // Dashboard
      'dash.total_enquiries': 'ഇന്നത്തെ ആകെ അന്വേഷണങ്ങൾ',
      'dash.inbound_capture': '100% തത്സമയ ക്യാപ്ചർ',
      'dash.unassigned_queries': 'ചുമതലപ്പെടുത്താത്ത അന്വേഷണങ്ങൾ',
      'dash.action_required': 'അഡ്മിൻ നടപടി ആവശ്യമാണ്',
      'dash.orders_booked': 'ബുക്ക് ചെയ്ത ഓർഡറുകൾ',
      'dash.total_sales': 'ആകെ വിൽപ്പന',
      'dash.followups_scheduled': 'ഷെഡ്യൂൾ ചെയ്ത ഫോളോ-അപ്പുകൾ',
      'dash.automated_reminders': 'ഓട്ടോമേറ്റഡ് ഓർമ്മപ്പെടുത്തലുകൾ സജീവം',
      'dash.active_conversations': 'സജീവ വാട്ട്‌സ്ആപ്പ് സംഭാഷണങ്ങൾ',
      'dash.active_conversations_sub': 'ജീവനക്കാർ കൈകാര്യം ചെയ്യുന്ന ചാറ്റുകൾ',
      'dash.open_inbox': 'ഇൻബോക്സ് തുറക്കുക →',
      'dash.staff_performance': 'ജീവനക്കാരുടെ പ്രകടന സംഗ്രഹം',
      'dash.orders_converted': 'മാറിയ ഓർഡറുകൾ',
      'dash.active_leads': 'സജീവ ലീഡുകൾ',
      'dash.open': 'തുറക്കുക',

      // Inbox Queue & Workstation
      'inbox.todays_messages': 'ഇന്നത്തെ സന്ദേശങ്ങൾ:',
      'inbox.search_placeholder': 'ഉപഭോക്താവ്, ഫോൺ, SKU, അന്വേഷണം തിരയുക...',
      'inbox.all': 'എല്ലാം',
      'inbox.unassigned': 'ചുമതലപ്പെടുത്താത്തവ',
      'inbox.my_queue': 'എന്റെ നിര',
      'inbox.urgent': 'അടിയന്തിരം',
      'inbox.autoreply_paused': 'ഓട്ടോ-റിപ്ലൈ താൽക്കാലികമായി നിർത്തി:',
      'inbox.autoreply_paused_sub': 'ഓട്ടോമേറ്റഡ് സന്ദേശങ്ങൾ ഓഫാണ്. നേരിട്ടുള്ള മറുപടി ആവശ്യമാണ്.',
      'inbox.resume_autoreply': 'ഓട്ടോ-റിപ്ലൈ പുനരാരംഭിക്കുക',
      'inbox.no_messages': 'ഈ ചാറ്റിൽ ഇതുവരെ സന്ദേശങ്ങളൊന്നുമില്ല',
      'inbox.quick_templates': 'ദ്രുത ടെംപ്ലേറ്റുകൾ:',
      'inbox.repeat_customer': 'ആവർത്തിച്ചുള്ള ഉപഭോക്താവ്',
      'inbox.new_customer': 'പുതിയ ഉപഭോക്താവ്',
      'inbox.reassign': 'വീണ്ടും ചുമതലപ്പെടുത്തുക',
      'inbox.staff_label': 'ജീവനക്കാരൻ',
      'inbox.customer': 'ഉപഭോക്താവ്',

      // Auto-Reply Hub
      'ar.title': 'പ്രീ-സെറ്റ് ടെംപ്ലേറ്റുകളും ഓട്ടോ-റിപ്ലൈ ഹബ്ബും',
      'ar.subtitle': 'മുൻകൂട്ടി നിശ്ചയിച്ച ചോദ്യങ്ങളും തത്സമയ മറുപടികളും',
      'ar.bot_label': 'ഓട്ടോ-റിപ്ലൈ ബോട്ട്:',
      'ar.back_to_chats': 'ചാറ്റുകളിലേക്ക് മടങ്ങുക',
      'ar.search_placeholder': 'ചോദ്യങ്ങൾ തിരയുക...',
      'ar.all_templates': 'എല്ലാ ടെംപ്ലേറ്റുകളും',
      'ar.active_only': 'സജീവമായവ മാത്രം',
      'ar.category_links': 'വിഭാഗം സ്റ്റോക്ക് ലിങ്കുകൾ',
      'ar.custom_answers': 'ഇഷ്‌ടാനുസൃത ഉത്തരങ്ങൾ',
      'ar.add_template': '+ പുതിയ ചോദ്യവും ഉത്തരവും ചേർക്കുക',
      'ar.active_templates': 'സജീവ ടെംപ്ലേറ്റുകൾ',

      // Toasts & Notifications
      'toast.lang_changed': 'ഭാഷ മാറ്റി',
      'toast.lang_desc': 'CRM ഭാഷ വിജയകരമായി മാറ്റി:',
      'header.title.inbox_chats': "വാട്ട്‌സ്ആപ്പ് ഇൻബോക്‌സും ഉപഭോക്തൃ നിരയും",
      'header.sub.inbox_chats': "തൽക്ഷണ സ്റ്റാഫ് അസൈൻമെന്റും ഓർഡർ ബുക്കിംഗും ഉള്ള തത്സമയ സംഭാഷണ മാനേജ്മെന്റ്",
      'header.title.inbox_autoreply': "വാട്ട്‌സ്ആപ്പ് ഇൻബോക്‌സ് — പ്രീ-സെറ്റ് ടെംപ്ലേറ്റുകളും ഓട്ടോ-റിപ്ലൈ ഹബ്ബും",
      'header.sub.inbox_autoreply': "ഓട്ടോമേറ്റഡ് പ്രതികരണങ്ങൾ, സ്റ്റോക്ക് കാറ്റലോഗ് ലിങ്കുകൾ, ട്രിഗർ കീവേഡുകൾ എന്നിവ കോൺഫിഗർ ചെയ്യുക",
      'header.title.inbox_broadcast': "വാട്ട്‌സ്ആപ്പ് ഇൻബോക്‌സ് — ഓട്ടോമേറ്റഡ് ടെംപ്ലേറ്റ് ബ്രോഡ്‌കാസ്റ്റ്",
      'header.sub.inbox_broadcast': "വേരിയബിൾ ടാഗുകൾ ഉപയോഗിച്ച് ഉപഭോക്താക്കൾക്ക് വ്യക്തിഗതമാക്കിയ പ്രമോഷണൽ ടെംപ്ലേറ്റുകൾ അയയ്ക്കുക",
      'chat.select_conversation': "ചാറ്റിംഗ് ആരംഭിക്കാൻ ഒരു സംഭാഷണം തിരഞ്ഞെടുക്കുക",
      'chat.staff_prefix': "സ്റ്റാഫ്: ",
      'chat.customer_prefix': "ഉപഭോക്താവ്: ",
      'chat.staff_label': "സ്റ്റാഫ്",
      'chat.staff': "സ്റ്റാഫ്:",
      'chat.recent': "സമീപകാല",
      'chat.no_messages': "സന്ദേശങ്ങളൊന്നുമില്ല",
      'badge.urgent': "അടിയന്തിരം",
      'badge.high': "ഉയർന്ന",
      'badge.dnd': "ഡിഎൻഡി",
      'badge.payment_pending': "പേയ്‌മെന്റ് ബാക്കി",
      'badge.follow_up': "ഫോളോ-അപ്പ്",
      'badge.in_progress': "പുരോഗമിക്കുന്നു",
      'badge.resolved': "പരിഹരിച്ചു",
      'badge.converted': "പരിവർത്തനം ചെയ്തു",
      'common.my_queue': "എന്റെ ക്യൂ",
      'common.unassigned': "അസൈൻ ചെയ്തിട്ടില്ല",
      'common.reset': "റീസെറ്റ്",
      'common.reassign': "വീണ്ടും അസൈൻ ചെയ്യുക",
      'common.assigned': "അസൈൻ ചെയ്തു",
      'common.customer': "ഉപഭോക്താവ്",
      'inbox.title': "വാട്ട്‌സ്ആപ്പ് ഇൻബോക്‌സും ഉപഭോക്തൃ നിരയും",
      'inbox.subtitle': "തൽക്ഷണ സ്റ്റാഫ് അസൈൻമെന്റും ഓർഡർ ബുക്കിംഗും ഉള്ള തത്സമയ സംഭാഷണ മാനേജ്മെന്റ്",
      'inbox.scan_qr': "+ പുതിയ വാട്ട്‌സ്ആപ്പ് ലൈൻ / ക്യുആർ സ്കാൻ ചെയ്യുക",
      'inbox.active_lines': "ആക്ടീവ് ലൈനുകൾ",
      'broadcast.title': "ഓട്ടോമേറ്റഡ് വാട്ട്‌സ്ആപ്പ് ടെംപ്ലേറ്റ് ബ്രോഡ്‌കാസ്റ്റ്",
      'broadcast.safe_badge': "സൗജന്യവും സുരക്ഷിതവുമായ അയയ്ക്കൽ",
      'broadcast.desc': "തൽക്ഷണ വേരിയബിൾ വ്യക്തിഗതമാക്കൽ ഉപയോഗിച്ച് ഉപഭോക്താക്കൾക്ക് പ്രമോഷണൽ ടെംപ്ലേറ്റുകൾ അയയ്ക്കുക",
      'broadcast.back_chats': "ചാറ്റുകളിലേക്ക് മടങ്ങുക",
      'broadcast.choose_template': "സന്ദേശ ടെംപ്ലേറ്റ് തിരഞ്ഞെടുക്കുക:",
      'broadcast.save_new': "പുതിയത് സംരക്ഷിക്കുക",
      'broadcast.msg_content': "സന്ദേശ ഉള്ളടക്കം:",
      'broadcast.quick_insert': "പെട്ടെന്ന് ചേർക്കുക:",
      'broadcast.dynamic_values': "ഡൈനാമിക് ടെംപ്ലേറ്റ് മൂല്യങ്ങൾ സജ്ജമാക്കുക",
      'broadcast.live_sync': "തത്സമയ സിങ്ക്",
      'broadcast.add_variable': "വേരിയബിൾ ചേർക്കുക",
      'broadcast.start_broadcast': "ഓട്ടോമേറ്റഡ് ബ്രോഡ്‌കാസ്റ്റ് ആരംഭിക്കുക"
    },

    kn: {
      // Navigation
      'nav.inbox': 'ಲೈವ್ ಸಂಭಾಷಣೆಗಳು',
      'nav.enquiries': 'ಗ್ರಾಹಕರ ವಿಚಾರಣೆಗಳು',
      'nav.dashboard': 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
      'nav.catalog': 'ಉತ್ಪನ್ನಗಳ ಪಟ್ಟಿ',
      'nav.orders': 'ಮಾರಾಟ ಆದೇಶಗಳು',
      'nav.followups': 'ಫಾಲೋ-ಅಪ್ ಕೇಂದ್ರ',
      'nav.customers': 'ಗ್ರಾಹಕ 360',
      'nav.dnd': 'ಡಿಎನ್‌ಡಿ ಪಟ್ಟಿ',
      'nav.staff': 'ಸಿಬ್ಬಂದಿ ನಿರ್ವಹಣೆ',
      'nav.audit': 'ಆಡಿಟ್ ಲಾಗ್‌ಗಳು',
      'nav.settings': 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು ಮತ್ತು ಬ್ಯಾಕಪ್',
      'nav.backup': 'ಡೇಟಾ ಬ್ಯಾಕಪ್',
      'nav.autoreply': 'ಸ್ವಯಂಚಾಲಿತ ಪ್ರತ್ಯುತ್ತರ',
      'nav.broadcast': 'ಪ್ರಸಾರ ಎಂಜಿನ್',

      // Header & Global Actions
      'header.live_queue': 'ಲೈವ್ ಸರತಿ',
      'header.switch_phone': 'ವಾಟ್ಸಾಪ್ ಸಂಖ್ಯೆ ಬದಲಾಯಿಸಿ',
      'header.masking': 'ಮಾಸ್ಕಿಂಗ್:',
      'header.masking_on': 'ಆನ್',
      'header.masking_off': 'ಆಫ್',
      'header.reset_inbox': 'ಇನ್‌ಬಾಕ್ಸ್ ಮರುಹೊಂದಿಸಿ',
      'header.logout': 'ಲಾಗ್‌ಔಟ್',
      'header.search_placeholder': 'ಚಾಟ್‌ಗಳು, ಗ್ರಾಹಕರನ್ನು ಹುಡುಕಿ...',
      'header.language': 'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',

      // Common Actions
      'common.save': 'ಉಳಿಸಿ',
      'common.cancel': 'ರದ್ದುಮಾಡಿ',
      'common.delete': 'ಅಳಿಸಿ',
      'common.edit': 'ಸಂಪಾದಿಸಿ',
      'common.search': 'ಹುಡುಕಿ',
      'common.export_all': 'ಎಲ್ಲವನ್ನೂ ರಫ್ತು ಮಾಡಿ',
      'common.refresh': 'ರಿಫ್ರೆಶ್',
      'common.filter': 'ಫಿಲ್ಟರ್',
      'common.status': 'ಸ್ಥಿತಿ',
      'common.priority': 'ಆದ್ಯತೆ:',
      'common.action': 'ಕ್ರಮ',
      'common.close': 'ಮುಚ್ಚಿ',
      'common.view': 'ವೀಕ್ಷಿಸಿ',
      'common.active': 'ಸಕ್ರಿಯ',
      'common.today': 'ಇಂದು',
      'common.all': 'ಎಲ್ಲವೂ',
      'common.notes': 'ಟಿಪ್ಪಣಿಗಳು',
      'common.hide': 'ಮರೆಮಾಡಿ',
      'common.optional': 'ಐಚ್ಛಿಕ',
      'common.assign': 'ನಿಯೋಜಿಸಿ',
      'common.call': 'ಕರೆ',

      // Query & Customer Status
      'status.new': 'ಹೊಸ ಲೀಡ್',
      'status.pending': 'ಪಾವತಿ ಬಾಕಿ',
      'status.follow_up': 'ಫಾಲೋ-ಅಪ್',
      'status.in_progress': 'ಪ್ರಗತಿಯಲ್ಲಿದೆ',
      'status.assigned': 'ನಿಯೋಜಿಸಲಾಗಿದೆ',
      'status.resolved': 'ಪರಿಹರಿಸಲಾಗಿದೆ',
      'status.converted': 'ಮಾರಾಟವಾಗಿದೆ',
      'status.dnd': 'ಆಸಕ್ತಿಯಿಲ್ಲ (DND)',
      'status.lost': 'ಕಳೆದುಹೋದ ಲೀಡ್',

      // Customer 360 & Chat
      'customer.title': 'ಗ್ರಾಹಕ 360 ವಿವರಗಳು',
      'customer.hide_profile': 'ಪ್ರೊಫೈಲ್ ಮರೆಮಾಡಿ',
      'customer.profile': 'ಪ್ರೊಫೈಲ್',
      'customer.handled_by': 'ನಿರ್ವಹಿಸುತ್ತಿರುವವರು:',
      'customer.unassigned': 'ನಿಯೋಜಿಸಲಾಗಿಲ್ಲ',
      'customer.call_via': 'ಮೂಲಕ ಕರೆ ಮಾಡಿ',
      'customer.masked_caller_id': 'ಮಾಸ್ಕ್ ಮಾಡಿದ ಕಾಲರ್ ಐಡಿ',
      'customer.call_subtext': 'ಗ್ರಾಹಕರು ಮಾತ್ರ ನೋಡುತ್ತಾರೆ',
      'customer.sim_hidden': 'ಸಿಬ್ಬಂದಿ ಸಿಮ್ ಮರೆಮಾಡಲಾಗಿದೆ',
      'customer.profile_details': 'ಗ್ರಾಹಕರ ವಿವರಗಳು',
      'customer.editing_mode': 'ತಿದ್ದುಪಡಿ ಮೋಡ್',
      'customer.saved_locked': 'ಉಳಿಸಲಾಗಿದೆ ಮತ್ತು ಲಾಕ್ ಮಾಡಲಾಗಿದೆ',
      'customer.name': 'ಗ್ರಾಹಕರ ಹೆಸರು *:',
      'customer.full_name': 'ಪೂರ್ಣ ಹೆಸರು',
      'customer.phone': 'ವಾಟ್ಸಾಪ್ ಫೋನ್ *:',
      'customer.auto_fetched': 'ಸ್ವಯಂ ಪಡೆದಿದೆ',
      'customer.gender': 'ಲಿಂಗ:',
      'customer.select': '-- ಆಯ್ಕೆಮಾಡಿ --',
      'customer.female': 'ಮಹಿಳೆ',
      'customer.male': 'ಪುರುಷ',
      'customer.other': 'ಇತರೆ',
      'customer.address': 'ವಿತರಣಾ ವಿಳಾಸ:',
      'customer.address_placeholder': 'ಮನೆ ಸಂಖ್ಯೆ, ರಸ್ತೆ, ನಗರ, ಪಿನ್‌ಕೋಡ್',
      'customer.mindset_notes': 'ಗ್ರಾಹಕರ ಮನಸ್ಥಿತಿ ಮತ್ತು ಟಿಪ್ಪಣಿಗಳು:',
      'customer.mindset_log': 'ಮನಸ್ಥಿತಿ ದಾಖಲೆ',
      'customer.notes_placeholder': 'ಗ್ರಾಹಕರ ಮನಸ್ಥಿತಿ, ಆದ್ಯತೆಗಳು, ಬಜೆಟ್ ಅಥವಾ ಸೂಚನೆಗಳು...',
      'customer.save_details': 'ಗ್ರಾಹಕರ ವಿವರಗಳನ್ನು ಉಳಿಸಿ',
      'customer.edit_details': 'ಗ್ರಾಹಕರ ವಿವರಗಳನ್ನು ಸಂಪಾದಿಸಿ',
      'customer.enquiry_status': 'ವಿಚಾರಣೆಯ ಸ್ಥಿತಿ',
      'customer.change_status': 'ಸ್ಥಿತಿಯನ್ನು ಬದಲಾಯಿಸಿ:',
      'customer.editable': 'ಸಂಪಾದಿಸಬಹುದಾದ',
      'customer.callback_date': 'ಕಾಲ್‌ಬ್ಯಾಕ್ ದಿನಾಂಕ:',
      'customer.status_notes': 'ಸ್ಥಿತಿ ಬದಲಾವಣೆ ಟಿಪ್ಪಣಿಗಳು:',
      'customer.add_note_state': 'ಟಿಪ್ಪಣಿ ಸೇರಿಸಿ',
      'customer.notes_log': 'ಟಿಪ್ಪಣಿಗಳ ದಾಖಲೆ',
      'customer.quick': 'ತ್ವರಿತ:',
      'customer.add_note': 'ಟಿಪ್ಪಣಿ ಸೇರಿಸಿ',
      'customer.type_note': 'ಹೊಸ ಟಿಪ್ಪಣಿಯನ್ನು ಟೈಪ್ ಮಾಡಿ...',
      'customer.pay_option': 'ಪಾವತಿ ಬಾಕಿ ಆಯ್ಕೆ',
      'customer.total_amount': 'ಒಟ್ಟು ಮೊತ್ತ:',
      'customer.shipping': 'ಶಿಪ್ಪಿಂಗ್:',
      'customer.payment_mode': 'ವಿಧಾನ:',
      'customer.advance': 'ಮುಂಗಡ:',
      'customer.balance': 'ಬಾಕಿ:',
      'customer.advance_payment': 'ಮುಂಗಡ ಪಾವತಿ (₹):',
      'customer.due_date': 'ಪಾವತಿಸಬೇಕಾದ ದಿನಾಂಕ:',
      'customer.quoted_items': 'ಉತ್ಪನ್ನಗಳು:',
      'customer.promise_notes': 'ಪಾವತಿ ಭರವಸೆಯ ಟಿಪ್ಪಣಿಗಳು:',
      'customer.share_payment': 'ಚಾಟ್‌ಗೆ ಪಾವತಿ ವಿನಂತಿಯನ್ನು ಹಂಚಿಕೊಳ್ಳಿ',
      'customer.save_status_log': 'ಸ್ಥಿತಿಯನ್ನು ಉಳಿಸಿ ಮತ್ತು ಇತಿಹಾಸ ದಾಖಲಿಸಿ',
      'customer.type_message': 'ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ...',
      'customer.send': 'ಕಳುಹಿಸಿ',
      'customer.send_catalog': 'ಕ್ಯಾಟಲಾಗ್ ಹಂಚಿಕೊಳ್ಳಿ',
      'customer.order_booking': 'ಆದೇಶ ಬುಕಿಂಗ್',

      // Header Titles
      'header.title.dashboard': 'ವಾಟ್ಸಾಪ್ ಕಾರ್ಯಾಚರಣೆಗಳ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
      'header.sub.dashboard': 'ವಿಚಾರಣೆಗಳು ಮತ್ತು ಸಂವಹನ ಸ್ಥಿತಿಯ ನೈಜ ಸಮಯದ ಅವಲೋಕನ',
      'header.title.inbox': 'ವಾಟ್ಸಾಪ್ ಇನ್‌ಬಾಕ್ಸ್ ಮತ್ತು ಗ್ರಾಹಕರ ಕ್ಯೂ',
      'header.sub.inbox': 'ತ್ವರಿತ ಸಿಬ್ಬಂದಿ ನಿಯೋಜನೆ ಮತ್ತು ಆರ್ಡರ್ ಬುಕಿಂಗ್',
      'header.title.followups': 'ಗ್ರಾಹಕರ ಫಾಲೋ-ಅಪ್ ಶೆಡ್ಯೂಲರ್',
      'header.sub.followups': 'ವಿಚಾರಣೆಗಳು ಕಳೆದುಹೋಗದಂತೆ ಸ್ವಯಂಚಾಲಿತ ಜ್ಞಾಪನೆಗಳು',
      'header.title.catalog': 'ಉಡುಪು ಉತ್ಪನ್ನಗಳ ಕ್ಯಾಟಲಾಗ್ & ನೇರ ಸ್ಟಾಕ್',
      'header.sub.catalog': 'ಲೈವ್ ಲಭ್ಯವಿರುವ ಸ್ಟಾಕ್ ಕ್ಯಾಲ್ಕುಲೇಟರ್ ಮತ್ತು ವಾಟ್ಸಾಪ್ ಹಂಚಿಕೆ',
      'header.title.orders': 'ವಾಟ್ಸಾಪ್ ಮಾರಾಟದ ಆದೇಶಗಳು',
      'header.sub.orders': 'ವಾಟ್ಸಾಪ್ ಚಾಟ್‌ನಿಂದ ನೇರವಾಗಿ ಬುಕ್ ಮಾಡಿದ ಆದೇಶಗಳು',
      'header.title.customers': 'ಗ್ರಾಹಕ 360 & ಡೈರೆಕ್ಟರಿ',
      'header.sub.customers': 'ಪ್ರೊಫೈಲ್‌ಗಳು, ಖರೀದಿ ಇತಿಹಾಸ ಮತ್ತು ಆದ್ಯತೆಗಳು',
      'header.title.dnd': 'ಡಿಎನ್‌ಡಿ ಮತ್ತು ಆಪ್ಟ್-ಔಟ್ ಗ್ರಾಹಕ ಹಬ್',
      'header.sub.dnd': 'ಕೊಡುಗೆ ಸಂದೇಶಗಳನ್ನು ನಿರಾಕರಿಸಿದ ಗ್ರಾಹಕರು',
      'header.title.staff': 'ಸಿಬ್ಬಂದಿ ನಿರ್ವಹಣಾ ಹಬ್',
      'header.sub.staff': 'ತಂಡದ ಸದಸ್ಯರ ಕಾರ್ಯಭಾರ ಮತ್ತು ಜವಾಬ್ದಾರಿಗಳ ಮೇಲ್ವಿಚಾರಣೆ',
      'header.title.audit': 'ಭದ್ರತೆ & ಆಡಿಟ್ ಲಾಗ್‌ಗಳು',
      'header.sub.audit': 'ಸಿಬ್ಬಂದಿ ನಿಯೋಜನೆ ಮತ್ತು ಆರ್ಡರ್ ನವೀಕರಣಗಳ ದಾಖಲೆ',
      'header.title.analytics': 'ಸಿಬ್ಬಂದಿ ಕಾರ್ಯಕ್ಷಮತೆ ಮತ್ತು ವಿಶ್ಲೇಷಣೆ',
      'header.sub.analytics': 'ಪ್ರತಿಕ್ರಿಯೆ ಸಮಯ ಮತ್ತು ಆರ್ಡರ್ ಪರಿವರ್ತನೆ ದರಗಳು',
      'header.title.settings': 'ವಾಟ್ಸಾಪ್ ವ್ಯಾಪಾರ ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
      'header.sub.settings': 'ಲೈವ್ ಸಂದೇಶ ರೂಟಿಂಗ್‌ಗಾಗಿ ಪ್ರಾಥಮಿಕ ವಾಟ್ಸಾಪ್ ಸಂಖ್ಯೆ ಹೊಂದಿಸಿ',
      'header.title.backup': 'ಡೇಟಾ ಬ್ಯಾಕಪ್ & ಮರುಪಡೆಯುವಿಕೆ',
      'header.sub.backup': 'ಸಂಪೂರ್ಣ ಡೇಟಾಬೇಸ್ ಬ್ಯಾಕಪ್ ಮತ್ತು ರಕ್ಷಣೆ',

      // Dashboard
      'dash.total_enquiries': 'ಇಂದಿನ ಒಟ್ಟು ವಿಚಾರಣೆಗಳು',
      'dash.inbound_capture': '100% ಲೈವ್ ಕ್ಯಾಪ್ಚರ್',
      'dash.unassigned_queries': 'ನಿಯೋಜಿಸದ ವಿಚಾರಣೆಗಳು',
      'dash.action_required': 'ನಿರ್ವಾಹಕರ ಕ್ರಮ ಅಗತ್ಯವಿದೆ',
      'dash.orders_booked': 'ವಾಟ್ಸಾಪ್ ಆರ್ಡರ್‌ಗಳು ಬುಕ್ ಆಗಿವೆ',
      'dash.total_sales': 'ಒಟ್ಟು ಮಾರಾಟ',
      'dash.followups_scheduled': 'ನಿಗದಿತ ಫಾಲೋ-ಅಪ್‌ಗಳು',
      'dash.automated_reminders': 'ಸ್ವಯಂಚಾಲಿತ ಜ್ಞಾಪನೆಗಳು ಸಕ್ರಿಯ',
      'dash.active_conversations': 'ಸಕ್ರಿಯ ವಾಟ್ಸಾಪ್ ಸಂಭಾಷಣೆಗಳು',
      'dash.active_conversations_sub': 'ಸಿಬ್ಬಂದಿ ನಿರ್ವಹಿಸುತ್ತಿರುವ ಚಾಟ್‌ಗಳ ಫೀಡ್',
      'dash.open_inbox': 'ಇನ್‌ಬಾಕ್ಸ್ ತೆರೆಯಿರಿ →',
      'dash.staff_performance': 'ಸಿಬ್ಬಂದಿ ಕಾರ್ಯಕ್ಷಮತೆಯ ಸ್ನ್ಯಾಪ್‌ಶಾಟ್',
      'dash.orders_converted': 'ಪರಿವರ್ತಿತ ಆರ್ಡರ್‌ಗಳು',
      'dash.active_leads': 'ಸಕ್ರಿಯ ಲೀಡ್‌ಗಳು',
      'dash.open': 'ತೆರೆಯಿರಿ',

      // Inbox Queue & Workstation
      'inbox.todays_messages': 'ಇಂದಿನ ಸಂದೇಶಗಳು:',
      'inbox.search_placeholder': 'ಗ್ರಾಹಕ, ಫೋನ್, ಎಸ್‌ಕೆಯು, ವಿಚಾರಣೆ ಹುಡುಕಿ...',
      'inbox.all': 'ಎಲ್ಲಾ',
      'inbox.unassigned': 'ನಿಯೋಜಿಸದವು',
      'inbox.my_queue': 'ನನ್ನ ಸರತಿ',
      'inbox.urgent': 'ತುರ್ತು',
      'inbox.autoreply_paused': 'ಆಟೋ-ರಿಪ್ಲೈ ವಿರಾಮಗೊಳಿಸಲಾಗಿದೆ:',
      'inbox.autoreply_paused_sub': 'ಸ್ವಯಂಚಾಲಿತ ಸಂದೇಶಗಳು ಆಫ್ ಆಗಿವೆ. ಕೈಯಾರೆ ಉತ್ತರಿಸುವುದು ಅಗತ್ಯವಿದೆ.',
      'inbox.resume_autoreply': 'ಆಟೋ-ರಿಪ್ಲೈ ಪುನರಾರಂಭಿಸಿ',
      'inbox.no_messages': 'ಈ ಚಾಟ್‌ನಲ್ಲಿ ಇನ್ನೂ ಯಾವುದೇ ಸಂದೇಶಗಳಿಲ್ಲ',
      'inbox.quick_templates': 'ತ್ವರಿತ ಟೆಂಪ್ಲೇಟ್‌ಗಳು:',
      'inbox.repeat_customer': 'ಮರುಕಳಿಸುವ ಗ್ರಾಹಕ',
      'inbox.new_customer': 'ಹೊಸ ಗ್ರಾಹಕ',
      'inbox.reassign': 'ಮರುನಿಯೋಜಿಸಿ',
      'inbox.staff_label': 'ಸಿಬ್ಬಂದಿ',
      'inbox.customer': 'ಗ್ರಾಹಕ',

      // Auto-Reply Hub
      'ar.title': 'ಪೂರ್ವನಿಗದಿ ಟೆಂಪ್ಲೇಟ್‌ಗಳು & ಆಟೋ-ರಿಪ್ಲೈ ಹಬ್',
      'ar.subtitle': 'ಪೂರ್ವನಿಗದಿ ಪ್ರಶ್ನೆಗಳು ಮತ್ತು ತ್ವರಿತ ಸ್ವಯಂಚಾಲಿತ ಪ್ರತಿಕ್ರಿಯೆಗಳು',
      'ar.bot_label': 'ಆಟೋ-ರಿಪ್ಲೈ ಬಾಟ್:',
      'ar.back_to_chats': 'ಚಾಟ್‌ಗಳಿಗೆ ಹಿಂತಿರುಗಿ',
      'ar.search_placeholder': 'ಪ್ರಶ್ನೆಗಳು ಅಥವಾ ಕೀವರ್ಡ್‌ಗಳನ್ನು ಹುಡುಕಿ...',
      'ar.all_templates': 'ಎಲ್ಲಾ ಟೆಂಪ್ಲೇಟ್‌ಗಳು',
      'ar.active_only': 'ಸಕ್ರಿಯವಾದವು ಮಾತ್ರ',
      'ar.category_links': 'ವರ್ಗ ಸ್ಟಾಕ್ ಲಿಂಕ್‌ಗಳು',
      'ar.custom_answers': 'ಕಸ್ಟಮ್ ಉತ್ತರಗಳು',
      'ar.add_template': '+ ಹೊಸ ಪ್ರಶ್ನೆ & ಉತ್ತರ ಸೇರಿಸಿ',
      'ar.active_templates': 'ಸಕ್ರಿಯ ಟೆಂಪ್ಲೇಟ್‌ಗಳು',

      // Toasts & Notifications
      'toast.lang_changed': 'ಭಾಷೆ ಬದಲಾಗಿದೆ',
      'toast.lang_desc': 'CRM ಭಾಷೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಬದಲಾಯಿಸಲಾಗಿದೆ:',
      'header.title.inbox_chats': "ವಾಟ್ಸಾಪ್ ಇನ್‌ಬಾಕ್ಸ್ ಮತ್ತು ಗ್ರಾಹಕರ ಸರದಿ",
      'header.sub.inbox_chats': "ತ್ವರಿತ ಸಿಬ್ಬಂದಿ ನಿಯೋಜನೆ ಮತ್ತು ಆರ್ಡರ್ ಬುಕಿಂಗ್‌ನೊಂದಿಗೆ ನೇರ ಸಂಭಾಷಣೆ ನಿರ್ವಹಣೆ",
      'header.title.inbox_autoreply': "ವಾಟ್ಸಾಪ್ ಇನ್‌ಬಾಕ್ಸ್ — ಪೂರ್ವನಿಗದಿ ಟೆಂಪ್ಲೇಟ್‌ಗಳು & ಆಟೋ-ಉತ್ತರ ಹಬ್",
      'header.sub.inbox_autoreply': "ಸ್ವಯಂಚಾಲಿತ ಪ್ರತಿಕ್ರಿಯೆಗಳು, ಸ್ಟಾಕ್ ಕ್ಯಾಟಲಾಗ್ ಲಿಂಕ್‌ಗಳು ಮತ್ತು ಪ್ರಚೋದಕ ಕೀವರ್ಡ್‌ಗಳನ್ನು ಕಾನ್ಫಿಗರ್ ಮಾಡಿ",
      'header.title.inbox_broadcast': "ವಾಟ್ಸಾಪ್ ಇನ್‌ಬಾಕ್ಸ್ — ಸ್ವಯಂಚಾಲಿತ ಟೆಂಪ್ಲೇಟ್ ಪ್ರಸಾರ",
      'header.sub.inbox_broadcast': "ವೇರಿಯಬಲ್ ಟ್ಯಾಗ್‌ಗಳೊಂದಿಗೆ ಗ್ರಾಹಕರಿಗೆ ವೈಯಕ್ತಿಕಗೊಳಿಸಿದ ಪ್ರಚಾರ ಟೆಂಪ್ಲೇಟ್‌ಗಳನ್ನು ಕಳುಹಿಸಿ",
      'chat.select_conversation': "ಚಾಟಿಂಗ್ ಪ್ರಾರಂಭಿಸಲು ಸಂಭಾಷಣೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
      'chat.staff_prefix': "ಸಿಬ್ಬಂದಿ: ",
      'chat.customer_prefix': "ಗ್ರಾಹಕ: ",
      'chat.staff_label': "ಸಿಬ್ಬಂದಿ",
      'chat.staff': "ಸಿಬ್ಬಂದಿ:",
      'chat.recent': "ಇತ್ತೀಚಿನ",
      'chat.no_messages': "ಯಾವುದೇ ಸಂದೇಶಗಳಿಲ್ಲ",
      'badge.urgent': "ತುರ್ತು",
      'badge.high': "ಹೆಚ್ಚು",
      'badge.dnd': "ಡಿಎನ್‌ಡಿ",
      'badge.payment_pending': "ಪಾವತಿ ಬಾಕಿ ಇದೆ",
      'badge.follow_up': "ಫಾಲೋ-ಅಪ್",
      'badge.in_progress': "ಪ್ರಗತಿಯಲ್ಲಿದೆ",
      'badge.resolved': "ಪರಿಹರಿಸಲಾಗಿದೆ",
      'badge.converted': "ಪರಿವರ್ತಿಸಲಾಗಿದೆ",
      'common.my_queue': "ನನ್ನ ಸರದಿ",
      'common.unassigned': "ನಿಯೋಜಿಸಿಲ್ಲ",
      'common.reset': "ರೀಸೆಟ್",
      'common.reassign': "ಮರು ನಿಯೋಜಿಸಿ",
      'common.assigned': "ನಿಯೋಜಿಸಲಾಗಿದೆ",
      'common.customer': "ಗ್ರಾಹಕ",
      'inbox.title': "ವಾಟ್ಸಾಪ್ ಇನ್‌ಬಾಕ್ಸ್ ಮತ್ತು ಗ್ರಾಹಕರ ಸರದಿ",
      'inbox.subtitle': "ತ್ವರಿತ ಸಿಬ್ಬಂದಿ ನಿಯೋಜನೆ ಮತ್ತು ಆರ್ಡರ್ ಬುಕಿಂಗ್‌ನೊಂದಿಗೆ ನೇರ ಸಂಭಾಷಣೆ ನಿರ್ವಹಣೆ",
      'inbox.scan_qr': "+ ಹೊಸ ವಾಟ್ಸಾಪ್ ಲೈನ್ / ಕ್ಯೂಆರ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ",
      'inbox.active_lines': "ಸಕ್ರಿಯ ಲೈನ್‌ಗಳು",
      'broadcast.title': "ಸ್ವಯಂಚಾಲಿತ ವಾಟ್ಸಾಪ್ ಟೆಂಪ್ಲೇಟ್ ಪ್ರಸಾರ",
      'broadcast.safe_badge': "ಉಚಿತ ಮತ್ತು ಸುರಕ್ಷಿತ ರವಾನೆ",
      'broadcast.desc': "ತ್ವರಿತ ವೇರಿಯಬಲ್ ವೈಯಕ್ತೀಕರಣದೊಂದಿಗೆ ಗ್ರಾಹಕರ ಚಾಟ್‌ಗಳಿಗೆ ವೈಯಕ್ತಿಕಗೊಳಿಸಿದ ಪ್ರಚಾರ ಟೆಂಪ್ಲೇಟ್‌ಗಳನ್ನು ಕಳುಹಿಸಿ",
      'broadcast.back_chats': "ಚಾಟ್‌ಗಳಿಗೆ ಹಿಂತಿರುಗಿ",
      'broadcast.choose_template': "ಸಂದೇಶ ಟೆಂಪ್ಲೇಟ್ ಆಯ್ಕೆಮಾಡಿ:",
      'broadcast.save_new': "ಹೊಸದನ್ನು ಉಳಿಸಿ",
      'broadcast.msg_content': "ಸಂದೇಶ ವಿಷಯ:",
      'broadcast.quick_insert': "ತ್ವರಿತ ಸೇರ್ಪಡೆ:",
      'broadcast.dynamic_values': "ಡೈನಾಮಿಕ್ ಟೆಂಪ್ಲೇಟ್ ಮೌಲ್ಯಗಳನ್ನು ಹೊಂದಿಸಿ",
      'broadcast.live_sync': "ಲೈವ್ ಸಿಂಕ್",
      'broadcast.add_variable': "ವೇರಿಯಬಲ್ ಸೇರಿಸಿ",
      'broadcast.start_broadcast': "ಸ್ವಯಂಚಾಲಿತ ಪ್ರಸಾರವನ್ನು ಪ್ರಾರಂಭಿಸಿ"
    }
  };

  // 3. Active Language State
  let currentLang = 'en';
  try {
    const saved = localStorage.getItem('GRM_APP_LANG');
    if (saved && DICTIONARY[saved]) {
      currentLang = saved;
    }
  } catch (e) {
    currentLang = 'en';
  }

  // 4. Translation Helper Function
  function t(key, fallback = '') {
    const dict = DICTIONARY[currentLang] || DICTIONARY['en'];
    if (dict && dict[key] !== undefined) {
      return dict[key];
    }
    const enDict = DICTIONARY['en'];
    if (enDict && enDict[key] !== undefined) {
      return enDict[key];
    }
    return fallback || key;
  }

  // 5. Get Current Language Object
  function getCurrentLanguage() {
    return LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];
  }

  // 6. Update Top Header UI Switcher Display
  function renderHeaderLanguageButton() {
    const flagEl = document.getElementById('header-current-lang-flag');
    const nameEl = document.getElementById('header-current-lang-name');
    const cur = getCurrentLanguage();
    if (flagEl) flagEl.innerHTML = cur.flagSvg || cur.flag;
    if (nameEl) nameEl.textContent = cur.native;

    // Update active highlight in dropdown
    const listContainer = document.getElementById('header-lang-options-list');
    if (listContainer) {
      listContainer.innerHTML = LANGUAGES.map(lang => {
        const isActive = lang.code === currentLang;
        return `
          <button type="button" onclick="window.applyAppLanguage('${lang.code}')" id="lang-opt-${lang.code}"
            class="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
              isActive
                ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200 shadow-2xs'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }">
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center shrink-0">${lang.flagSvg || lang.flag}</span>
              <span class="font-bold">${lang.native}</span>
              <span class="text-[10px] text-slate-400 font-normal">(${lang.label})</span>
            </div>
            ${isActive ? '<span class="material-symbols-outlined text-[16px] text-emerald-600 font-bold">check</span>' : ''}
          </button>
        `;
      }).join('');
    }
  }

  // 7. Toggle Dropdown Menu
  function toggleLangSwitcherDropdown(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const dd = document.getElementById('header-lang-dropdown');
    const arrow = document.getElementById('lang-dropdown-arrow');
    if (!dd) return;
    const isHidden = dd.classList.contains('hidden');

    // Close any other open dropdowns first (like phone switcher)
    const phoneDd = document.getElementById('phone-switcher-dropdown');
    if (phoneDd) phoneDd.classList.add('hidden');

    if (isHidden) {
      renderHeaderLanguageButton();
      dd.classList.remove('hidden');
      if (arrow) arrow.style.transform = 'rotate(180deg)';
    } else {
      closeLangSwitcherDropdown();
    }
  }

  function closeLangSwitcherDropdown() {
    const dd = document.getElementById('header-lang-dropdown');
    const arrow = document.getElementById('lang-dropdown-arrow');
    if (dd) dd.classList.add('hidden');
    if (arrow) arrow.style.transform = 'rotate(0deg)';
  }

  // 8. Apply Language Across Entire Application
  function applyAppLanguage(langCode, suppressToast = false) {
    if (!DICTIONARY[langCode]) langCode = 'en';
    currentLang = langCode;

    try {
      localStorage.setItem('GRM_APP_LANG', langCode);
    } catch (e) {}

    // Asynchronously save to staff session/profile in MySQL if logged in
    try {
      fetch('api.php?action=save_user_preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferred_language: langCode })
      }).catch(() => {});
    } catch (e) {}

    // Update Top Header UI Switcher
    renderHeaderLanguageButton();
    closeLangSwitcherDropdown();

    // Translate all static data-i18n DOM elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        const translated = t(key);
        if (translated) el.textContent = translated;
      }
    });

    // Translate placeholder attributes
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        const translated = t(key);
        if (translated) el.placeholder = translated;
      }
    });

    // Translate title attributes
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (key) {
        const translated = t(key);
        if (translated) el.title = translated;
      }
    });

    // Update Topbar page titles in real-time
    if (typeof window.updatePageHeaderTitle === 'function') {
      try { window.updatePageHeaderTitle(); } catch (e) {}
    }
    if (window.ACTIVE_VIEW === 'inbox' && typeof window.switchInboxSubmodule === 'function') {
      try { window.switchInboxSubmodule(window.ACTIVE_INBOX_SUBMODULE || 'chats'); } catch (e) {}
    }

    // Re-render active views if app runtime is ready
    if (typeof window.renderCustomer360Panel === 'function') {
      try { window.renderCustomer360Panel(); } catch (e) {}
    }
    if (typeof window.renderInboxConversationList === 'function') {
      try { window.renderInboxConversationList(); } catch (e) {}
    }
    if (typeof window.renderChatHeader === 'function') {
      try { window.renderChatHeader(); } catch (e) {}
    }
    if (window.ACTIVE_VIEW === 'dashboard' && typeof window.renderDashboard === 'function') {
      try { window.renderDashboard(); } catch (e) {}
    }
    if (window.ACTIVE_VIEW === 'followups' && typeof window.renderFollowupsCards === 'function') {
      try { window.renderFollowupsCards(); } catch (e) {}
    }
    if (window.ACTIVE_VIEW === 'customers' && typeof window.renderCustomersGrid === 'function') {
      try { window.renderCustomersGrid(); } catch (e) {}
    }
    if (window.ACTIVE_VIEW === 'orders' && typeof window.renderOrdersModule === 'function') {
      try { window.renderOrdersModule(); } catch (e) {}
    }
    if (window.ACTIVE_VIEW === 'catalog' && typeof window.renderCatalogGrid === 'function') {
      try { window.renderCatalogGrid(''); } catch (e) {}
    }
    if (window.ACTIVE_VIEW === 'dnd' && typeof window.renderDndModule === 'function') {
      try { window.renderDndModule(); } catch (e) {}
    }

    const curLangObj = getCurrentLanguage();
    if (!suppressToast && typeof window.showToast === 'function') {
      window.showToast(
        t('toast.lang_changed', 'Language Updated'),
        `${t('toast.lang_desc', 'CRM language switched to')} ${curLangObj.flag} ${curLangObj.native} (${curLangObj.label})`,
        'translate',
        'emerald'
      );
    }
  }

  // Close dropdown on click outside
  document.addEventListener('click', function (e) {
    const wrapper = document.getElementById('header-lang-switcher-wrapper');
    if (wrapper && !wrapper.contains(e.target)) {
      closeLangSwitcherDropdown();
    }
  });

  // Global Exports
  window.CRM_LANGUAGES = LANGUAGES;
  window.CRM_I18N = DICTIONARY;
  window.t = t;
  window.getCurrentLanguage = getCurrentLanguage;
  window.toggleLangSwitcherDropdown = toggleLangSwitcherDropdown;
  window.closeLangSwitcherDropdown = closeLangSwitcherDropdown;
  window.applyAppLanguage = applyAppLanguage;

  // Initial Auto-Apply on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      applyAppLanguage(currentLang, true);
    });
  } else {
    setTimeout(() => {
      applyAppLanguage(currentLang, true);
    }, 20);
  }
})();
