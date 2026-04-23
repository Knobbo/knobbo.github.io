// hayes-calculator/script.js
// Populate service and material calculators, with material rows fixed to the host-edited
// `defaultMaterials` array. Comments are rendered as static text (non-editable in UI).

document.addEventListener('DOMContentLoaded', () => {
  const formatCurrency = v => '$' + Number(v).toLocaleString();

  // --- Service calculator wiring ---
  function computeRow(row){
    const qtyEl = row.querySelector('.qty');
    const price = Number(qtyEl?.dataset?.price || row.querySelector('.price')?.dataset?.price || 0);
    const qty = Number(qtyEl?.value || 0);
    const total = qty * price;
    const out = row.querySelector('.line-total'); if(out) out.textContent = formatCurrency(total);
    return total;
  }

  function computeSection(sectionName){
    const rows = Array.from(document.querySelectorAll(`tr[data-section="${sectionName}"]`));
    return rows.reduce((s,r)=> s + computeRow(r), 0);
  }

  function computeAllService(){
    const items = computeSection('items');
    const upgrades = computeSection('upgrades');
    const repair = computeSection('repair');

    const elItems = document.getElementById('itemsTotalAside');
    const elUpgrades = document.getElementById('upgradesTotalAside');
    const elRepair = document.getElementById('repairTotalAside');
    const elGrand = document.getElementById('grandTotal');
    elItems && (elItems.textContent = formatCurrency(items));
    elUpgrades && (elUpgrades.textContent = formatCurrency(upgrades));
    elRepair && (elRepair.textContent = formatCurrency(repair));

    const grand = items + upgrades + repair;
    elGrand && (elGrand.textContent = formatCurrency(grand));

    // discounts (for display only)
    const setDiscount = (id, pct) => {
      const el = document.getElementById(id);
      if(el) el.textContent = formatCurrency(Math.round(grand * pct));
    };
    setDiscount('d10', 0.10); setDiscount('d15', 0.15); setDiscount('d25', 0.25); setDiscount('d50', 0.50);
  }

  // wire qty inputs
  document.querySelectorAll('.qty').forEach(input => {
    input.addEventListener('input', computeAllService);
    input.addEventListener('change', computeAllService);
  });

  // --- Material calculator ---
  // Exact 10 items (edit here to change names, costs or comment text)
  const defaultMaterials = [
    { name: 'Steel', cost: 65, comment: '' },
    { name: 'Metal Scrap', cost: 70, comment: '' },
    { name: 'Iron', cost: 45, comment: '' },
    { name: 'Aluminum', cost: 30, comment: '' },
    { name: 'Rubber', cost: 15, comment: '' },
    { name: 'Plastic', cost: 15, comment: '' },
    { name: 'Glass', cost: 10, comment: '' },
    { name: 'Copper', cost: 25, comment: '' },
    { name: 'Wood', cost: 25, comment: '' },
    { name: 'Slips', cost: 180, comment: '' }
  ];

  function populateMaterialRows(){
    const tbody = document.querySelector('#materialTable tbody');
    if(!tbody) return;
    tbody.innerHTML = '';
    defaultMaterials.forEach(mat => {
      const tr = document.createElement('tr');

      // Item (static text but still stylable)
      const tdItem = document.createElement('td');
      const spanItem = document.createElement('span'); spanItem.className = 'mat-item'; spanItem.textContent = mat.name;
      tdItem.appendChild(spanItem);

      // Amount (editable)
      const tdAmount = document.createElement('td');
      const inputAmount = document.createElement('input'); inputAmount.type = 'number'; inputAmount.min='0'; inputAmount.value='0'; inputAmount.className = 'mat-amount';
      tdAmount.appendChild(inputAmount);

      // Cost (unit) — static text to avoid accidental edits
      const tdCost = document.createElement('td');
      const spanCost = document.createElement('span'); spanCost.className = 'mat-cost'; spanCost.textContent = formatCurrency(mat.cost);
      // store numeric cost for calculation as data attribute
      spanCost.dataset.unit = String(mat.cost);
      tdCost.appendChild(spanCost);

      // Line total
      const tdLine = document.createElement('td'); tdLine.className = 'mat-line'; tdLine.textContent = '$0';

      // Comment (static — non-editable in UI; edit in code via defaultMaterials)
      const tdComment = document.createElement('td');
      const spanComment = document.createElement('span'); spanComment.className = 'mat-comment'; spanComment.textContent = mat.comment || '';
      tdComment.appendChild(spanComment);

      tr.appendChild(tdItem); tr.appendChild(tdAmount); tr.appendChild(tdCost); tr.appendChild(tdLine); tr.appendChild(tdComment);
      tbody.appendChild(tr);
    });

    // wire amount inputs
    document.querySelectorAll('.mat-amount').forEach(i=>{
      i.addEventListener('input', computeMaterialAll);
      i.addEventListener('change', computeMaterialAll);
    });
  }

  function computeMaterialAll(){
    const rows = Array.from(document.querySelectorAll('#materialTable tbody tr'));
    let total = 0;
    rows.forEach(row => {
      const amt = Number(row.querySelector('.mat-amount')?.value || 0);
      const unit = Number(row.querySelector('.mat-cost')?.dataset?.unit || 0);
      const line = amt * unit;
      total += line;
      const out = row.querySelector('.mat-line'); if(out) out.textContent = formatCurrency(line);
    });
    const materialsTotal = document.getElementById('materialsTotal');
    if(materialsTotal) materialsTotal.textContent = formatCurrency(total);
  }

  // --- Tabs and reset ---
  const tabService = document.getElementById('tabService');
  const tabMaterial = document.getElementById('tabMaterial');
  const materialCard = document.getElementById('materialCard');
  const sections = Array.from(document.querySelectorAll('#itemsSection, #upgradesSection, #repairSection'));

  function showService(){
    tabService && tabService.classList.add('active');
    tabMaterial && tabMaterial.classList.remove('active');
    materialCard && materialCard.classList.add('hidden');
    sections.forEach(s=> s && s.classList.remove('hidden'));
  }
  function showMaterial(){
    tabMaterial && tabMaterial.classList.add('active');
    tabService && tabService.classList.remove('active');
    materialCard && materialCard.classList.remove('hidden');
    sections.forEach(s=> s && s.classList.add('hidden'));
  }
  tabService && tabService.addEventListener('click', showService);
  tabMaterial && tabMaterial.addEventListener('click', showMaterial);

  const resetBtn = document.getElementById('resetBtn');
  resetBtn && resetBtn.addEventListener('click', ()=>{
    document.querySelectorAll('.qty').forEach(i=> i.value = 0);
    document.querySelectorAll('.mat-amount').forEach(i=> i.value = 0);
    computeAllService(); computeMaterialAll();
  });

  // init
  populateMaterialRows();
  computeAllService(); computeMaterialAll();
  showService();
});
// hayes-calculator/script.js
// Cleaned: compute totals, discounts, mechanic persistence, work order, reset/print

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

function formatCurrency(n){
  return (n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

/* DOM refs */
const resetBtn = $('#resetBtn');
const printBtn = $('#printBtn');
const regenOrder = $('#regenOrder');
const workOrderEl = $('#workOrder');
const mechanicInput = $('#mechanicName');

const grandEl = $('#grandTotal');
const discountEls = { d10: $('#d10'), d15: $('#d15'), d25: $('#d25'), d50: $('#d50') };
const sectionTotals = { items: $('#itemsTotal'), upgrades: $('#upgradesTotal'), repair: $('#repairTotal') };
const asideTotals = { items: $('#itemsTotalAside'), upgrades: $('#upgradesTotalAside'), repair: $('#repairTotalAside') };

/* Compute helpers */
function getPriceFromRow(row){
  const p = row.querySelector('.price');
  return Number(p?.dataset?.price || row.querySelector('.qty')?.dataset?.price || 0);
}

function getQtyFromRow(row){
  const inp = row.querySelector('.qty');
  return Math.max(0, Math.floor(Number(inp?.value) || 0));
}

function computeLine(row){
  const qty = getQtyFromRow(row);
  const price = getPriceFromRow(row);
  const total = qty * price;
  const el = row.querySelector('.line-total');
  if (el) el.textContent = formatCurrency(total);
  return total;
}

function computeSection(name){
  const rows = $$(`tr[data-section="${name}"]`);
  let sum = 0;
  rows.forEach(r => sum += computeLine(r));
  if (sectionTotals[name]) sectionTotals[name].textContent = formatCurrency(sum);
  if (asideTotals[name]) asideTotals[name].textContent = formatCurrency(sum);
  return sum;
}

function computeAll(){
  const si = computeSection('items');
  const su = computeSection('upgrades');
  const sr = computeSection('repair');
  const grand = si + su + sr;
  if (grandEl) grandEl.textContent = formatCurrency(grand);

  if (discountEls.d10) discountEls.d10.textContent = formatCurrency(Math.round(grand * 0.10));
  if (discountEls.d15) discountEls.d15.textContent = formatCurrency(Math.round(grand * 0.15));
  if (discountEls.d25) discountEls.d25.textContent = formatCurrency(Math.round(grand * 0.25));
  if (discountEls.d50) discountEls.d50.textContent = formatCurrency(Math.round(grand * 0.50));
}

/* Inputs wiring */
function safeIntegerInput(e){
  const v = e.target;
  let n = Math.floor(Number(v.value) || 0);
  if (n < 0) n = 0;
  v.value = n;
  computeAll();
}

function initInputs(){
  $$('.qty').forEach(inp => {
    const priceCell = inp.closest('tr')?.querySelector('.price');
    if (priceCell && !priceCell.dataset.price) priceCell.dataset.price = inp.dataset.price || '';
    inp.addEventListener('input', safeIntegerInput);
    inp.addEventListener('change', safeIntegerInput);
    inp.setAttribute('inputmode','numeric');
    inp.setAttribute('pattern','\\d*');
  });
}

/* Work order + mechanic persistence */
function genWorkOrder(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  const rnd = Math.floor(1000 + Math.random()*9000);
  return `HAY-${y}${m}${dd}-${rnd}`;
}

function initWorkOrder(){
  if (workOrderEl) workOrderEl.textContent = genWorkOrder();
  if (regenOrder) regenOrder.addEventListener('click', ()=> { if (workOrderEl) workOrderEl.textContent = genWorkOrder(); });
}

const MECH_KEY = 'hayes.mechanic';
function initMechanic(){
  if (!mechanicInput) return;
  mechanicInput.value = localStorage.getItem(MECH_KEY) || '';
  mechanicInput.addEventListener('input', ()=> localStorage.setItem(MECH_KEY, mechanicInput.value));
}

/* Reset / Print */
function resetAll(){
  $$('.qty').forEach(i => i.value = 0);
  // reset material amounts as well
  $$('.mat-amount').forEach(i => i.value = 0);
  computeAll();
  if (typeof computeMaterialAll === 'function') computeMaterialAll();
}

/* Init */
document.addEventListener('DOMContentLoaded', ()=>{
  initInputs();
  computeAll();
  if (resetBtn) resetBtn.addEventListener('click', resetAll);
  if (printBtn) printBtn.addEventListener('click', ()=> window.print());
  initWorkOrder();
  initMechanic();
});
  
// --- Material calculator wiring ---
function formatCurrencySimple(n){ return (n||0).toLocaleString('en-US', { style:'currency', currency:'USD', maximumFractionDigits:0 }); }

function parseCurrencyToNumber(str){
  if (!str) return 0;
  const n = String(str).replace(/[^0-9.-]+/g,'');
  return Number(n) || 0;
}

function computeMaterialLine(row){
  const amt = Math.max(0, Math.floor(Number(row.querySelector('.mat-amount').value) || 0));
  const costCell = row.querySelector('.mat-cost');
  const cost = costCell ? parseCurrencyToNumber(costCell.textContent) : 0;
  const total = Math.round(amt * cost);
  const el = row.querySelector('.mat-line'); if (el) el.textContent = formatCurrencySimple(total);
  return total;
}

function computeMaterialAll(){
  const rows = Array.from(document.querySelectorAll('#materialTable tbody tr'));
  let sum = 0; rows.forEach(r => sum += computeMaterialLine(r));
  const totalEl = document.getElementById('materialsTotal'); if (totalEl) totalEl.textContent = formatCurrencySimple(sum);
  const md10 = document.getElementById('m_d10'); if (md10) md10.textContent = formatCurrencySimple(Math.round(sum * 0.10));
  const md15 = document.getElementById('m_d15'); if (md15) md15.textContent = formatCurrencySimple(Math.round(sum * 0.15));
  const md25 = document.getElementById('m_d25'); if (md25) md25.textContent = formatCurrencySimple(Math.round(sum * 0.25));
  const md50 = document.getElementById('m_d50'); if (md50) md50.textContent = formatCurrencySimple(Math.round(sum * 0.50));
}

function initMaterialInputs(){
  document.querySelectorAll('.mat-amount').forEach(inp=>{
    inp.addEventListener('input', ()=> computeMaterialAll());
    inp.addEventListener('change', ()=> computeMaterialAll());
  });
}

// Tabs
document.addEventListener('DOMContentLoaded', ()=>{
  const tabService = document.getElementById('tabService');
  const tabMaterial = document.getElementById('tabMaterial');
  const materialCard = document.getElementById('materialCard');

  function showService(){
    if (tabService) tabService.classList.add('active');
    if (tabMaterial) tabMaterial.classList.remove('active');
    if (materialCard) materialCard.classList.add('hidden');
    ['itemsSection','upgradesSection','repairSection'].forEach(id=>{ const el=document.getElementById(id); if(el) el.classList.remove('hidden'); });
    const pic = document.querySelector('.picture-of-week'); if (pic) pic.classList.remove('hidden');
    const aside = document.querySelector('.totals-card'); if (aside) aside.classList.remove('hidden');
  }

  function showMaterial(){
    if (tabService) tabService.classList.remove('active');
    if (tabMaterial) tabMaterial.classList.add('active');
    if (materialCard) materialCard.classList.remove('hidden');
    ['itemsSection','upgradesSection','repairSection'].forEach(id=>{ const el=document.getElementById(id); if(el) el.classList.add('hidden'); });
    const pic = document.querySelector('.picture-of-week'); if (pic) pic.classList.add('hidden');
    const aside = document.querySelector('.totals-card'); if (aside) aside.classList.add('hidden');
    computeMaterialAll();
  }

  if (tabService) tabService.addEventListener('click', showService);
  if (tabMaterial) tabMaterial.addEventListener('click', showMaterial);

  /* Default material items (editable in code) */
  const defaultMaterials = [
    { item: 'Steel', amount: 0, cost: 65, comment: 'Buying Everything' },
    { item: 'Metal Scrap', amount: 0, cost: 70, comment: 'Buying Everything' },
    { item: 'Iron', amount: 0, cost: 45, comment: 'Buying Everything' },
    { item: 'Aluminum', amount: 0, cost: 30, comment: 'Buying Everything' },
    { item: 'Rubber', amount: 0, cost: 15, comment: 'Buying Everything' },
    { item: 'Plastic', amount: 0, cost: 15, comment: 'Buying Everything' },
    { item: 'Glass', amount: 0, cost: 15, comment: 'Buying Everything' },
    { item: 'Copper', amount: 0, cost: 25, comment: 'Buying Everything' },
    { item: 'Wood', amount: 0, cost: 25, comment: 'Buying Everything' },
    { item: 'Slips', amount: 0, cost: 180, comment: 'Buying Everything' }
  ];

  function populateMaterialRows(){
    const tbody = document.querySelector('#materialTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    defaultMaterials.forEach(m => {
      const tr = document.createElement('tr');
      // render static item, cost and comment; amount is the only input box
      tr.innerHTML = `
        <td class="mat-item">${m.item}</td>
        <td><input class="mat-amount" type="number" min="0" value="${m.amount}" /></td>
        <td class="mat-cost">${formatCurrencySimple(m.cost)}</td>
        <td class="mat-line">$0</td>
        <td class="mat-comment">${m.comment || ''}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  populateMaterialRows();
  initMaterialInputs();
  computeMaterialAll();
});
