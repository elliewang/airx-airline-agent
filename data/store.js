import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const storePath = process.env.AIRX_DATA_PATH || path.join(process.cwd(), 'data', 'bookings.json');
function load() {
  try { return JSON.parse(fs.readFileSync(storePath, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}
function save(items) {
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  const tmp = `${storePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(items, null, 2));
  fs.renameSync(tmp, storePath);
}
export function createBooking({ flight, traveler }) {
  const bookings = load();
  const booking = {
    reference: crypto.randomBytes(4).toString('hex').toUpperCase(),
    createdAt: new Date().toISOString(), status: 'Confirmed (demo)',
    flight, traveler: { name: traveler.name.trim(), email: traveler.email.trim().toLowerCase() },
    totalPrice: flight.price, currency: 'USD', paymentStatus: 'Not charged — demo only'
  };
  bookings.push(booking); save(bookings);
  return booking;
}
export function getBooking(reference, email) {
  return load().find(b => b.reference === String(reference || '').trim().toUpperCase() && b.traveler.email === String(email || '').trim().toLowerCase()) || null;
}
export function cancelBooking(reference, email) {
  const items = load();
  const booking = items.find(b => b.reference === String(reference || '').trim().toUpperCase() && b.traveler.email === String(email || '').trim().toLowerCase());
  if (!booking) return null;
  booking.status = 'Cancelled (demo)';
  save(items);
  return booking;
}
