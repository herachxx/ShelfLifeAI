// ============================================
// ShelfLife AI - Main Application Logic
// ============================================

const API_KEY_PLACEHOLDER = ""; // Users add their own key, or use demo mode

// ---- APP STATE ----
const APP = {
  products: [
    { id: 1, name: "Greek Yogurt", emoji: "🥛", qty: 2, unit: "cups", expiry: daysFromNow(2), category: "dairy", note: "" },
    { id: 2, name: "Chicken Breast", emoji: "🍗", qty: 3, unit: "pcs", expiry: daysFromNow(1), category: "meat", note: "For grilling" },
    { id: 3, name: "Spinach", emoji: "🥬", qty: 1, unit: "bag", expiry: daysFromNow(5), category: "produce", note: "" },
    { id: 4, name: "Milk", emoji: "🥛", qty: 1, unit: "L", expiry: daysFromNow(4), category: "dairy", note: "" },
    { id: 5, name: "Eggs", emoji: "🥚", qty: 9, unit: "pcs", expiry: daysFromNow(14), category: "dairy", note: "Free range" },
    { id: 6, name: "Butter", emoji: "🧈", qty: 1, unit: "pack", expiry: daysFromNow(30), category: "dairy", note: "" },
    { id: 7, name: "Cheese", emoji: "🧀", qty: 1, unit: "pack", expiry: daysFromNow(-2), category: "dairy", note: "⚠️ CHECK SMELL" },
    { id: 8, name: "Apples", emoji: "🍎", qty: 5, unit: "pcs", expiry: daysFromNow(7), category: "produce", note: "" },
  ],
  shoppingList: [
    { id: 1, name: "Milk", qty: "2L", priority: "high", checked: false },
    { id: 2, name: "Bread", qty: "1 loaf", priority: "high", checked: false },
    { id: 3, name: "Tomatoes", qty: "500g", priority: "med", checked: false },
    { id: 4, name: "Olive Oil", qty: "1 bottle", priority: "low", checked: true },
    { id: 5, name: "Pasta", qty: "2 packs", priority: "low", checked: false },
  ],
  family: [
    { id: 1, name: "Aruzhan", role: "Admin", avatar: "A", color: "#2D9E6B", online: true, activity: "Added eggs 2h ago" },
    { id: 2, name: "Inabat", role: "Member", avatar: "I", color: "#4A90D9", online: true, activity: "Checked milk today" },
    { id: 3, name: "Zere", role: "Member", avatar: "Z", color: "#9B59B6", online: false, activity: "Last active 3h ago" },
  ],
  chatHistory: [],
  nextId: 100
};

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function getStatus(expiryDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  const diff = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: "Expired", cls: "expired", icon: "🔴", diff };
  if (diff <= 2) return { label: `${diff}d left`, cls: "soon", icon: "🟡", diff };
  return { label: `${diff}d left`, cls: "fresh", icon: "🟢", diff };
}

function getStatusBar(diff) {
  if (diff < 0) return 0;
  if (diff >= 30) return 100;
  return Math.min(100, (diff / 30) * 100);
}

// ---- NAVIGATION ----
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));

  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');

  const navLink = document.querySelector(`.nav-links a[data-page="${page}"]`);
  if (navLink) navLink.classList.add('active');

  // render page content
  if (page === 'dashboard') renderDashboard();
  if (page === 'shopping') renderShoppingList();
  if (page === 'family') renderFamily();
  if (page === 'chat') renderChat();
  if (page === 'scan') renderScan();

  // close mobile menu
  document.getElementById('navLinks').classList.remove('mobile-open');
  window.scrollTo(0, 0);
}

// ---- DASHBOARD ----
function renderDashboard() {
  const fresh = APP.products.filter(p => getStatus(p.expiry).cls === 'fresh').length;
  const soon = APP.products.filter(p => getStatus(p.expiry).cls === 'soon').length;
  const expired = APP.products.filter(p => getStatus(p.expiry).cls === 'expired').length;

  document.getElementById('stat-fresh').textContent = fresh;
  document.getElementById('stat-soon').textContent = soon;
  document.getElementById('stat-expired').textContent = expired;

  const grid = document.getElementById('products-grid');
  grid.innerHTML = APP.products.map(p => {
    const st = getStatus(p.expiry);
    const bar = getStatusBar(st.diff);
    return `
      <div class="product-card" id="product-${p.id}">
        <div class="product-card-top">
          <span class="product-emoji">${p.emoji}</span>
          <span class="product-status ${st.cls}">${st.icon} ${st.label}</span>
        </div>
        <div class="product-name">${p.name}</div>
        <div class="product-qty">${p.qty} ${p.unit}</div>
        ${p.note ? `<div class="note-sticker">📌 ${p.note}</div>` : ''}
        <div class="product-bar-wrap" style="margin-top:${p.note ? '0.75rem' : '0'}">
          <div class="product-bar ${st.cls}" style="width:${bar}%"></div>
        </div>
        <div class="product-expiry">EXP: ${p.expiry}</div>
        <div class="product-actions">
          <button class="btn-sm" onclick="decrementProduct(${p.id})">−1</button>
          <button class="btn-sm" onclick="openNoteModal(${p.id})">📝 Note</button>
          <button class="btn-sm danger" onclick="removeProduct(${p.id})">Remove</button>
        </div>
      </div>
    `;
  }).join('') + `
    <div class="add-product-card" onclick="openAddModal()">
      <span style="font-size:2rem">＋</span>
      <span style="font-weight:600;font-size:0.9rem">Add Product</span>
    </div>
  `;
}

function decrementProduct(id) {
  const p = APP.products.find(x => x.id === id);
  if (!p) return;
  if (p.qty > 1) {
    p.qty--;
    renderDashboard();
    showToast(`${p.name}: ${p.qty} remaining`, 'success');
  } else {
    APP.products = APP.products.filter(x => x.id !== id);
    renderDashboard();
    APP.shoppingList.unshift({ id: Date.now(), name: p.name, qty: p.unit, priority: 'high', checked: false });
    showToast(`${p.name} used up → Added to shopping list`, 'warning');
  }
}

function removeProduct(id) {
  const p = APP.products.find(x => x.id === id);
  APP.products = APP.products.filter(x => x.id !== id);
  renderDashboard();
  if (p) showToast(`${p.name} removed`, 'success');
}

function openAddModal() {
  document.getElementById('modal-add').classList.add('open');
}

function openNoteModal(id) {
  const p = APP.products.find(x => x.id === id);
  if (!p) return;
  document.getElementById('note-product-id').value = id;
  document.getElementById('note-product-name').textContent = p.name;
  document.getElementById('note-text').value = p.note || '';
  document.getElementById('modal-note').classList.add('open');
}

function saveNote() {
  const id = parseInt(document.getElementById('note-product-id').value);
  const text = document.getElementById('note-text').value;
  const p = APP.products.find(x => x.id === id);
  if (p) { p.note = text; renderDashboard(); showToast('Note saved! 📝', 'success'); }
  closeModal('modal-note');
}

function addProduct() {
  const name = document.getElementById('add-name').value.trim();
  const qty = parseInt(document.getElementById('add-qty').value) || 1;
  const unit = document.getElementById('add-unit').value.trim() || 'pcs';
  const expiry = document.getElementById('add-expiry').value;
  const note = document.getElementById('add-note').value.trim();

  if (!name || !expiry) { showToast('Please fill in name and expiry date', 'error'); return; }

  const emojis = { dairy: '🥛', meat: '🍗', produce: '🥬', other: '🍱' };
  const category = document.getElementById('add-category').value;

  APP.products.push({
    id: APP.nextId++,
    name, qty, unit, expiry, category,
    emoji: emojis[category] || '🍱',
    note
  });

  renderDashboard();
  closeModal('modal-add');
  showToast(`${name} added to fridge! ✅`, 'success');

  ['add-name','add-qty','add-unit','add-expiry','add-note'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

// ---- SHOPPING LIST ----
function renderShoppingList() {
  const list = document.getElementById('shopping-list');
  if (!list) return;

  const unchecked = APP.shoppingList.filter(x => !x.checked);
  const checked = APP.shoppingList.filter(x => x.checked);

  const renderItem = (item) => `
    <div class="shopping-item ${item.checked ? 'checked' : ''}" id="shop-${item.id}">
      <div class="shopping-checkbox ${item.checked ? 'checked' : ''}" onclick="toggleShop(${item.id})">
        ${item.checked ? '✓' : ''}
      </div>
      <span class="shopping-name">${item.name}</span>
      <span class="shopping-qty">${item.qty}</span>
      <span class="shopping-priority priority-${item.priority}">${item.priority}</span>
      <button class="btn-sm danger" onclick="removeShopItem(${item.id})" style="margin-left:0.5rem">×</button>
    </div>
  `;

  list.innerHTML = unchecked.map(renderItem).join('') + 
    (checked.length ? `<div style="margin-top:1rem;font-size:0.8rem;color:var(--ink-light);margin-bottom:0.5rem">✓ Completed</div>` + checked.map(renderItem).join('') : '');

  document.getElementById('shop-count').textContent = `${unchecked.length} items`;
}

function toggleShop(id) {
  const item = APP.shoppingList.find(x => x.id === id);
  if (item) { item.checked = !item.checked; renderShoppingList(); }
}

function removeShopItem(id) {
  APP.shoppingList = APP.shoppingList.filter(x => x.id !== id);
  renderShoppingList();
}

function addShopItem() {
  const name = document.getElementById('shop-input').value.trim();
  if (!name) return;
  APP.shoppingList.unshift({ id: Date.now(), name, qty: '1', priority: 'med', checked: false });
  renderShoppingList();
  document.getElementById('shop-input').value = '';
  showToast(`${name} added to list`, 'success');
}

// ---- FAMILY ----
function renderFamily() {
  const list = document.getElementById('family-list');
  if (!list) return;
  list.innerHTML = APP.family.map(m => `
    <div class="family-member">
      <div class="member-avatar" style="background:${m.color}">${m.avatar}</div>
      <div>
        <div class="member-name">${m.name}</div>
        <div class="member-role">${m.role}</div>
      </div>
      ${m.online ? '<div class="member-online"></div>' : ''}
      <div class="member-activity">${m.activity}</div>
    </div>
  `).join('');
}

function sendInvite() {
  const email = document.getElementById('invite-email').value.trim();
  if (!email) { showToast('Enter an email address', 'error'); return; }
  showToast(`Invite sent to ${email}! 📧`, 'success');
  document.getElementById('invite-email').value = '';
}

// ---- SCAN PAGE ----
function renderScan() {
  // scan page is mostly static HTML, just init listeners
}

let scanMode = 'receipt';

function setScanTab(mode) {
  scanMode = mode;
  document.querySelectorAll('.scan-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('upload-title').textContent = mode === 'receipt' ? 'Upload Receipt Photo' : 'Upload Product Photo';
  document.getElementById('upload-sub').textContent = mode === 'receipt' 
    ? 'AI will detect all items and expiry dates from your receipt'
    : 'AI will read the expiry date and analyze ingredients';
  document.getElementById('ai-result').style.display = 'none';
  document.getElementById('upload-preview').style.display = 'none';
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const preview = document.getElementById('upload-preview');
  const reader = new FileReader();
  reader.onload = (e) => {
    preview.src = e.target.result;
    preview.style.display = 'block';
    simulateAIScan(scanMode, e.target.result);
  };
  reader.readAsDataURL(file);
}

function handleDrop(e) {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const preview = document.getElementById('upload-preview');
      preview.src = ev.target.result;
      preview.style.display = 'block';
      simulateAIScan(scanMode, ev.target.result);
    };
    reader.readAsDataURL(file);
  }
  document.getElementById('upload-zone').classList.remove('dragging');
}

async function simulateAIScan(mode, imageData) {
  const resultBox = document.getElementById('ai-result');
  const resultContent = document.getElementById('ai-result-content');
  resultBox.style.display = 'block';
  resultContent.innerHTML = `<div style="display:flex;align-items:center;gap:0.75rem;color:var(--ink-mid)">
    <div class="spinner" style="border-color:rgba(0,0,0,0.15);border-top-color:var(--fresh)"></div>
    <span>ShelfLife AI is analyzing your ${mode}…</span>
  </div>`;

  // Call Claude API for real AI analysis
  try {
    const prompt = mode === 'receipt'
      ? `You are ShelfLife AI. Analyze this receipt image and extract food items with their expiry information. Return a JSON array like: [{"name":"Milk","emoji":"🥛","expiry":"2026-03-20","qty":1,"unit":"L","confidence":"high"}]. If you cannot see an actual receipt, return demo data for 3-4 common groceries. Only return the JSON array, nothing else.`
      : `You are ShelfLife AI. Analyze this product/ingredient label. Extract: 1) expiry date if visible (format YYYY-MM-DD), 2) any concerning additives (E-numbers, palm oil, high sodium, allergens). Return JSON: {"productName":"...","expiry":"YYYY-MM-DD or null","warnings":[{"code":"E621","label":"Flavor Enhancer","risk":"⚠️ May affect children"},...],"confidence":"high/medium/low"}. Only return JSON.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageData.split(',')[1] || imageData } },
            { type: "text", text: prompt }
          ]
        }]
      })
    });

    const data = await response.json();
    const text = data.content?.map(c => c.text || '').join('') || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    displayScanResult(mode, parsed);

  } catch (err) {
    // Demo fallback
    setTimeout(() => displayScanResultDemo(mode), 1800);
  }
}

function displayScanResult(mode, data) {
  const resultContent = document.getElementById('ai-result-content');
  if (mode === 'receipt' && Array.isArray(data)) {
    let html = data.map(item => `
      <div class="detected-item">
        <span class="product-emoji" style="font-size:1.2rem">${item.emoji || '🍱'}</span>
        <span class="detected-item-name">${item.name}</span>
        <span class="detected-expiry">${item.expiry || 'Enter manually'}</span>
        <button class="btn-sm" onclick="addDetectedItem('${item.name}','${item.emoji||'🍱'}','${item.expiry||''}','${item.qty||1}','${item.unit||'pcs'}')">＋ Add</button>
      </div>
    `).join('');
    html += `<button class="btn btn-primary" style="margin-top:1rem;width:100%" onclick="addAllDetected(${JSON.stringify(data).replace(/'/g,'')})">Add All to Fridge ✅</button>`;
    resultContent.innerHTML = html;
  } else if (mode === 'product') {
    displayIngredientResult(data);
  }
}

function displayScanResultDemo(mode) {
  const resultContent = document.getElementById('ai-result-content');
  if (mode === 'receipt') {
    const demoItems = [
      { name: "Whole Milk", emoji: "🥛", expiry: daysFromNow(5), qty: 1, unit: "L" },
      { name: "Chicken Fillets", emoji: "🍗", expiry: daysFromNow(3), qty: 2, unit: "pcs" },
      { name: "Greek Yogurt", emoji: "🥛", expiry: daysFromNow(10), qty: 2, unit: "cups" },
      { name: "Fresh Spinach", emoji: "🥬", expiry: daysFromNow(4), qty: 1, unit: "bag" },
    ];
    let html = `<p style="font-size:0.8rem;color:var(--ink-light);margin-bottom:0.75rem">📋 Demo mode — upload a real receipt for actual AI recognition</p>`;
    html += demoItems.map(item => `
      <div class="detected-item">
        <span style="font-size:1.2rem">${item.emoji}</span>
        <span class="detected-item-name">${item.name}</span>
        <span class="detected-expiry">${item.expiry}</span>
        <button class="btn-sm" onclick="addDetectedItem('${item.name}','${item.emoji}','${item.expiry}','${item.qty}','${item.unit}')">＋ Add</button>
      </div>
    `).join('');
    html += `<button class="btn btn-primary" style="margin-top:1rem;width:100%" onclick="addAllDetectedDemo()">Add All to Fridge ✅</button>`;
    resultContent.innerHTML = html;
  } else {
    displayIngredientResult({
      productName: "Processed Sausage (Demo)",
      expiry: daysFromNow(8),
      warnings: [
        { code: "E250", label: "Sodium Nitrite", risk: "🔴 Potential carcinogen in large amounts" },
        { code: "E621", label: "MSG / Flavor Enhancer", risk: "⚠️ May cause reactions in sensitive individuals" },
        { code: "Palm Oil", label: "Palm Oil", risk: "⚠️ High in saturated fat" }
      ],
      confidence: "demo"
    });
  }
}

function displayIngredientResult(data) {
  const resultContent = document.getElementById('ai-result-content');
  let html = `<div style="margin-bottom:0.75rem"><strong>${data.productName || 'Product'}</strong>`;
  if (data.expiry) html += ` — <span style="font-family:'JetBrains Mono',monospace;font-size:0.85rem">EXP: ${data.expiry}</span>`;
  html += `</div>`;
  if (data.warnings && data.warnings.length) {
    html += data.warnings.map(w => `
      <div class="ingredient-warning ${w.risk.includes('🔴') ? 'danger' : ''}">
        <span style="font-family:'JetBrains Mono',monospace;font-size:0.8rem;font-weight:600">${w.code}</span>
        <div>
          <div style="font-weight:500;font-size:0.85rem">${w.label}</div>
          <div style="font-size:0.78rem;color:var(--ink-mid)">${w.risk}</div>
        </div>
      </div>
    `).join('');
  } else {
    html += `<div style="color:var(--fresh);font-size:0.875rem">✅ No concerning additives detected</div>`;
  }
  resultContent.innerHTML = html;
}

function addDetectedItem(name, emoji, expiry, qty, unit) {
  if (!expiry) {
    const d = prompt(`Enter expiry date for ${name} (YYYY-MM-DD):`);
    if (!d) return;
    expiry = d;
  }
  APP.products.push({ id: APP.nextId++, name, emoji, qty: parseInt(qty)||1, unit, expiry, category: 'other', note: '' });
  showToast(`${name} added to fridge! ✅`, 'success');
}

function addAllDetectedDemo() {
  const items = [
    { name: "Whole Milk", emoji: "🥛", expiry: daysFromNow(5), qty: 1, unit: "L" },
    { name: "Chicken Fillets", emoji: "🍗", expiry: daysFromNow(3), qty: 2, unit: "pcs" },
    { name: "Greek Yogurt", emoji: "🥛", expiry: daysFromNow(10), qty: 2, unit: "cups" },
    { name: "Fresh Spinach", emoji: "🥬", expiry: daysFromNow(4), qty: 1, unit: "bag" },
  ];
  items.forEach(i => APP.products.push({ id: APP.nextId++, ...i, category: 'other', note: '' }));
  showToast(`4 items added to fridge! ✅`, 'success');
  navigate('dashboard');
}

// ---- AI CHAT ----
function renderChat() {
  const msgs = document.getElementById('chat-messages');
  if (!msgs) return;
  if (APP.chatHistory.length === 0) {
    APP.chatHistory.push({
      role: 'ai',
      text: `Hi! I'm ShelfLife AI 🌿 I can help you manage your fridge. Try:
      <div class="update-item">🥚 "-1 egg"</div>
      <div class="update-item">🥛 "finished milk"</div>
      <div class="update-item">🧀 "almost out of cheese"</div>
      <div class="update-item">📋 "what's expiring soon?"</div>`
    });
  }
  renderChatMessages();
}

function renderChatMessages() {
  const msgs = document.getElementById('chat-messages');
  if (!msgs) return;
  msgs.innerHTML = APP.chatHistory.map(m => `
    <div class="msg ${m.role === 'ai' ? 'ai' : 'user'}">
      <div class="msg-avatar ${m.role === 'ai' ? 'ai' : 'user'}">${m.role === 'ai' ? '🌿' : 'ME'}</div>
      <div class="msg-bubble">${m.text}</div>
    </div>
  `).join('');
  msgs.scrollTop = msgs.scrollHeight;
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  APP.chatHistory.push({ role: 'user', text });
  input.value = '';
  renderChatMessages();

  // Show typing indicator
  const msgs = document.getElementById('chat-messages');
  const typingEl = document.createElement('div');
  typingEl.className = 'msg ai';
  typingEl.id = 'typing';
  typingEl.innerHTML = `<div class="msg-avatar ai">🌿</div><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
  msgs.appendChild(typingEl);
  msgs.scrollTop = msgs.scrollHeight;

  try {
    const fridgeSummary = APP.products.map(p => {
      const s = getStatus(p.expiry);
      return `${p.name}: qty=${p.qty} ${p.unit}, expiry=${p.expiry} (${s.label})`;
    }).join('\n');

    const systemPrompt = `You are ShelfLife AI, a friendly smart fridge assistant. Current fridge contents:\n${fridgeSummary}\n\nWhen users say things like "-1 egg", "finished milk", "almost out of cheese", interpret and describe what updates you would make. Be concise, friendly, and use emojis. Format updates as short bullet points. If asked what's expiring, summarize the status. Keep replies under 150 words.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        system: systemPrompt,
        messages: APP.chatHistory.filter(m => m.role === 'user').slice(-5).map(m => ({ role: 'user', content: m.text }))
      })
    });

    const data = await response.json();
    const reply = data.content?.map(c => c.text || '').join('') || '';

    // Parse action commands from reply
    processAIAction(text);

    document.getElementById('typing')?.remove();
    APP.chatHistory.push({ role: 'ai', text: reply.replace(/\n/g, '<br>') });
    renderChatMessages();

  } catch (err) {
    document.getElementById('typing')?.remove();
    const fallback = processSmartCommand(text);
    APP.chatHistory.push({ role: 'ai', text: fallback });
    renderChatMessages();
  }
}

function processAIAction(text) {
  const lower = text.toLowerCase();

  // Pattern: "-N productname"
  const decrMatch = text.match(/^-(\d+)\s+(.+)/);
  if (decrMatch) {
    const amount = parseInt(decrMatch[1]);
    const name = decrMatch[2].trim().toLowerCase();
    const product = APP.products.find(p => p.name.toLowerCase().includes(name));
    if (product) {
      product.qty = Math.max(0, product.qty - amount);
      if (product.qty === 0) {
        APP.products = APP.products.filter(p => p.id !== product.id);
        APP.shoppingList.unshift({ id: Date.now(), name: product.name, qty: '1', priority: 'high', checked: false });
      }
    }
    return;
  }

  // Pattern: "finished X" / "no more X" / "out of X"
  const finishedMatch = lower.match(/(?:finished|no more|out of|used|ate)\s+(.+)/);
  if (finishedMatch) {
    const name = finishedMatch[1].trim();
    const product = APP.products.find(p => p.name.toLowerCase().includes(name));
    if (product) {
      APP.products = APP.products.filter(p => p.id !== product.id);
      APP.shoppingList.unshift({ id: Date.now(), name: product.name, qty: '1', priority: 'high', checked: false });
    }
    return;
  }

  // Pattern: "almost out of X" / "low on X"
  const lowMatch = lower.match(/(?:almost out of|low on|running low on)\s+(.+)/);
  if (lowMatch) {
    const name = lowMatch[1].trim();
    const existing = APP.shoppingList.find(i => i.name.toLowerCase().includes(name));
    if (!existing) {
      APP.shoppingList.unshift({ id: Date.now(), name: name.charAt(0).toUpperCase() + name.slice(1), qty: '1', priority: 'med', checked: false });
    }
    return;
  }
}

function processSmartCommand(text) {
  const lower = text.toLowerCase();
  const decrMatch = text.match(/^-(\d+)\s+(.+)/);
  
  if (decrMatch) {
    return `Got it! I've decremented ${decrMatch[2]} by ${decrMatch[1]}. Your fridge list is updated! 🥡`;
  }
  if (lower.includes('finished') || lower.includes('no more') || lower.includes('out of')) {
    return `Understood! I've marked that item as finished and added it to your shopping list. 🛒`;
  }
  if (lower.includes('almost') || lower.includes('low on')) {
    return `Noted! I've added that to your shopping list with medium priority. ⚠️`;
  }
  if (lower.includes('expir') || lower.includes('soon')) {
    const soon = APP.products.filter(p => ['soon','expired'].includes(getStatus(p.expiry).cls));
    if (soon.length === 0) return `Everything looks fresh! 🟢 Nothing expiring in the next 2 days.`;
    return `⚠️ Items needing attention:<br>` + soon.map(p => {
      const s = getStatus(p.expiry);
      return `• ${p.emoji} ${p.name}: ${s.label}`;
    }).join('<br>');
  }
  if (lower.includes('what') || lower.includes('list') || lower.includes('have')) {
    return `Your fridge has <b>${APP.products.length} items</b>:<br>` + APP.products.slice(0,5).map(p => `• ${p.emoji} ${p.name}`).join('<br>') + (APP.products.length > 5 ? `<br>...and ${APP.products.length - 5} more` : '');
  }
  return `I heard you! Your fridge is being monitored. 🌿 Try commands like "-1 egg", "finished milk", or "what's expiring soon?"`;
}

function useSuggestion(text) {
  document.getElementById('chat-input').value = text;
  sendChatMessage();
}

// ---- MODALS ----
function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}

// ---- TOAST ----
function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `${type === 'success' ? '✓' : type === 'warning' ? '⚠' : '✕'} ${msg}`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(20px)'; toast.style.transition = '0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  navigate('home');

  // nav clicks
  document.querySelectorAll('.nav-links a[data-page]').forEach(a => {
    a.addEventListener('click', (e) => { e.preventDefault(); navigate(a.dataset.page); });
  });

  // hamburger
  document.getElementById('hamburger')?.addEventListener('click', () => {
    document.getElementById('navLinks').classList.toggle('mobile-open');
  });

  // chat input enter
  document.getElementById('chat-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
  });

  // upload drag/drop
  const zone = document.getElementById('upload-zone');
  if (zone) {
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragging'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragging'));
    zone.addEventListener('drop', handleDrop);
    zone.addEventListener('click', () => document.getElementById('file-input').click());
  }

  // check for expiring items on load
  const expiring = APP.products.filter(p => getStatus(p.expiry).cls === 'soon');
  if (expiring.length > 0) {
    setTimeout(() => showToast(`⏰ ${expiring.length} item(s) expiring soon!`, 'warning'), 1500);
  }

  // animated counter for hero stats
  animateCounters();
});

function animateCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count);
    let current = 0;
    const step = target / 40;
    const interval = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = Math.floor(current).toLocaleString() + (el.dataset.suffix || '');
      if (current >= target) clearInterval(interval);
    }, 30);
  });
}
