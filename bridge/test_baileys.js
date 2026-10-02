try {
    const baileys = require('@whiskeysockets/baileys');
    console.log('Baileys keys:', Object.keys(baileys));
    console.log('Success!');
} catch (e) {
    console.error('Error:', e);
}
