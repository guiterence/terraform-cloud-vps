#!/usr/bin/env node
/**
 * Script para gerar JWT tokens para autenticação com PostgREST/Supabase self-hosted.
 * 
 * O PostgREST requer JWT tokens válidos no header Authorization: Bearer,
 * mas o N8N Supabase plugin espera usar o service_key diretamente.
 * 
 * Este script gera JWT tokens válidos que podem ser usados no lugar do service_key.
 */

const crypto = require('crypto');

function base64UrlEncode(str) {
  return str.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function generateJWT(secret, role = 'service_role', expiresInDays = 365) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    role: role,
    exp: now + (expiresInDays * 24 * 60 * 60),
    iat: now
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Main
const args = process.argv.slice(2);

if (args.length < 1) {
  console.log('Uso: node generate_supabase_jwt.js <service_key> [role] [expires_in_days]');
  console.log('\nExemplo:');
  console.log("  node generate_supabase_jwt.js 'n78oYSAI5XiVxH5Ua4CYf4W+q1cS/QuSsbH9moX2onY='");
  console.log("  node generate_supabase_jwt.js 'n78oYSAI5XiVxH5Ua4CYf4W+q1cS/QuSsbH9moX2onY=' service_role 365");
  process.exit(1);
}

const secret = args[0];
const role = args[1] || 'service_role';
const expiresInDays = parseInt(args[2]) || 365;

const token = generateJWT(secret, role, expiresInDays);

console.log(`\nJWT Token gerado para role '${role}':`);
console.log(token);
console.log(`\nTamanho: ${token.length} caracteres`);
console.log(`Token expira em ${expiresInDays} dias.`);
console.log('\nUse este token no campo "Service Role Secret" do N8N Supabase.\n');

