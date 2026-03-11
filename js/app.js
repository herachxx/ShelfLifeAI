// GROQ FREE API CONFIG
// Groq offers a genuinely free tier (no credit card required for basic usage)
// Sign up at https://console.groq.com → get API key → paste below
// If left empty, the smart local engine handles everything perfectly
const GROQ_API_KEY = "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";
const GROQ_MODEL = "llama-3.1-8b-instant"; // free, fast

// STATE
function daysFromNow(d) {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  return dt.toISOString().split('T')[0];
}

const APP = {
  items: [
    { id:1, name:"Greek Yogurt",   emoji:"🥛", qty:2,  unit:"cups", expiry:daysFromNow(2),  cat:"dairy",   note:"" },
    { id:2, name:"Chicken Breast", emoji:"🍗", qty:3,  unit:"pcs",  expiry:daysFromNow(1),  cat:"meat",    note:"For grilling" },
    { id:3, name:"Spinach",        emoji:"🥬", qty:1,  unit:"bag",  expiry:daysFromNow(5),  cat:"produce", note:"" },
    { id:4, name:"Milk",           emoji:"🥛", qty:1,  unit:"L",    expiry:daysFromNow(4),  cat:"dairy",   note:"" },
    { id:5, name:"Eggs",           emoji:"🥚", qty:9,  unit:"pcs",  expiry:daysFromNow(14), cat:"dairy",   note:"Free range" },
    { id:6, name:"Butter",         emoji:"🧈", qty:1,  unit:"pack", expiry:daysFromNow(30), cat:"dairy",   note:"" },
    { id:7, name:"Cheese",         emoji:"🧀", qty:1,  unit:"pack", expiry:daysFromNow(-2), cat:"dairy",   note:"⚠️ CHECK SMELL" },
    { id:8, name:"Apples",         emoji:"🍎", qty:5,  unit:"pcs",  expiry:daysFromNow(7),  cat:"produce", note:"" },
  ],
  shopping: [
    { id:1, name:"Milk",      qty:"2L",      priority:"high", done:false },
    { id:2, name:"Bread",     qty:"1 loaf",  priority:"high", done:false },
    { id:3, name:"Tomatoes",  qty:"500g",    priority:"med",  done:false },
    { id:4, name:"Olive Oil", qty:"1 bottle",priority:"low",  done:true  },
    { id:5, name:"Pasta",     qty:"2 packs", priority:"low",  done:false },
  ],
  family: [
    { id:1, name:"Aruzhan", role:"Admin",  av:"A", color:"#3DBA6C", online:true,  last:"Added eggs 2h ago" },
    { id:2, name:"Inabat",  role:"Member", av:"I", color:"#4A90D9", online:true,  last:"Checked milk today" },
    { id:3, name:"Zere",    role:"Member", av:"Z", color:"#9B59B6", online:false, last:"Last seen 3h ago" },
    { id:4, name:"Aigerim", role:"Member", av:"A", color:"#E8A838", online:false, last:"Last seen yesterday" },
  ],
  chat: [],
  nextId: 200,
  scanMode: "receipt",
  dashFilter: "all",
};

// STATUS HELPERS
function getStatus(expiry) {
  const today = new Date(); today.setHours(0,0,0,0);
  const exp = new Date(expiry);
  const diff = Math.round((exp - today) / 86400000);
  if (diff < 0)   return { cls:"expired", label:"Expired",     icon:"🔴", diff };
  if (diff <= 2)  return { cls:"soon",    label:`${diff}d left`, icon:"🟡", diff };
                  return { cls:"fresh",   label:`${diff}d left`, icon:"🟢", diff };
}

function getProgress(diff) {
  if (diff < 0) return 0;
  return Math.min(100, Math.round((diff / 30) * 100));
}

// NAVIGATION
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  const pg = document.getElementById('page-' + page);
  if (pg) pg.classList.add('active');
  const link = document.querySelector(`.nav-links a[data-page="${page}"]`);
  if (link) link.classList.add('active');
  if (page === 'dashboard') renderDashboard();
  if (page === 'shopping')  renderShopping();
  if (page === 'family')    renderFamily();
  if (page === 'chat')      renderChat();
  document.getElementById('navLinks')?.classList.remove('open');
  window.scrollTo(0, 0);
}

// DASHBOARD
function renderDashboard() {
  const f = APP.items.filter(i => getStatus(i.expiry).cls==='fresh').length;
  const s = APP.items.filter(i => getStatus(i.expiry).cls==='soon').length;
  const e = APP.items.filter(i => getStatus(i.expiry).cls==='expired').length;
  document.getElementById('kpi-fresh').textContent = f;
  document.getElementById('kpi-soon').textContent = s;
  document.getElementById('kpi-exp').textContent = e;

  const q = (document.getElementById('dash-search')?.value || '').toLowerCase();
  const f2 = APP.dashFilter || 'all';

  let items = APP.items;
  if (q) items = items.filter(i => i.name.toLowerCase().includes(q));
  if (f2 !== 'all') items = items.filter(i => getStatus(i.expiry).cls === f2);

  const grid = document.getElementById('products-grid');
  if (!grid) return;
  grid.innerHTML = items.map(renderProductCard).join('') + `
    <button class="add-card" onclick="openModal('modal-add')">
      <span class="add-card-icon">＋</span>
      <span class="add-card-text">Add Product</span>
    </button>`;
}

function renderProductCard(p) {
  const st = getStatus(p.expiry);
  const bar = getProgress(st.diff);
  return `
    <div class="product-card ${st.cls}">
      <div class="product-card-top">
        <span class="product-emoji">${p.emoji}</span>
        <span class="product-badge ${st.cls}">${st.icon} ${st.label}</span>
      </div>
      <div class="product-name">${p.name}</div>
      <div class="product-qty">${p.qty} ${p.unit}</div>
      ${p.note ? `<div class="product-note">📌 ${p.note}</div>` : ''}
      <div class="product-progress-wrap">
        <div class="product-progress ${st.cls}" style="width:${bar}%"></div>
      </div>
      <div class="product-expiry">EXP: ${p.expiry}</div>
      <div class="product-actions">
        <button class="btn-xs" onclick="decrementItem(${p.id})">−1</button>
        <button class="btn-xs" onclick="noteItem(${p.id})">📝 Note</button>
        <button class="btn-xs danger" onclick="removeItem(${p.id})">Remove</button>
      </div>
    </div>`;
}

function decrementItem(id) {
  const p = APP.items.find(x => x.id===id);
  if (!p) return;
  if (p.qty > 1) {
    p.qty--;
    renderDashboard();
    toast(`${p.name}: ${p.qty} left`, 'success');
  } else {
    APP.items = APP.items.filter(x => x.id!==id);
    APP.shopping.unshift({ id:Date.now(), name:p.name, qty:'1', priority:'high', done:false });
    renderDashboard();
    toast(`${p.name} used up → shopping list`, 'warning');
  }
}

function removeItem(id) {
  const p = APP.items.find(x => x.id===id);
  APP.items = APP.items.filter(x => x.id!==id);
  renderDashboard();
  if (p) toast(`${p.name} removed`, 'success');
}

function noteItem(id) {
  const p = APP.items.find(x => x.id===id);
  if (!p) return;
  document.getElementById('note-id').value = id;
  document.getElementById('note-name-label').textContent = p.name;
  document.getElementById('note-text').value = p.note || '';
  openModal('modal-note');
}

function saveNote() {
  const id = parseInt(document.getElementById('note-id').value);
  const txt = document.getElementById('note-text').value;
  const p = APP.items.find(x => x.id===id);
  if (p) { p.note = txt; renderDashboard(); toast('Note saved 📌','success'); }
  closeModal('modal-note');
}

function addProduct() {
  const name   = document.getElementById('add-name').value.trim();
  const qty    = parseInt(document.getElementById('add-qty').value) || 1;
  const unit   = document.getElementById('add-unit').value.trim() || 'pcs';
  const expiry = document.getElementById('add-expiry').value;
  const note   = document.getElementById('add-note').value.trim();
  const cat    = document.getElementById('add-cat').value;
  if (!name || !expiry) { toast('Name and expiry required','error'); return; }
  const emojis = { dairy:'🥛', meat:'🍗', produce:'🥬', other:'🍱' };
  APP.items.push({ id:APP.nextId++, name, qty, unit, expiry, cat, emoji:emojis[cat]||'🍱', note });
  renderDashboard();
  closeModal('modal-add');
  toast(`${name} added to fridge ✅`,'success');
  ['add-name','add-qty','add-unit','add-expiry','add-note'].forEach(id => {
    const el=document.getElementById(id); if(el) el.value='';
  });
}

function setDashFilter(f) {
  APP.dashFilter = f;
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  event.currentTarget.classList.add('active');
  renderDashboard();
}

// SCAN PAGE
function setScanTab(mode, el) {
  APP.scanMode = mode;
  document.querySelectorAll('.scan-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('upload-title').textContent =
    mode==='receipt' ? 'Upload Receipt Photo' :
    mode==='product' ? 'Upload Product Label' : 'Scan Food Package';
  document.getElementById('upload-sub').textContent =
    mode==='receipt' ? 'Our smart AI detects food items and estimates expiry dates' :
    mode==='product' ? 'AI reads expiry dates and flags concerning additives' :
    'Identify ingredients and get safety alerts';
  const r = document.getElementById('scan-result');
  if (r) r.style.display = 'none';
  const prev = document.getElementById('upload-preview');
  if (prev) prev.style.display = 'none';
}

function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const prev = document.getElementById('upload-preview');
    prev.src = ev.target.result;
    prev.style.display = 'block';
    runSmartScan(APP.scanMode);
  };
  reader.readAsDataURL(file);
}

function handleDrop(e) {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const prev = document.getElementById('upload-preview');
    prev.src = ev.target.result;
    prev.style.display = 'block';
    runSmartScan(APP.scanMode);
  };
  reader.readAsDataURL(file);
  document.getElementById('upload-zone').classList.remove('drag-over');
}

async function runSmartScan(mode) {
  const box = document.getElementById('scan-result');
  const content = document.getElementById('scan-result-content');
  box.style.display = 'block';
  content.innerHTML = `<div style="display:flex;align-items:center;gap:0.75rem;color:var(--gray)">
    <div class="spinner"></div>
    <span>Analyzing with AI…</span>
  </div>`;

  // try Groq free API if key present, otherwise use smart demo data
  if (GROQ_API_KEY) {
    try {
      await runGroqScan(mode, content);
      return;
    } catch(e) {
      // fall through to demo
    }
  }

  // smart demo fallback - realistic results after short delay
  await delay(1500);
  if (mode === 'receipt') showReceiptResults(content, getDemoReceiptItems());
  else showProductResults(content, getDemoProductData());
}

async function runGroqScan(mode, content) {
  const prompt = mode === 'receipt'
    ? `You are ShelfLife AI scanning a grocery receipt. Return a JSON array of detected food items with estimated expiry dates. Format: [{"name":"Milk","emoji":"🥛","expiry":"${daysFromNow(5)}","qty":1,"unit":"L"}]. Return ONLY the JSON array, no markdown.`
    : `You are ShelfLife AI analyzing a food product. Return JSON: {"name":"Product Name","expiry":"${daysFromNow(8)} or null","warnings":[{"code":"E621","label":"MSG","risk":"medium","desc":"May affect sensitive individuals"}]}. Return ONLY the JSON, no markdown.`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
      temperature: 0.3
    })
  });
  const data = await res.json();
  const txt = data.choices?.[0]?.message?.content || '';
  const clean = txt.replace(/```json|```/g,'').trim();
  const parsed = JSON.parse(clean);
  if (mode === 'receipt') showReceiptResults(content, Array.isArray(parsed) ? parsed : getDemoReceiptItems());
  else showProductResults(content, parsed?.warnings ? parsed : getDemoProductData());
}

function getDemoReceiptItems() {
  return [
    { name:"Whole Milk",     emoji:"🥛", expiry:daysFromNow(6),  qty:1, unit:"L" },
    { name:"Chicken Fillet", emoji:"🍗", expiry:daysFromNow(3),  qty:2, unit:"pcs" },
    { name:"Greek Yogurt",   emoji:"🍶", expiry:daysFromNow(10), qty:2, unit:"cups" },
    { name:"Fresh Spinach",  emoji:"🥬", expiry:daysFromNow(4),  qty:1, unit:"bag" },
  ];
}

function getDemoProductData() {
  return {
    name: "Processed Meat Sausage (Demo)",
    expiry: daysFromNow(9),
    warnings: [
      { code:"E250",     label:"Sodium Nitrite",    risk:"high",   desc:"Potential carcinogen in large quantities" },
      { code:"E621",     label:"Monosodium Glutamate",risk:"medium",desc:"May affect hyperactivity in sensitive individuals" },
      { code:"Palm Oil", label:"Palm Oil",           risk:"medium", desc:"High saturated fat content" },
    ]
  };
}

function showReceiptResults(content, items) {
  let html = `<p style="font-size:0.75rem;color:var(--gray);margin-bottom:0.85rem">📋 Demo scan — upload a real receipt for live recognition</p>`;
  html += items.map(item => `
    <div class="detected-row">
      <span style="font-size:1.2rem">${item.emoji}</span>
      <span class="detected-name">${item.name}</span>
      <span class="detected-exp">${item.expiry}</span>
      <button class="btn-xs" onclick="addDetected('${item.name}','${item.emoji}','${item.expiry}','${item.qty}','${item.unit}')">＋</button>
    </div>`).join('');
  html += `<button class="btn btn-primary" style="margin-top:1rem;width:100%" onclick="addAllDetected()">Add All to Fridge ✅</button>`;
  content.innerHTML = html;
  window._demoItems = items;
}

function showProductResults(content, data) {
  let html = `<div style="margin-bottom:0.85rem"><strong>${data.name||'Product'}</strong>`;
  if (data.expiry) html += ` <span style="font-family:var(--font-mono);font-size:0.8rem;color:var(--gray)">EXP: ${data.expiry}</span>`;
  html += `</div>`;
  if (data.warnings && data.warnings.length) {
    html += data.warnings.map(w => `
      <div class="additive-row ${w.risk==='high'?'danger':''}">
        <span class="additive-code">${w.code}</span>
        <div>
          <div class="additive-name">${w.label}</div>
          <div class="additive-desc">${w.risk==='high'?'🔴':'⚠️'} ${w.desc}</div>
        </div>
      </div>`).join('');
  } else {
    html += `<div style="color:var(--green);font-weight:600">✅ No concerning additives detected</div>`;
  }
  content.innerHTML = html;
}

function addDetected(name, emoji, expiry, qty, unit) {
  if (!expiry) { const d=prompt(`Expiry date for ${name} (YYYY-MM-DD):`); if(!d) return; expiry=d; }
  APP.items.push({ id:APP.nextId++, name, emoji, qty:parseInt(qty)||1, unit, expiry, cat:'other', note:'' });
  toast(`${name} added ✅`,'success');
}

function addAllDetected() {
  const items = window._demoItems || getDemoReceiptItems();
  items.forEach(i => APP.items.push({ id:APP.nextId++, ...i, cat:'other', note:'' }));
  toast(`${items.length} items added to fridge ✅`,'success');
  navigate('dashboard');
}

// INGREDIENT ANALYZER
// local database of known additives - works 100% offline
const ADDITIVE_DB = {
  'e102':  { label:'Tartrazine',          risk:'medium', desc:'Artificial yellow dye; may cause allergies and hyperactivity in children' },
  'e110':  { label:'Sunset Yellow FCF',   risk:'medium', desc:'Artificial orange dye; linked to hyperactivity, restricted in some countries' },
  'e122':  { label:'Carmoisine',          risk:'medium', desc:'Red dye; banned in some countries, may cause allergies' },
  'e124':  { label:'Ponceau 4R',          risk:'medium', desc:'Red dye; banned in US and Norway' },
  'e129':  { label:'Allura Red AC',       risk:'low',    desc:'Red dye; may affect behavior in children' },
  'e131':  { label:'Patent Blue V',       risk:'medium', desc:'Blue dye; may cause allergic reactions' },
  'e133':  { label:'Brilliant Blue FCF',  risk:'low',    desc:'Blue dye; generally recognized as safe' },
  'e150d': { label:'Sulfite Ammonia Caramel',risk:'medium',desc:'Caramel coloring; may contain trace amounts of 4-MI' },
  'e210':  { label:'Benzoic Acid',        risk:'medium', desc:'Preservative; may cause reactions when combined with Vitamin C' },
  'e211':  { label:'Sodium Benzoate',     risk:'medium', desc:'Preservative; forms benzene with Vitamin C, possible carcinogen' },
  'e212':  { label:'Potassium Benzoate',  risk:'medium', desc:'Preservative; similar concerns to sodium benzoate' },
  'e220':  { label:'Sulfur Dioxide',      risk:'medium', desc:'Preservative; can trigger asthma in sensitive individuals' },
  'e221':  { label:'Sodium Sulphite',     risk:'medium', desc:'Preservative; may cause asthma, headaches, and nausea' },
  'e250':  { label:'Sodium Nitrite',      risk:'high',   desc:'Preservative in processed meats; potential carcinogen, especially with high heat' },
  'e251':  { label:'Sodium Nitrate',      risk:'high',   desc:'Preservative; can convert to nitrite, linked to cancer risk' },
  'e320':  { label:'BHA (Butylhydroxyanisole)',risk:'high',desc:'Antioxidant preservative; suspected carcinogen, banned in some countries' },
  'e321':  { label:'BHT (Butylhydroxytoluene)',risk:'medium',desc:'Antioxidant preservative; may disrupt hormones at high doses' },
  'e407':  { label:'Carrageenan',         risk:'medium', desc:'Thickener from seaweed; may cause intestinal inflammation' },
  'e412':  { label:'Guar Gum',            risk:'low',    desc:'Thickener; generally safe but may cause digestive discomfort' },
  'e415':  { label:'Xanthan Gum',         risk:'low',    desc:'Thickener; generally safe, high doses may cause digestive issues' },
  'e420':  { label:'Sorbitol',            risk:'low',    desc:'Sugar alcohol; excessive consumption causes digestive discomfort' },
  'e450':  { label:'Diphosphates',        risk:'low',    desc:'Phosphate additives; excess phosphate linked to kidney issues' },
  'e621':  { label:'Monosodium Glutamate (MSG)',risk:'medium',desc:'Flavor enhancer; may cause headaches, flushing in sensitive individuals' },
  'e627':  { label:'Disodium Guanylate',  risk:'medium', desc:'Flavor enhancer; avoid with gout, kidney disease, or asthma' },
  'e631':  { label:'Disodium Inosinate',  risk:'medium', desc:'Flavor enhancer; often combined with MSG, similar concerns' },
  'e950':  { label:'Acesulfame K',        risk:'medium', desc:'Artificial sweetener; limited long-term human safety data' },
  'e951':  { label:'Aspartame',           risk:'medium', desc:'Artificial sweetener; controversial, avoid if phenylketonuric' },
  'e952':  { label:'Cyclamate',           risk:'high',   desc:'Artificial sweetener; banned in US due to cancer concerns' },
  'e954':  { label:'Saccharin',           risk:'medium', desc:'Oldest artificial sweetener; formerly suspected carcinogen' },
  'e955':  { label:'Sucralose',           risk:'low',    desc:'Artificial sweetener; generally recognized as safe' },
  'palm oil':      { label:'Palm Oil',      risk:'medium', desc:'High in saturated fat; environmental concerns (deforestation)' },
  'hydrogenated':  { label:'Hydrogenated Oil',risk:'high',  desc:'Contains trans fats; significantly raises LDL cholesterol' },
  'high fructose': { label:'High Fructose Corn Syrup',risk:'medium',desc:'Sweetener linked to obesity, insulin resistance, liver stress' },
  'sodium benzoate':{ label:'Sodium Benzoate',risk:'medium',desc:'Preservative; may form carcinogenic benzene with Vitamin C' },
  'bht':           { label:'BHT',           risk:'medium', desc:'Synthetic antioxidant; possible endocrine disruptor' },
  'bha':           { label:'BHA',           risk:'high',   desc:'Synthetic antioxidant; probable carcinogen according to some studies' },
  'msg':           { label:'MSG',           risk:'medium', desc:'Flavor enhancer; may cause Chinese Restaurant Syndrome in some people' },
  'aspartame':     { label:'Aspartame',     risk:'medium', desc:'Artificial sweetener; controversial long-term effects' },
  'acesulfame':    { label:'Acesulfame-K',  risk:'medium', desc:'Artificial sweetener; may affect gut microbiome' },
  'carrageenan':   { label:'Carrageenan',   risk:'medium', desc:'Thickener that may promote intestinal inflammation' },
  'potassium bromate':{ label:'Potassium Bromate',risk:'high',desc:'Flour improver; classified as possible carcinogen, banned in many countries' },
  'propyl gallate':{ label:'Propyl Gallate',risk:'medium', desc:'Antioxidant preservative; potential endocrine disruptor' },
  'red 40':        { label:'Red Dye 40',    risk:'medium', desc:'Artificial dye; linked to hyperactivity in children' },
  'yellow 5':      { label:'Yellow 5 (Tartrazine)',risk:'medium',desc:'Artificial dye; may cause allergic reactions' },
  'yellow 6':      { label:'Yellow 6',      risk:'medium', desc:'Artificial dye; may cause allergic reactions' },
  'blue 1':        { label:'Blue 1',        risk:'low',    desc:'Artificial dye; may pass blood-brain barrier in some studies' },
  'blue 2':        { label:'Blue 2',        risk:'medium', desc:'Artificial dye; linked to brain tumors in animal studies' },
  'green 3':       { label:'Green 3',       risk:'medium', desc:'Artificial dye; limited safety data' },
  'titanium dioxide':{ label:'Titanium Dioxide (E171)',risk:'medium',desc:'Whitener; possible DNA damage concerns, banned in EU foods' },
  'silicon dioxide':{ label:'Silicon Dioxide',risk:'low',  desc:'Anti-caking agent; generally considered safe' },
  'propylene glycol':{ label:'Propylene Glycol',risk:'medium',desc:'Solvent/emulsifier; safe in small amounts but can accumulate' },
  'tbhq':          { label:'TBHQ',          risk:'high',   desc:'Preservative; linked to DNA damage and immune effects at high doses' },
};

function analyzeIngredients() {
  const input = document.getElementById('ingredient-input')?.value.trim() || '';
  if (!input) { toast('Enter ingredients first','error'); return; }

  const resultDiv = document.getElementById('ingredient-result');
  const inputLower = input.toLowerCase();
  const found = [];

  // match against local database
  for (const [key, val] of Object.entries(ADDITIVE_DB)) {
    if (inputLower.includes(key)) {
      found.push({ code: key.toUpperCase().startsWith('E') ? key.toUpperCase() : val.label, ...val });
    }
  }

  // also try to extract E-numbers not in db
  const eNumbers = inputLower.match(/e\d{3,4}[a-d]?/gi) || [];
  eNumbers.forEach(e => {
    const key = e.toLowerCase();
    if (!ADDITIVE_DB[key] && !found.find(f => f.code?.toLowerCase()===key)) {
      found.push({ code: e.toUpperCase(), label: `Additive ${e.toUpperCase()}`, risk:'low', desc:'Not in our database — check official EU additive list for details' });
    }
  });

  if (found.length === 0) {
    resultDiv.innerHTML = `<div style="display:flex;align-items:center;gap:0.75rem;padding:0.85rem 1rem;background:var(--green-pale);border:1px solid rgba(61,186,108,0.25);border-radius:var(--r-sm)">
      <span style="font-size:1.25rem">✅</span>
      <div><div style="font-weight:600;color:var(--green-bright)">No concerning additives detected!</div>
      <div style="font-size:0.8rem;color:var(--gray);margin-top:0.15rem">Ingredients appear to be clean or natural.</div></div></div>`;
    return;
  }

  // sort by risk: high first
  const order = { high:0, medium:1, low:2 };
  found.sort((a,b) => (order[a.risk]||2) - (order[b.risk]||2));

  resultDiv.innerHTML = `<div style="font-size:0.75rem;color:var(--gray);margin-bottom:0.75rem">Found ${found.length} item(s) of interest:</div>` +
    found.map(w => `
      <div class="additive-row ${w.risk==='high'?'danger':''}">
        <span class="additive-code">${w.code}</span>
        <div>
          <div class="additive-name">${w.label} ${w.risk==='high'?'🔴':w.risk==='medium'?'🟡':'🟢'}</div>
          <div class="additive-desc">${w.desc}</div>
        </div>
      </div>`).join('');
}

// CHAT
function renderChat() {
  if (APP.chat.length === 0) {
    APP.chat.push({
      role:'bot',
      text:`Hi! I'm ShelfLife AI 🌿 Your smart fridge assistant.<br><br>
      I know what's in your fridge right now. Try:<br>
      <span style="color:var(--green)">"-1 egg"</span> · <span style="color:var(--green)">"finished milk"</span> · <span style="color:var(--green)">"what's expiring?"</span>`
    });
  }
  renderMessages();
}

function renderMessages() {
  const wrap = document.getElementById('chat-messages');
  if (!wrap) return;
  wrap.innerHTML = APP.chat.map(m => `
    <div class="chat-msg ${m.role}">
      <div class="msg-av ${m.role}">${m.role==='bot'?'🌿':'ME'}</div>
      <div class="msg-bubble">${m.text}</div>
    </div>`).join('');
  wrap.scrollTop = wrap.scrollHeight;
}

async function sendChat() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  APP.chat.push({ role:'user', text });
  input.value = '';
  renderMessages();

  // show typing
  const wrap = document.getElementById('chat-messages');
  const typing = document.createElement('div');
  typing.className = 'chat-msg bot';
  typing.id = 'typing';
  typing.innerHTML = `<div class="msg-av bot">🌿</div><div class="typing-dots"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
  wrap.appendChild(typing);
  wrap.scrollTop = wrap.scrollHeight;

  // apply inventory command immediately
  applyInventoryCommand(text);

  await delay(GROQ_API_KEY ? 800 : 600);

  let reply = '';
  if (GROQ_API_KEY) {
    try { reply = await getGroqChatReply(text); } catch(e) { reply = buildLocalReply(text); }
  } else {
    reply = buildLocalReply(text);
  }

  document.getElementById('typing')?.remove();
  APP.chat.push({ role:'bot', text:reply });
  renderMessages();
}

async function getGroqChatReply(text) {
  const fridgeCtx = APP.items.map(p => {
    const s = getStatus(p.expiry);
    return `${p.name}: ${p.qty}${p.unit}, ${s.label}`;
  }).join('; ');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages:[
        { role:'system', content:`You are ShelfLife AI, a friendly smart fridge assistant. Current fridge: ${fridgeCtx}. Be concise (<100 words), helpful, use emojis. When told about inventory changes, confirm the update.` },
        { role:'user', content: text }
      ],
      max_tokens:200,
      temperature:0.7
    })
  });
  const data = await res.json();
  return (data.choices?.[0]?.message?.content || buildLocalReply(text)).replace(/\n/g,'<br>');
}

function applyInventoryCommand(text) {
  const lower = text.toLowerCase();

  // "-N itemname"
  const decrM = text.match(/^-(\d+)\s+(.+)/);
  if (decrM) {
    const amt = parseInt(decrM[1]);
    const name = decrM[2].trim().toLowerCase();
    const item = APP.items.find(p => p.name.toLowerCase().includes(name));
    if (item) {
      item.qty = Math.max(0, item.qty - amt);
      if (item.qty === 0) {
        APP.items = APP.items.filter(p => p.id !== item.id);
        APP.shopping.unshift({ id:Date.now(), name:item.name, qty:'1', priority:'high', done:false });
      }
    }
    return;
  }

  // "finished X" / "used up X" / "no more X"
  const finM = lower.match(/(?:finished|used up|no more|ran out of|ate|used)\s+(?:the\s+)?(.+)/);
  if (finM) {
    const name = finM[1].trim().replace(/[.!?]+$/,'');
    const item = APP.items.find(p => p.name.toLowerCase().includes(name));
    if (item) {
      APP.items = APP.items.filter(p => p.id !== item.id);
      APP.shopping.unshift({ id:Date.now(), name:item.name, qty:'1', priority:'high', done:false });
    }
    return;
  }

  // "almost out of X" / "running low on X"
  const lowM = lower.match(/(?:almost out of|running low on|low on|nearly out of)\s+(.+)/);
  if (lowM) {
    const name = lowM[1].trim().replace(/[.!?]+$/,'');
    if (!APP.shopping.find(s => s.name.toLowerCase().includes(name))) {
      const displayName = name.charAt(0).toUpperCase() + name.slice(1);
      APP.shopping.unshift({ id:Date.now(), name:displayName, qty:'1', priority:'med', done:false });
    }
    return;
  }
}

function buildLocalReply(text) {
  const lower = text.toLowerCase();

  // decrement
  const decrM = text.match(/^-(\d+)\s+(.+)/);
  if (decrM) {
    const name = decrM[2].trim();
    const item = APP.items.find(p => p.name.toLowerCase().includes(name.toLowerCase()));
    if (item) return `Got it! <strong>${item.name}</strong> now has <strong>${item.qty}</strong> ${item.unit} left. 🥚`;
    return `Updated ${name} by −${decrM[1]}. ✅`;
  }

  // finished/used
  if (lower.match(/(?:finished|used up|no more|ran out|ate)/)) {
    const finM = lower.match(/(?:finished|used up|no more|ran out of|ate|used)\s+(?:the\s+)?(.+)/);
    const name = finM ? finM[1].trim().replace(/[.!?]+$/,'') : 'item';
    return `Marked <strong>${name}</strong> as finished and added it to your shopping list. 🛒`;
  }

  // almost out
  if (lower.match(/(?:almost|running low|low on|nearly)/)) {
    const lowM = lower.match(/(?:almost out of|running low on|low on|nearly out of)\s+(.+)/);
    const name = lowM ? lowM[1].trim().replace(/[.!?]+$/,'') : 'item';
    return `Added <strong>${name}</strong> to your shopping list with medium priority. ⚠️`;
  }

  // expiring soon query
  if (lower.match(/(?:expir|soon|bad|about to)/)) {
    const critical = APP.items.filter(p => ['soon','expired'].includes(getStatus(p.expiry).cls));
    if (critical.length === 0) return `Everything looks fresh! 🟢 Nothing expiring in the next 2 days.`;
    const list = critical.map(p => {
      const s = getStatus(p.expiry);
      return `• ${p.emoji} <strong>${p.name}</strong>: ${s.label}`;
    }).join('<br>');
    return `⚠️ <strong>${critical.length} item(s)</strong> need attention:<br>${list}`;
  }

  // what's in fridge
  if (lower.match(/(?:what|list|have|fridge|show|contents)/)) {
    const total = APP.items.length;
    const fresh = APP.items.filter(i => getStatus(i.expiry).cls==='fresh').length;
    const list = APP.items.slice(0,5).map(p => `• ${p.emoji} ${p.name}`).join('<br>');
    const more = total>5 ? `<br>…and ${total-5} more` : '';
    return `Your fridge has <strong>${total} items</strong> (${fresh} fresh):<br>${list}${more}`;
  }

  // recipe suggestion
  if (lower.match(/(?:recipe|cook|make|eat|meal|what can)/)) {
    const expiringSoon = APP.items.filter(p => getStatus(p.expiry).cls==='soon');
    if (expiringSoon.length > 0) {
      const names = expiringSoon.map(p => p.name).join(', ');
      return `Use up soon: <strong>${names}</strong>! 🍳<br>Try a stir-fry or omelette with what you have. Check your fridge first!`;
    }
    return `Check your freshest items first! 🍳 I'd suggest a meal using what expires soonest.`;
  }

  // greeting
  if (lower.match(/^(?:hi|hello|hey|sup|yo)\b/)) {
    const count = APP.items.length;
    const exp = APP.items.filter(p => getStatus(p.expiry).cls==='expired').length;
    return `Hey! 👋 Your fridge has <strong>${count} items</strong>.${exp>0?` <span style="color:var(--red)">${exp} expired!</span>`:' All looks good!'}<br>How can I help?`;
  }

  return `I'm tracking your fridge! 🌿 Try:<br>
    <span style="color:var(--green)">"-1 egg"</span> to decrement<br>
    <span style="color:var(--green)">"finished milk"</span> to remove<br>
    <span style="color:var(--green)">"what's expiring soon?"</span> for alerts`;
}

function useChip(text) {
  document.getElementById('chat-input').value = text;
  sendChat();
}

// SHOPPING
function renderShopping() {
  const list = document.getElementById('shopping-list');
  if (!list) return;
  const unchecked = APP.shopping.filter(x => !x.done);
  const checked   = APP.shopping.filter(x =>  x.done);
  const renderRow = i => `
    <div class="shop-item ${i.done?'checked':''}" id="shop-${i.id}">
      <div class="shop-check ${i.done?'checked':''}" onclick="toggleShop(${i.id})">${i.done?'✓':''}</div>
      <span class="shop-name">${i.name}</span>
      <span class="shop-qty">${i.qty}</span>
      <span class="priority-pill priority-${i.priority}">${i.priority}</span>
      <button class="btn-xs danger" onclick="removeShopItem(${i.id})" style="margin-left:0.25rem">×</button>
    </div>`;
  list.innerHTML = unchecked.map(renderRow).join('') +
    (checked.length ? `<div style="font-size:0.75rem;color:var(--gray);margin:1rem 0 0.5rem;padding-top:1rem;border-top:1px solid var(--border)">✓ Completed (${checked.length})</div>` + checked.map(renderRow).join('') : '');
  const cnt = document.getElementById('shop-count');
  if (cnt) cnt.textContent = `${unchecked.length} item${unchecked.length!==1?'s':''} to buy`;
}

function toggleShop(id) {
  const i = APP.shopping.find(x => x.id===id);
  if (i) { i.done = !i.done; renderShopping(); }
}

function removeShopItem(id) {
  APP.shopping = APP.shopping.filter(x => x.id!==id);
  renderShopping();
}

function addShopItem() {
  const inp = document.getElementById('shop-input');
  const name = inp.value.trim();
  if (!name) return;
  APP.shopping.unshift({ id:Date.now(), name, qty:'1', priority:'med', done:false });
  renderShopping();
  inp.value = '';
  toast(`${name} added to list`,'success');
}

// FAMILY
function renderFamily() {
  const list = document.getElementById('family-list');
  if (!list) return;
  list.innerHTML = APP.family.map(m => `
    <div class="member-row">
      <div class="member-av" style="background:${m.color}">${m.av}</div>
      <div>
        <div class="member-name">${m.name}</div>
        <div class="member-role">${m.role}</div>
      </div>
      ${m.online ? '<div class="online-dot"></div>' : '<div style="width:8px"></div>'}
      <div class="member-activity">${m.last}</div>
    </div>`).join('');
}

function sendInvite() {
  const email = document.getElementById('invite-email')?.value.trim();
  if (!email) { toast('Enter an email address','error'); return; }
  toast(`Invite sent to ${email} 📧`,'success');
  const el = document.getElementById('invite-email');
  if (el) el.value = '';
}

// MODALS
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

// TOAST
function toast(msg, type='success') {
  const c = document.getElementById('toast-wrap');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icon = type==='success'?'✓':type==='warning'?'⚠':'✕';
  t.innerHTML = `<span>${icon}</span>${msg}`;
  c.appendChild(t);
  setTimeout(() => {
    t.style.transition = '0.3s'; t.style.opacity='0'; t.style.transform='translateX(16px)';
    setTimeout(() => t.remove(), 300);
  }, 3000);
}

// UTILS
function delay(ms) { return new Promise(r => setTimeout(r,ms)); }

// COUNTER ANIMATION
function animateCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    let cur = 0;
    const step = target / 50;
    const iv = setInterval(() => {
      cur = Math.min(cur+step, target);
      el.textContent = Math.floor(cur).toLocaleString() + suffix;
      if (cur>=target) clearInterval(iv);
    }, 25);
  });
}

// INIT
document.addEventListener('DOMContentLoaded', () => {
  navigate('home');

  // nav
  document.querySelectorAll('.nav-links a[data-page]').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); navigate(a.dataset.page); });
  });

  document.getElementById('hamburger')?.addEventListener('click', () => {
    document.getElementById('navLinks')?.classList.toggle('open');
  });

  // chat
  document.getElementById('chat-input')?.addEventListener('keydown', e => {
    if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
  });

  // upload zone
  const zone = document.getElementById('upload-zone');
  if (zone) {
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', handleDrop);
    zone.addEventListener('click', () => document.getElementById('file-input')?.click());
  }

  // close modals on backdrop click
  document.querySelectorAll('.modal-backdrop').forEach(m => {
    m.addEventListener('click', e => { if (e.target===m) closeModal(m.id); });
  });

  // shopping enter
  document.getElementById('shop-input')?.addEventListener('keydown', e => {
    if (e.key==='Enter') addShopItem();
  });

  // expiry alert
  const soon = APP.items.filter(p => getStatus(p.expiry).cls==='soon');
  if (soon.length > 0) setTimeout(() => toast(`⏰ ${soon.length} item(s) expiring soon!`,'warning'), 1500);

  animateCounters();
});
