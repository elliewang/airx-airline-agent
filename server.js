import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { airports, getFlightById, searchFlights } from './data/flights.js';
import { agentReply } from './agent.js';
import { createBooking, getBooking, cancelBooking } from './data/store.js';
const root = path.dirname(fileURLToPath(import.meta.url));
const publicPath = path.join(root,'public');
const port = Number(process.env.PORT || 3000);
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'application/javascript; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.ico':'image/x-icon' };
function response(res, code, payload) { res.writeHead(code, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); res.end(JSON.stringify(payload)); }
async function body(req) {
  let text = '';
  for await (const part of req) {
    text += part;
    if (text.length > 16_000) throw Object.assign(new Error('Request too large'), { status:413 });
  }
  try { return JSON.parse(text || '{}'); } catch { throw Object.assign(new Error('Invalid JSON'), {status:400}); }
}
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export async function handleRequest(req,res) {
  const url = new URL(req.url,'http://localhost');
  try {
    if (req.method === 'GET' && url.pathname === '/api/airports') return response(res,200,{airports});
    if (req.method === 'GET' && url.pathname === '/api/flights') {
      const params = Object.fromEntries(url.searchParams);
      const passengers = Number(params.passengers || 1);
      if (!Number.isInteger(passengers) || passengers < 1 || passengers > 6) return response(res,400,{error:'Choose 1–6 passengers.'});
      if (!airports.some(x => x.code === params.from) || !airports.some(x => x.code === params.to) || !params.date || !['Economy','Premium Economy','Business'].includes(params.cabin || 'Economy')) return response(res,400,{error:'Please provide valid departure, arrival, date and cabin.'});
      return response(res,200,{flights:searchFlights({...params,passengers})});
    }
    if (req.method === 'POST' && url.pathname === '/api/agent') {
      const input = await body(req);
      if (typeof input.message !== 'string' || input.message.length > 1000) return response(res,400,{error:'Message must be 1–1000 characters.'});
      return response(res,200,agentReply(input.message,input.context || {}));
    }
    if (req.method === 'POST' && url.pathname === '/api/bookings') {
      const input = await body(req);
      const flight = getFlightById(input.flightId);
      if (!flight) return response(res,400,{error:'That flight is unavailable.'});
      const name = String(input.name || '').trim();
      const email = String(input.email || '').trim();
      if (name.length < 2 || name.length > 100 || !emailRe.test(email) || email.length > 254 || input.confirm !== true) return response(res,400,{error:'Provide a valid name, email, and explicit demo booking confirmation.'});
      const booking = createBooking({flight,traveler:{name,email}});
      return response(res,201,{booking});
    }
    if (req.method === 'POST' && url.pathname === '/api/bookings/lookup') {
      const input = await body(req);
      const booking = getBooking(input.reference,input.email);
      return response(res,booking ? 200 : 404, booking ? {booking} : {error:'No booking found for this reference and email.'});
    }
    if (req.method === 'POST' && url.pathname === '/api/bookings/cancel') {
      const input = await body(req);
      if (input.confirm !== true) return response(res,400,{error:'Please confirm cancellation.'});
      const booking = cancelBooking(input.reference,input.email);
      return response(res,booking ? 200 : 404,booking ? {booking} : {error:'No booking found for this reference and email.'});
    }
    if (req.method !== 'GET') return response(res,405,{error:'Method not allowed'});
    const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
    const file = path.resolve(publicPath, '.' + pathname);
    if (!file.startsWith(publicPath + path.sep)) return response(res,403,{error:'Forbidden'});
    const data = await fs.readFile(file).catch(() => null);
    if (!data) return response(res,404,{error:'Not found'});
    res.writeHead(200,{'Content-Type':mime[path.extname(file)] || 'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(data);
  } catch(error) {response(res,error.status || 500,{error:error.status ? error.message : 'Unexpected server error'});}
}
if (process.env.NODE_ENV !== 'test') http.createServer(handleRequest).listen(port,() => console.log(`AirX is running at http://localhost:${port}`));
