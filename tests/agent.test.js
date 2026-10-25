import test from 'node:test';
import assert from 'node:assert/strict';
import { agentReply } from '../agent.js';
import { getFlightById, searchFlights } from '../data/flights.js';
test('agent searches supported city pairs',()=>{
  const result=agentReply('Pittsburgh to Chicago on 2026-11-12');
  assert.equal(result.action.type,'search');
  assert.equal(result.action.from,'PIT');
  assert.equal(result.action.to,'ORD');
  assert.match(result.reply,/4 nonstop/);
});
test('agent does not book directly',()=>assert.equal(agentReply('book a ticket').action,undefined));
test('flight ids are reproducible',()=>{
  const flight=searchFlights({from:'PIT',to:'ORD',date:'2026-11-12'})[0];
  assert.deepEqual(getFlightById(flight.id).id,flight.id);
});
test('past dates return no flights',()=>assert.deepEqual(searchFlights({from:'PIT',to:'ORD',date:'2020-01-01'}),[]));
