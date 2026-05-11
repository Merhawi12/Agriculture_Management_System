#!/usr/bin/env node
/**
 * Supabase schema migration runner.
 * Usage:  node migrate.js <SUPABASE_ACCESS_TOKEN>
 * Get your token from: https://supabase.com/dashboard/account/tokens
 */
require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const axios = require('axios');

const ACCESS_TOKEN = process.argv[2] || process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF  = (process.env.SUPABASE_URL || '').replace('https://', '').split('.')[0];

if (!ACCESS_TOKEN) {
  console.error('Usage: node migrate.js <SUPABASE_ACCESS_TOKEN>');
  console.error('Get your token from: https://supabase.com/dashboard/account/tokens');
  process.exit(1);
}
if (!PROJECT_REF) {
  console.error('SUPABASE_URL not set in .env');
  process.exit(1);
}

const sql = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8');

async function runQuery(query) {
  const res = await axios.post(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    { query },
    {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return res.data;
}

// Split SQL into individual statements (split on semicolons, skip blanks/comments)
function splitStatements(sql) {
  const stmts = [];
  let current = '';
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (!inString && (ch === "'" || ch === '"')) {
      inString = true;
      stringChar = ch;
      current += ch;
    } else if (inString && ch === stringChar && sql[i - 1] !== '\\') {
      inString = false;
      current += ch;
    } else if (!inString && ch === '-' && sql[i + 1] === '-') {
      // Line comment — skip to end of line
      while (i < sql.length && sql[i] !== '\n') i++;
    } else if (!inString && ch === ';') {
      const stmt = current.trim();
      if (stmt) stmts.push(stmt);
      current = '';
    } else {
      current += ch;
    }
  }
  const last = current.trim();
  if (last) stmts.push(last);
  return stmts;
}

(async () => {
  console.log(`\nProject: ${PROJECT_REF}`);
  console.log('Running migration...\n');

  const statements = splitStatements(sql);
  console.log(`Found ${statements.length} SQL statements\n`);

  let ok = 0, skipped = 0, failed = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.replace(/\s+/g, ' ').slice(0, 70);
    process.stdout.write(`[${i + 1}/${statements.length}] ${preview}... `);

    try {
      await runQuery(stmt);
      console.log('OK');
      ok++;
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      if (msg.includes('already exists') || msg.includes('duplicate') || msg.includes('conflict')) {
        console.log('SKIPPED (already exists)');
        skipped++;
      } else {
        console.log(`FAILED: ${msg}`);
        failed++;
      }
    }
  }

  console.log(`\n✓ Done — ${ok} succeeded, ${skipped} skipped, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
