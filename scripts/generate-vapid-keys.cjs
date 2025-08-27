/**
 * Script para gerar chaves VAPID para notificações push
 * Execute com: node scripts/generate-vapid-keys.js
 */

const crypto = require('crypto');

function generateVapidKeys() {
  // Gerar chave privada (32 bytes)
  const privateKey = crypto.randomBytes(32);
  
  // Converter para base64url
  const privateKeyBase64 = privateKey.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  // Gerar chave pública usando ECDH
  const ecdh = crypto.createECDH('prime256v1');
  ecdh.setPrivateKey(privateKey);
  const publicKey = ecdh.getPublicKey();
  
  // Converter para base64url
  const publicKeyBase64 = publicKey.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return {
    publicKey: publicKeyBase64,
    privateKey: privateKeyBase64
  };
}

const keys = generateVapidKeys();

console.log('\n=== VAPID Keys Generated ===\n');
console.log('Add these to your .env file:\n');
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log('\n============================\n');
console.log('⚠️  Keep the private key secure and never expose it in client-side code!');
console.log('✅ The public key can be safely used in your frontend application.');