// Run while the feed is running:  node server/test-relay.mjs
// Client A sends a bad message and a good SOS; client B must receive only the SOS.
import WebSocket from 'ws';

const URL = process.env.FEED_URL ?? 'ws://localhost:8080';
const a = new WebSocket(URL);
const b = new WebSocket(URL);
const received = [];

b.on('message', (raw) => {
  try {
    const m = JSON.parse(String(raw));
    if (m && !Array.isArray(m) && typeof m.kind === 'string') received.push(m.kind);
  } catch {}
});

let open = 0;
const ready = () => {
  if (++open < 2) return;
  a.send(JSON.stringify({ kind: 'evil', x: 1 }));
  a.send(JSON.stringify({ kind: 'sos', id: 'TEST-1', type: 'medical', zoneId: 'gate-b', ts: Date.now() }));
  setTimeout(() => {
    const ok = received.includes('sos') && !received.includes('evil');
    console.log('B received:', received);
    console.log(ok ? 'PASS: relay works, bad kind dropped' : 'FAIL');
    a.close();
    b.close();
    process.exit(ok ? 0 : 1);
  }, 1000);
};
a.on('open', ready);
b.on('open', ready);
a.on('error', (e) => { console.log('FAIL: cannot connect -', e.message); process.exit(1); });
