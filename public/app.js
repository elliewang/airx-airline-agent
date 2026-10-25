const $ = id => document.getElementById(id);
const today = new Date().toLocaleDateString('en-CA');
const future = new Date(Date.now() + 14*86400000).toLocaleDateString('en-CA');
$('year').textContent = new Date().getFullYear();
$('date').min = today;
$('date').value = future;
let airports = [];
let selectedFlight = null;
let lastSearch = {};
const money = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
const safe = s => String(s ?? '').replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(url, options={}) {const res=await fetch(url,options);const data=await res.json();if(!res.ok)throw Error(data.error || 'Please try again');return data;}
const post = (url,body) => api(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
async function init(){
  airports=(await api('/api/airports')).airports;
  for(const id of ['from','to']) $(''+id).innerHTML=airports.map(a=>`<option value="${a.code}">${safe(a.city)} (${a.code})</option>`).join('');
  $('from').value='PIT';$('to').value='ORD';
}
$('swap').onclick=()=>{const a=$('from').value;$('from').value=$('to').value;$('to').value=a;};
$('searchForm').addEventListener('submit',async e=>{e.preventDefault(); await search();});
async function search(override={}){
  const values={from:$('from').value,to:$('to').value,date:$('date').value,passengers:Number($('passengers').value),cabin:$('cabin').value,...override};
  if(values.from===values.to){alert('Choose two different airports.');return;}
  Object.entries(values).forEach(([id,value])=>{if($(id))$(id).value=String(value);});
  const query=new URLSearchParams(values);
  try {
    const {flights}=await api(`/api/flights?${query}`);
    lastSearch=values;
    $('results').hidden=false;
    $('resultsTitle').textContent=`${values.from} → ${values.to} · ${values.date}`;
    $('resultCount').textContent=`${flights.length} nonstop options · ${values.passengers} traveler(s)`;
    const list=$('flightResults');list.replaceChildren();
    if(!flights.length){list.textContent='No demo flights on this route. Choose another destination or departure date.';}
    flights.forEach(f=>{
      const row=document.createElement('article');row.className='flight';
      row.innerHTML=`<div class="airline-code">✈ AirX <span class="muted">${safe(f.number)}</span></div><div class="route-time"><div><strong>${safe(f.departure)}</strong><small>${safe(f.from)}</small></div><div class="line">Nonstop · ${Math.floor(f.durationMinutes/60)}h ${f.durationMinutes%60}m</div><div><strong>${safe(f.arrival)}</strong><small>${safe(f.to)}${f.arrivalNextDay?' +1 day':''}</small></div></div><div class="fare">${money(f.totalPrice)}<small>${money(f.price)} / person · ${safe(f.cabin)}</small></div>`;
      const btn=document.createElement('button');btn.className='primary';btn.textContent='Select →';btn.onclick=()=>openBooking(f);row.append(btn);list.append(row);
    });
    $('results').scrollIntoView({behavior:'smooth',block:'start'});
  } catch(err){alert(err.message);}
}
function openBooking(f){selectedFlight=f;$('bookingFeedback').textContent='';$('bookingSummary').textContent=`${f.from} → ${f.to} | ${f.date} | ${f.departure}–${f.arrival} | ${f.cabin} | ${money(f.price)} per passenger. This demo reserves one traveler only.`;$('bookingDialog').showModal();}
$('dialogClose').onclick=()=>$('bookingDialog').close();
$('bookingForm').onsubmit=async e=>{e.preventDefault();if(!selectedFlight)return;try{const {booking}=await post('/api/bookings',{flightId:selectedFlight.id,name:$('travelerName').value,email:$('travelerEmail').value,confirm:$('demoConfirm').checked});$('bookingFeedback').innerHTML=`<div class="confirmation"><strong>Demo booking confirmed!</strong><br>Reference: <strong>${safe(booking.reference)}</strong><br>No payment collected. Save the code to manage this sample booking.</div>`;$('bookingForm').reset();}catch(err){$('bookingFeedback').textContent=err.message;$('bookingFeedback').className='feedback error';}};
$('lookupForm').onsubmit=async e=>{e.preventDefault();const ref=$('lookupRef').value,email=$('lookupEmail').value;const target=$('lookupResult');target.replaceChildren();try{const {booking}=await post('/api/bookings/lookup',{reference:ref,email});const div=document.createElement('div');div.className='confirmation';div.textContent=`${booking.reference} · ${booking.status} · ${booking.flight.from} → ${booking.flight.to} on ${booking.flight.date} · ${booking.traveler.name} · ${money(booking.totalPrice)}`;target.append(div);if(!booking.status.startsWith('Cancelled')){const btn=document.createElement('button');btn.className='outline';btn.style.color='#133257';btn.style.marginTop='12px';btn.textContent='Cancel demo booking';btn.onclick=async()=>{if(!confirm('Cancel this demo booking?'))return;try{const r=await post('/api/bookings/cancel',{reference:ref,email,confirm:true});div.textContent=`${r.booking.reference} · ${r.booking.status}`;btn.remove();}catch(err){target.append(document.createTextNode(err.message));}};target.append(btn);}}catch(err){target.textContent=err.message;target.className='feedback error';}};
const panel=$('agentPanel');function toggleAgent(open){panel.hidden=!open;if(open)$('chatInput').focus();}
$('agentFloat').onclick=()=>toggleAgent(panel.hidden);$('agentOpen').onclick=()=>toggleAgent(true);$('agentClose').onclick=()=>toggleAgent(false);
function bubble(message,role){const el=document.createElement('div');el.className=`bubble ${role}`;el.textContent=message;$('chat').append(el);$('chat').scrollTop=$('chat').scrollHeight;}
$('chatForm').onsubmit=async e=>{e.preventDefault();const msg=$('chatInput').value.trim();if(!msg)return;bubble(msg,'user');$('chatInput').value='';try{const data=await post('/api/agent',{message:msg,context:lastSearch});bubble(data.reply,'assistant');if(data.action?.type==='search' && data.action.date && data.action.from && data.action.to){await search(data.action);}if(data.action?.type==='manage'){$('manage').scrollIntoView({behavior:'smooth'});}}catch(err){bubble(`Sorry, I hit a problem: ${err.message}`,'assistant');}};
init().catch(err=>alert(`Unable to load AirX: ${err.message}`));
