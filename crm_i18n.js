/**
 * GRM WHATSAPP CRM — MULTI-LANGUAGE & I18N TRANSLATION ENGINE
 * Supports: English (en), Tamil (ta), Hindi (hi), Telugu (te), Malayalam (ml), Kannada (kn)
 */

(function () {
  'use strict';

  // 1. Language Definitions with Country Flags
  const LANGUAGES = [
    { code: 'en', flag: '🇬🇧', label: 'English', native: 'English' },
    { code: 'ta', flag: '🇮🇳', label: 'Tamil', native: 'தமிழ்' },
    { code: 'hi', flag: '🇮🇳', label: 'Hindi', native: 'हिन्दी' },
    { code: 'te', flag: '🇮🇳', label: 'Telugu', native: 'తెలుగు' },
    { code: 'ml', flag: '🇮🇳', label: 'Malayalam', native: 'മലയാളം' },
    { code: 'kn', flag: '🇮🇳', label: 'Kannada', native: 'ಕನ್ನಡ' }
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

      // Toasts & Notifications
      'toast.lang_changed': 'Language Updated',
      'toast.lang_desc': 'CRM language successfully switched to'
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

      // Toasts & Notifications
      'toast.lang_changed': 'மொழி மாற்றப்பட்டது',
      'toast.lang_desc': 'CRM மொழி வெற்றிகரமாக மாற்றப்பட்டது:'
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

      // Toasts & Notifications
      'toast.lang_changed': 'भाषा बदली गई',
      'toast.lang_desc': 'सीआरएम भाषा सफलतापूर्वक बदल दी गई:'
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

      // Toasts & Notifications
      'toast.lang_changed': 'భాష మార్చబడింది',
      'toast.lang_desc': 'CRM భాష విజయవంతంగా మార్చబడింది:'
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

      // Toasts & Notifications
      'toast.lang_changed': 'ഭാഷ മാറ്റി',
      'toast.lang_desc': 'CRM ഭാഷ വിജയകരമായി മാറ്റി:'
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

      // Toasts & Notifications
      'toast.lang_changed': 'ಭಾಷೆ ಬದಲಾಗಿದೆ',
      'toast.lang_desc': 'CRM ಭಾಷೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಬದಲಾಯಿಸಲಾಗಿದೆ:'
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
    if (flagEl) flagEl.textContent = cur.flag;
    if (nameEl) nameEl.textContent = cur.native;

    // Update active highlight in dropdown
    const listContainer = document.getElementById('header-lang-options-list');
    if (listContainer) {
      listContainer.innerHTML = LANGUAGES.map(lang => {
        const isActive = lang.code === currentLang;
        return `
          <button type="button" onclick="window.applyAppLanguage('${lang.code}')"
            class="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
              isActive
                ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200 shadow-2xs'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }">
            <div class="flex items-center gap-2">
              <span class="text-base">${lang.flag}</span>
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
