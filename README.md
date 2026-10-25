# ✈ AirX — Airline Booking Website with Travel Agent

A polished, **GitHub-ready full-stack airline booking demo** featuring a conversational travel agent, flight searches, simulated bookings, and itinerary management.

> **Portfolio/demo only:** AirX is fictional. Flights, seats, prices and booking confirmations are generated locally. **No real reservations, payments, e-tickets or refunds are issued.**

## Features

- Responsive landing page and flight search experience
- Origin/destination, future travel dates, passenger counts (1–6), and cabin selection
- Generated nonstop flights across 11 demo airports, with departure times and fares
- Built-in conversational **travel agent** that translates natural-language prompts into searches
- Booking flow with explicit demo-booking confirmation, local record storage, and confirmation code
- Retrieve/cancel demo reservations by confirmation code and email
- REST endpoints; Node.js automated tests; GitHub Actions CI
- Zero runtime dependencies and no API keys required

## Get started

**Requires Node.js 20 or newer.**

```bash
npm start
```

Visit **http://localhost:3000**.

For development and tests:

```bash
npm run dev
npm test
```

Try asking the agent: **“Pittsburgh to Chicago on 2026-11-12”** (or use any future date).

## Repository structure

```text
airx-airline-agent/
├── public/
│   ├── index.html            # Booking website
│   ├── styles.css            # Responsive visual design
│   └── app.js                # Client-side search, booking and chat
├── data/
│   ├── flights.js            # Airports and sample flight engine
│   └── store.js              # JSON-file demo booking store
├── agent.js                  # Deterministic conversational travel agent
├── server.js                 # Node HTTP server and REST API
├── tests/agent.test.js       # Agent/flight unit tests
└── .github/workflows/ci.yml # Test pipeline
```

## REST API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/airports` | Supported airports |
| GET | `/api/flights?from=PIT&to=ORD&date=2026-11-12&passengers=1&cabin=Economy` | Flight search |
| POST | `/api/agent` | Natural-language flight assistance |
| POST | `/api/bookings` | Create a confirmed **demo** booking |
| POST | `/api/bookings/lookup` | Find booking by reference and email |
| POST | `/api/bookings/cancel` | Cancel demo booking (explicit confirmation) |

Agent request example:

```bash
curl -X POST http://localhost:3000/api/agent \
  -H 'Content-Type: application/json' \
  -d '{"message":"PIT to ORD on 2026-11-12"}'
```

Booking request example (use a flight `id` returned by `/api/flights`):

```json
{
  "flightId": "AX-PIT-ORD-2026-11-12-0-Economy",
  "name": "Sample Traveler",
  "email": "sample@example.com",
  "confirm": true
}
```

## Agent implementation

The included agent is **rules-based**, not a hosted LLM. It resolves supported cities/airport codes, parses ISO dates, interprets passenger counts and cabin preferences, invokes the flight search function, and responds with recommendations. Search is read-only; **the agent cannot autonomously finalize a booking or charge a card**. You can replace `agentReply` with a model-powered agent using structured tool calls, validation, and explicit confirmation at the booking boundary.

## Deployment and production considerations

This project is intended for local demonstration, not public production deployment. The local JSON store is suitable for a demo only. For production, use a database, user authentication, rate limiting, CSRF protection where relevant, encryption, audit trails, privacy/retention policies, pricing/inventory locks, PCI-compliant payment processing, and an accredited flights/GDS provider. Remove or replace the externally hosted hero image if a fully offline deployment is required. Multi-passenger flight prices are displayed, but the demo booking API currently books **one traveler at a time**.

## Publish to GitHub

```bash
git init
git add .
git commit -m "Initial AirX airline booking demo with travel agent"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/airx-airline-agent.git
git push -u origin main
```

Create the empty repository on GitHub before pushing. No GitHub account access is required to use the included local project.

## License

MIT
