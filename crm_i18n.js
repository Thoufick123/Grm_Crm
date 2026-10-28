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
      'header.language': 'Language',

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
      'common.priority': 'Priority',
      'common.action': 'Action',
      'common.close': 'Close',
      'common.view': 'View',
      'common.active': 'Active',
      'common.today': 'Today',
      'common.all': 'All',
      'common.notes': 'Notes',

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
      'customer.change_status': 'Change Status:',
      'customer.callback_date': 'Callback Date:',
      'customer.save_status': 'Save Status & Callback',
      'customer.pay_option': 'Payment Pending Option',
      'customer.quick_notes': 'Quick Mindset Notes:',
      'customer.add_note': 'Add Note',
      'customer.type_message': 'Type a message...',
      'customer.send': 'Send',
      'customer.send_catalog': 'Send Catalog',
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
      'header.language': 'மொழி',

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
      'common.priority': 'முன்னுரிமை',
      'common.action': 'செயல்',
      'common.close': 'மூடு',
      'common.view': 'பார்வை',
      'common.active': 'செயலில்',
      'common.today': 'இன்று',
      'common.all': 'அனைத்தும்',
      'common.notes': 'குறிப்புகள்',

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
      'customer.change_status': 'நிலையை மாற்றுக:',
      'customer.callback_date': 'அழைப்பு தேதி:',
      'customer.save_status': 'நிலை & அழைப்பைச் சேமி',
      'customer.pay_option': 'பணம் நிலுவை விருப்பம்',
      'customer.quick_notes': 'விரைவுக் குறிப்புகள்:',
      'customer.add_note': 'குறிப்பு சேர்',
      'customer.type_message': 'செய்தியை உள்ளிடவும்...',
      'customer.send': 'அனுப்புக',
      'customer.send_catalog': 'பட்டியல் அனுப்பு',
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
      'header.language': 'भाषा',

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
      'common.priority': 'प्राथमिकता',
      'common.action': 'कार्रवाई',
      'common.close': 'बंद करें',
      'common.view': 'देखें',
      'common.active': 'सक्रिय',
      'common.today': 'आज',
      'common.all': 'सभी',
      'common.notes': 'टिप्पणियाँ',

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
      'customer.change_status': 'स्थिति बदलें:',
      'customer.callback_date': 'कॉलबैक तिथि:',
      'customer.save_status': 'स्थिति सहेजें',
      'customer.pay_option': 'भुगतान लंबित विकल्प',
      'customer.quick_notes': 'त्वरित नोट्स:',
      'customer.add_note': 'नोट जोड़ें',
      'customer.type_message': 'संदेश लिखें...',
      'customer.send': 'भेजें',
      'customer.send_catalog': 'कैटलॉग भेजें',
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
      'header.language': 'భాష',

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
      'common.priority': 'ప్రాధాన్యత',
      'common.action': 'చర్య',
      'common.close': 'మూసివేయి',
      'common.view': 'చూడండి',
      'common.active': 'యాక్టివ్',
      'common.today': 'ఈ రోజు',
      'common.all': 'అన్నీ',
      'common.notes': 'గమనికలు',

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
      'customer.change_status': 'స్థితిని మార్చండి:',
      'customer.callback_date': 'కాల్‌బ్యాక్ తేదీ:',
      'customer.save_status': 'స్థితిని సేవ్ చేయండి',
      'customer.pay_option': 'చెల్లింపు పెండింగ్ ఎంపిక',
      'customer.quick_notes': 'శీఘ్ర గమనికలు:',
      'customer.add_note': 'గమనిక జోడించండి',
      'customer.type_message': 'సందేశాన్ని టైప్ చేయండి...',
      'customer.send': 'పంపండి',
      'customer.send_catalog': 'కేటలాగ్ పంపండి',
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
      'header.language': 'ഭാഷ',

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
      'common.priority': 'മുൻഗണന',
      'common.action': 'നടപടി',
      'common.close': 'അടയ്ക്കുക',
      'common.view': 'കാണുക',
      'common.active': 'സജീവം',
      'common.today': 'ഇന്ന്',
      'common.all': 'എല്ലാം',
      'common.notes': 'കുറിപ്പുകൾ',

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
      'customer.change_status': 'നില മാറ്റുക:',
      'customer.callback_date': 'കോൾബാക്ക് തീയതി:',
      'customer.save_status': 'നില സംരക്ഷിക്കുക',
      'customer.pay_option': 'പേയ്‌മെന്റ് പെൻഡിംഗ് ഓപ്ഷൻ',
      'customer.quick_notes': 'ദ്രുത കുറിപ്പുകൾ:',
      'customer.add_note': 'കുറിപ്പ് ചേർക്കുക',
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
      'header.language': 'ಭಾಷೆ',

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
      'common.priority': 'ಆದ್ಯತೆ',
      'common.action': 'ಕ್ರಮ',
      'common.close': 'ಮುಚ್ಚಿ',
      'common.view': 'ವೀಕ್ಷಿಸಿ',
      'common.active': 'ಸಕ್ರಿಯ',
      'common.today': 'ಇಂದು',
      'common.all': 'ಎಲ್ಲವೂ',
      'common.notes': 'ಟಿಪ್ಪಣಿಗಳು',

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
      'customer.change_status': 'ಸ್ಥಿತಿಯನ್ನು ಬದಲಾಯಿಸಿ:',
      'customer.callback_date': 'ಕಾಲ್‌ಬ್ಯಾಕ್ ದಿನಾಂಕ:',
      'customer.save_status': 'ಸ್ಥಿತಿಯನ್ನು ಉಳಿಸಿ',
      'customer.pay_option': 'ಪಾವತಿ ಬಾಕಿ ಆಯ್ಕೆ',
      'customer.quick_notes': 'ತ್ವರಿತ ಟಿಪ್ಪಣಿಗಳು:',
      'customer.add_note': 'ಟಿಪ್ಪಣಿ ಸೇರಿಸಿ',
      'customer.type_message': 'ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ...',
      'customer.send': 'ಕಳುಹಿಸಿ',
      'customer.send_catalog': 'ಕ್ಯಾಟಲಾಗ್ ಕಳುಹಿಸಿ',
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
