#!/usr/bin/env node
// Updates a Firestore build request document with status info
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const args = process.argv.slice(2);

function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : null;
}

const buildId = getArg('build-id');
const status = getArg('status');
const fixDescription = getArg('fix-description');

if (!buildId || !status) {
  console.error('Usage: --build-id <id> --status <status> [--fix-description <desc>]');
  process.exit(1);
}

async function main() {
  try {
    initializeApp({ credential: cert(JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'))) });
    const db = getFirestore();
    const update = { status, updatedAt: new Date().toISOString() };
    if (fixDescription) update.fixDescription = fixDescription;
    await db.collection('buildRequests').doc(buildId).update(update);
    console.log(`Build ${buildId} status -> ${status}`);
  } catch (err) {
    console.error('Failed to update build status:', err.message);
    process.exit(1);
  }
}

main();
