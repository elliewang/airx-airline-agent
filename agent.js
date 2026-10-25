import { airports, resolveAirport, searchFlights } from './data/flights.js';

// Transparent, deterministic travel agent: no external LLM key required.
// Agent can propose searches and deep-link results but never creates a booking without
// explicit traveler details and confirmation through the booking endpoint.
export function agentReply(message, context = {}) {
  const text = String(message || '').trim();
  const lower = text.toLowerCase();
  if (!text) return { reply: 'Tell me where and when you want to fly. For example: Pittsburgh to Chicago on 2026-11-12.', suggestions: ['Pittsburgh to Chicago', 'Show destinations'] };
  if (/cancel|refund/i.test(text)) return { reply: 'You can find and cancel a demo booking from Manage Booking using your confirmation code and email address. No real tickets or refunds are processed.', action: { type: 'manage' } };
  if (/baggage|bag|luggage|carry.on/i.test(text)) return { reply: 'AirX is a demo airline, so baggage rules are illustrative only. For a real itinerary, always consult the operating airline’s published baggage policy.' };
  if (/help|what can you|how do/i.test(text)) return { reply: 'I can help you choose destinations, find AirX demo flights, compare times and fares, and guide you to the booking form. Try “Pittsburgh to Chicago on 2026-11-12.”' };
  if (/destination|where.*fly|airport/i.test(text)) return { reply: `AirX demo airports: ${airports.map(a => `${a.city} (${a.code})`).join(', ')}. Tell me your departure city, destination and travel date.` };
  const date = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/)?.[1] || context.date;
  const match = text.match(/(?:from\s+)?([\w ]+?)\s+(?:to|→)\s+([\w ]+?)(?:\s+on\s+|\s+for\s+|\s+\d{4}-\d{2}-\d{2}|$)/i);
  const from = resolveAirport(match?.[1]) || resolveAirport(context.from);
  const to = resolveAirport(match?.[2]) || resolveAirport(context.to);
  const passengersMatch = text.match(/\b([1-6])\s+(?:passengers?|travelers?|people|adults?)\b/i);
  const passengers = passengersMatch ? Number(passengersMatch[1]) : (context.passengers || 1);
  const cabin = /business class/i.test(lower) ? 'Business' : /premium economy/i.test(lower) ? 'Premium Economy' : (context.cabin || 'Economy');
  if (from && to && date) {
    const flights = searchFlights({from, to, date, passengers, cabin});
    if (!flights.length) return { reply: 'I could not find demo flights for that route and date. Try a future date and one of the AirX supported city pairs.', action: {type:'search', from,to,date,passengers,cabin} };
    const cheapest = flights.reduce((a,b) => a.price < b.price ? a : b);
    return { reply: `I found ${flights.length} nonstop AirX demo flights from ${from} to ${to} on ${date}. Fares start at $${cheapest.price} per person (${cabin}), departing ${cheapest.departure}. I’ve loaded the flight options below; choose one to continue.`, action: {type:'search',from,to,date,passengers,cabin}, suggestions: ['What is included?', 'How do I book?'] };
  }
  if (/book|reserve|ticket|flight|fly|trip/i.test(lower) || from || to) return { reply: `I can search flights for you. ${!from ? 'Where are you flying from? ' : ''}${!to ? 'Where would you like to go? ' : ''}${!date ? 'What date (YYYY-MM-DD)?' : ''}`.trim(), suggestions: ['Pittsburgh to Chicago on 2026-11-12'] };
  return { reply: 'I can help with flight searches, cabin options and demo bookings. Try “PIT to ORD on 2026-11-12”.' };
}
