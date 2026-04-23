document.addEventListener('DOMContentLoaded', () => {

  // ---------------- HELPERS ----------------
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  function formatCurrency(n){
    return (n || 0).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    });
  }

  // Debounce helper
  function debounce(fn, delay = 300) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // ---------------- SERVICE CALCULATOR ----------------
  function computeLine(row){
    const qty = Number(row.querySelector('.qty')?.value || 0);
    const price = Number(row.querySelector('.price')?.dataset?.price || 0);
    const total = qty * price;

    const out = row.querySelector('.line-total');
    if(out) out.textContent = formatCurrency(total);

    return total;
  }

  function computeSection(section){
    let sum = 0;
    $$(`tr[data-section="${section}"]`).forEach(row => {
      sum += computeLine(row);
    });

    const totalEl = document.getElementById(section + 'Total');
    const asideEl = document.getElementById(section + 'TotalAside');

    if(totalEl) totalEl.textContent = formatCurrency(sum);
    if(asideEl) asideEl.textContent = formatCurrency(sum);

    return sum;
  }

  function computeAll(){
    const items = computeSection('items');
    const upgrades = computeSection('upgrades');
    const repair = computeSection('repair');

    const grand = items + upgrades + repair;
    $('#grandTotal').textContent = formatCurrency(grand);

    // discounts
    $('#d10').textContent = formatCurrency(grand * 0.10);
    $('#d15').textContent = formatCurrency(grand * 0.15);
    $('#d25').textContent = formatCurrency(grand * 0.25);
    $('#d50').textContent = formatCurrency(grand * 0.50);
  }

  // ---------------- MATERIAL CALCULATOR ----------------
  function computeMaterialAll(){
    let total = 0;

    $$('#materialTable tbody tr').forEach(row => {
      const amt = Number(row.querySelector('.mat-amount').value || 0);
      const cost = Number(row.querySelector('.mat-cost').textContent.replace(/[^0-9]/g,'')) || 0;

      const line = amt * cost;
      row.querySelector('.mat-line').textContent = formatCurrency(line);

      total += line;
    });

    $('#materialsTotal').textContent = formatCurrency(total);
  }

  // ---------------- TABS ----------------
  const tabService = $('#tabService');
  const tabMaterial = $('#tabMaterial');
  const materialCard = $('#materialCard');

  function showService(){
    tabService.classList.add('active');
    tabMaterial.classList.remove('active');
    materialCard.classList.add('hidden');

    ['itemsSection','upgradesSection','repairSection'].forEach(id => {
      document.getElementById(id).classList.remove('hidden');
    });

    document.querySelector('.totals-card').classList.remove('hidden');
    document.querySelector('.picture-card').classList.remove('hidden');
  }

  function showMaterial(){
    tabMaterial.classList.add('active');
    tabService.classList.remove('active');
    materialCard.classList.remove('hidden');

    ['itemsSection','upgradesSection','repairSection'].forEach(id => {
      document.getElementById(id).classList.add('hidden');
    });

    document.querySelector('.totals-card').classList.add('hidden');
    document.querySelector('.picture-card').classList.add('hidden');

    computeMaterialAll();
  }

  // ---------------- EVENT LISTENERS ----------------
  const debouncedComputeAll = debounce(computeAll, 200);
  const debouncedComputeMaterialAll = debounce(computeMaterialAll, 200);

  $$('.qty').forEach(input => {
    input.addEventListener('input', debouncedComputeAll);
  });

  $$('.mat-amount').forEach(input => {
    input.addEventListener('input', debouncedComputeMaterialAll);
  });

  tabService.addEventListener('click', showService);
  tabMaterial.addEventListener('click', showMaterial);

  $('#resetBtn').addEventListener('click', () => {
    $$('.qty').forEach(i => i.value = 0);
    $$('.mat-amount').forEach(i => i.value = 0);

    computeAll();
    computeMaterialAll();
  });

  // ---------------- INIT ----------------
  computeAll();
  computeMaterialAll();
  showService();

});
