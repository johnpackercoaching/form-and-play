#!/usr/bin/env node
// Posts progress updates to a Firestore build request
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const args = process.argv.slice(2);

function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : null;
}

const buildId = getArg('build-id');
const phase = getArg('phase');
const note = getArg('note');

if (!buildId || !phase) {
  console.error('Usage: --build-id <id> --phase <phase> [--note <note>]');
  process.exit(1);
}

async function main() {
  try {
    initializeApp({ credential: cert(JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'))) });
    const db = getFirestore();
    await db.collection('buildRequests').doc(buildId).update({
      currentPhase: phase,
      lastProgressNote: note || '',
      progressUpdatedAt: new Date().toISOString(),
    });
    console.log(`Build ${buildId} progress: ${phase} - ${note || ''}`);
  } catch (err) {
    console.error('Progress update failed:', err.message);
  }
}

main();
