export const airports = [
  { code: 'PIT', city: 'Pittsburgh', name: 'Pittsburgh International' },
  { code: 'ORD', city: 'Chicago', name: "O'Hare International" },
  { code: 'ATL', city: 'Atlanta', name: 'Hartsfield–Jackson Atlanta' },
  { code: 'CLT', city: 'Charlotte', name: 'Charlotte Douglas' },
  { code: 'JFK', city: 'New York', name: 'John F. Kennedy International' },
  { code: 'LAX', city: 'Los Angeles', name: 'Los Angeles International' },
  { code: 'SFO', city: 'San Francisco', name: 'San Francisco International' },
  { code: 'DFW', city: 'Dallas', name: 'Dallas Fort Worth International' },
  { code: 'MIA', city: 'Miami', name: 'Miami International' },
  { code: 'SEA', city: 'Seattle', name: 'Seattle–Tacoma International' },
  { code: 'BOS', city: 'Boston', name: 'Boston Logan International' }
];
const routes = [
  ['PIT','ORD',129,105],['PIT','ATL',159,115],['PIT','CLT',139,90],
  ['PIT','JFK',119,85],['PIT','DFW',209,175],['PIT','MIA',199,165],
  ['ORD','JFK',145,125],['ORD','LAX',269,260],['ORD','SFO',249,275],
  ['ORD','SEA',239,250],['ATL','MIA',135,105],['ATL','DFW',179,135],
  ['ATL','LAX',269,255],['CLT','JFK',125,110],['CLT','MIA',125,115],
  ['JFK','LAX',309,360],['JFK','SFO',319,370],['JFK','BOS',109,70],
  ['DFW','LAX',229,190],['DFW','SFO',249,210],['SFO','SEA',139,125]
];
const hhmm = minutes => `${String(Math.floor(minutes / 60) % 24).padStart(2,'0')}:${String(minutes % 60).padStart(2,'0')}`;
const hash = s => [...s].reduce((acc, ch) => ((acc * 31 + ch.charCodeAt(0)) >>> 0), 7);
export function searchFlights({ from, to, date, passengers = 1, cabin = 'Economy' }) {
  const route = routes.find(([a,b]) => (a === from && b === to) || (b === from && a === to));
  if (!route || from === to) return [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(`${date}T12:00:00Z`))) return [];
  const today = new Date().toISOString().slice(0,10);
  if (date < today) return [];
  const [, , baseFare, duration] = route;
  const mult = cabin === 'Business' ? 2.35 : cabin === 'Premium Economy' ? 1.55 : 1;
  const seasonal = hash(date + from + to) % 52;
  return [0,1,2,3].map((i) => {
    const departure = [390, 585, 845, 1115][i] + (hash(from + to) % 20);
    const fare = Math.round((baseFare + seasonal + i * 27) * mult);
    const seats = 3 + ((hash(date + from + to + i) % 30));
    return {
      id: `AX-${from}-${to}-${date}-${i}-${cabin.replaceAll(' ','')}`,
      number: `AX${100 + (hash(from + to) % 600) + i}`,
      from, to, date, departure: hhmm(departure), arrival: hhmm(departure + duration),
      arrivalNextDay: departure + duration >= 1440,
      durationMinutes: duration, price: fare, currency: 'USD', seats,
      cabin, stops: 0, airline: 'AirX',
      passengers,
      totalPrice: fare * passengers
    };
  });
}
export function getFlightById(id) {
  const match = /^AX-([A-Z]{3})-([A-Z]{3})-(\d{4}-\d{2}-\d{2})-(\d)-(Economy|PremiumEconomy|Business)$/.exec(id || '');
  if (!match) return null;
  const [,from,to,date,index,cabin] = match;
  return searchFlights({from,to,date,cabin: cabin === 'PremiumEconomy' ? 'Premium Economy' : cabin})[Number(index)] || null;
}
export function resolveAirport(value) {
  if (!value) return null;
  const text = value.trim().toLowerCase();
  return airports.find(a => a.code.toLowerCase() === text || a.city.toLowerCase() === text)?.code || null;
}
