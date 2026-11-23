(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // Small-screen navigation
  const menuToggle = $('#menuToggle');
  const nav = $('.desktop-nav');
  menuToggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  $$('.desktop-nav a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open'); menuToggle?.setAttribute('aria-expanded', 'false');
  }));

  // Gentle reveal, with a no-JS / reduced-motion friendly fallback.
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: 0.12 });
    $$('.reveal').forEach(el => observer.observe(el));
  } else $$('.reveal').forEach(el => el.classList.add('is-visible'));

  // Chart selector + market presets.
  const chart = $('#mainChart');
  const symbolSelect = $('#symbolSelect');
  const chartTitle = $('#chartTitle');
  const marketPresets = {
    india: [['NSE:NIFTY','NIFTY 50'],['BSE:SENSEX','SENSEX'],['NSE:RELIANCE','RELIANCE'],['NSE:HDFCBANK','HDFC BANK'],['NSE:TCS','TCS'],['NSE:INFY','INFOSYS']],
    global: [['NASDAQ:AAPL','APPLE'],['NASDAQ:NVDA','NVIDIA'],['NASDAQ:MSFT','MICROSOFT'],['NASDAQ:TSLA','TESLA'],['NYSE:KO','COCA-COLA']],
    crypto: [['BINANCE:BTCUSDT','BITCOIN'],['BINANCE:ETHUSDT','ETHEREUM'],['BINANCE:SOLUSDT','SOLANA'],['BINANCE:BNBUSDT','BNB'],['BINANCE:XRPUSDT','XRP']]
  };
  function setSymbol(symbol, title) {
    if (!chart) return;
    chart.setAttribute('symbol', symbol);
    if (chartTitle) chartTitle.innerHTML = `${title} <span>· ${symbol.split(':')[0]}</span>`;
    if (symbolSelect && [...symbolSelect.options].some(o => o.value === symbol)) symbolSelect.value = symbol;
  }
  symbolSelect?.addEventListener('change', () => {
    const option = symbolSelect.selectedOptions[0]; setSymbol(symbolSelect.value, option.textContent);
  });
  $$('.market-tab').forEach(tab => tab.addEventListener('click', () => {
    $$('.market-tab').forEach(t => { t.classList.toggle('active', t === tab); t.setAttribute('aria-selected', String(t === tab)); });
    const preset = marketPresets[tab.dataset.market];
    symbolSelect.innerHTML = preset.map(([symbol, name]) => `<option value="${symbol}">${name}</option>`).join('');
    setSymbol(preset[0][0], preset[0][1]);
  }));
  $$('[data-coin]').forEach(button => button.addEventListener('click', () => {
    setSymbol(button.dataset.coin, button.dataset.coin.split(':')[1].replace('USDT',''));
    $('#markets')?.scrollIntoView({ behavior: 'smooth' });
    $$('.market-tab').forEach(t => { t.classList.toggle('active', t.dataset.market === 'crypto'); t.setAttribute('aria-selected', String(t.dataset.market === 'crypto')); });
    const preset = marketPresets.crypto;
    symbolSelect.innerHTML = preset.map(([symbol, name]) => `<option value="${symbol}">${name}</option>`).join('');
    symbolSelect.value = button.dataset.coin;
  }));

  // Switch between screener and heatmap without reloading the entire page.
  $$('.explorer-tab').forEach(tab => tab.addEventListener('click', () => {
    $$('.explorer-tab').forEach(t => t.classList.toggle('active', t === tab));
    const frame = $('#stockExplorerFrame');
    if (!frame) return;
    frame.innerHTML = tab.dataset.explorer === 'heatmap'
      ? '<div class="explorer-widget"><tv-heatmap heatmap-type="stock" data-source="SPX500" grouping="sector" block-size="market_cap_basic" block-color="change" color-theme="light" style="display:block;width:100%;height:580px"></tv-heatmap></div>'
      : '<div class="explorer-widget"><tv-screener market="india" screener="stock" display="table" color-theme="light" height="580" width="100%" style="display:block;width:100%;height:580px"></tv-screener></div>';
  }));

  // Personal portfolio: explicit manual records only; browser-local storage.
  const STORAGE_KEY = 'rupeepilot.portfolio.v2';
  let assets = [];
  try { assets = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); if (!Array.isArray(assets)) assets = []; } catch { assets = []; }
  const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value || 0);
  const dialog = $('#assetDialog');
  function saveAssets() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(assets)); } catch { /* private browsing may block storage */ } }
  function renderAssets() {
    const invested = assets.reduce((sum, asset) => sum + asset.units * asset.price, 0);
    $('#totalInvested').textContent = money(invested);
    $('#assetCount').textContent = String(assets.length);
    $('#watchCount').textContent = String(assets.length);
    $('#portfolioEmpty').hidden = assets.length > 0;
    $('#portfolioTableWrap').hidden = assets.length === 0;
    $('#portfolioRows').innerHTML = assets.map((asset, index) => `<tr><td><strong>${escapeHtml(asset.name)}</strong></td><td>${Number(asset.units).toLocaleString('en-IN')}</td><td>${money(asset.price)}</td><td>${money(asset.units * asset.price)}</td><td><button class="remove-asset" data-remove="${index}" aria-label="Remove ${escapeHtml(asset.name)}">×</button></td></tr>`).join('');
  }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
  function openDialog() { if (dialog?.showModal) dialog.showModal(); else alert('Your browser does not support this form.'); }
  $('#addAssetBtn')?.addEventListener('click', openDialog);
  $('#emptyAddBtn')?.addEventListener('click', openDialog);
  $('#portfolioRows')?.addEventListener('click', event => {
    const button = event.target.closest('[data-remove]'); if (!button) return;
    assets.splice(Number(button.dataset.remove), 1); saveAssets(); renderAssets();
  });
  $('#assetForm')?.addEventListener('submit', event => {
    event.preventDefault();
    const name = $('#assetName').value.trim();
    const units = Number($('#assetUnits').value);
    const price = Number($('#assetPrice').value);
    if (!name || !Number.isFinite(units) || units <= 0 || !Number.isFinite(price) || price <= 0) return;
    assets.push({ name, units, price, addedAt: Date.now() }); saveAssets(); renderAssets();
    event.currentTarget.reset(); dialog.close();
  });
  renderAssets();

  // Financial calculators.
  const fmt = value => '₹' + Math.round(value).toLocaleString('en-IN');
  const tools = {
    sip: {
      title: '01 — SIP PLANNER', heading: 'Little by little adds up.',
      fields: [['Monthly investment','sipAmount',500,100000,500,5000,'₹'],['Expected annual return','sipRate',1,20,.5,12,'%'],['Time period','sipYears',1,40,1,10,' years']],
      calculate: v => { const n = v.sipYears * 12, r = v.sipRate / 1200, invested = v.sipAmount * n; const total = r ? v.sipAmount * ((Math.pow(1+r,n)-1)/r) * (1+r) : invested; return { total, invested, growth: total-invested, text: `If you invest ${fmt(v.sipAmount)} every month for ${v.sipYears} years at an assumed ${v.sipRate}% annual return.` }; }
    },
    emi: {
      title: '02 — LOAN EMI', heading: 'Know the monthly commitment.',
      fields: [['Loan amount','emiAmount',50000,10000000,50000,2500000,'₹'],['Annual interest rate','emiRate',1,24,.25,9,'%'],['Loan tenure','emiYears',1,30,1,5,' years']],
      calculate: v => { const n=v.emiYears*12,r=v.emiRate/1200,emi=r? v.emiAmount*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1):v.emiAmount/n, total=emi*n; return {total,invested:v.emiAmount,growth:total-v.emiAmount,text:`Estimated monthly EMI: ${fmt(emi)} for ${v.emiYears} years. Total repayment includes interest.`}; }
    },
    fd: {
      title: '03 — FIXED DEPOSIT', heading: 'Let time do its thing.',
      fields: [['Deposit amount','fdAmount',1000,10000000,1000,100000,'%'],['Annual interest rate','fdRate',1,12,.25,7,'%'],['Time period','fdYears',1,15,1,5,' years']],
      calculate: v => { const total=v.fdAmount*Math.pow(1+v.fdRate/400,v.fdYears*4); return {total,invested:v.fdAmount,growth:total-v.fdAmount,text:`Illustrative quarterly-compounding estimate for ${v.fdYears} years at ${v.fdRate}% annual interest, before tax.`}; }
    },
    budget: {
      title: '04 — BUDGET SPLIT', heading: 'Give every rupee a role.',
      fields: [['Monthly take-home income','budgetAmount',5000,500000,1000,50000,'₹'],['Needs allocation','budgetNeeds',20,80,5,50,'%'],['Wants allocation','budgetWants',0,50,5,30,'%']],
      calculate: v => { const wants=Math.min(v.budgetWants,100-v.budgetNeeds), savings=100-v.budgetNeeds-wants; return {total:v.budgetAmount,invested:v.budgetAmount*v.budgetNeeds/100,growth:v.budgetAmount*savings/100,text:`Needs ${v.budgetNeeds}% · Wants ${wants}% · Savings ${savings}%. Adjust the split to fit your actual life.`}; }
    }
  };
  let activeTool = 'sip';
  const values = {};
  function buildTool(key) {
    activeTool = key; const config=tools[key];
    config.fields.forEach(field => values[field[1]]=field[5]);
    $('#toolInputs').innerHTML = `<div class="tool-intro"><span class="panel-label">${config.title}</span><h3>${config.heading}</h3><p>${key==='sip'?'Estimate what regular investing could grow into. Returns are assumptions, not promises.':key==='emi'?'Understand the monthly cost and total repayment of a loan before you commit.':key==='fd'?'Explore an illustrative fixed-deposit maturity value. Actual bank terms and tax treatment vary.':'A simple starting point for dividing monthly income into needs, wants and savings.'}</p></div>` + config.fields.map(([label,id,min,max,step,value,suffix]) => `<label class="field-label">${label.toUpperCase()} <span id="${id}Label">${suffix==='%'?value+'%':suffix===' years'?value+' years':fmt(value)}</span><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}"></label>`).join('');
    config.fields.forEach(([label,id,min,max,step,value,suffix]) => $(`#${id}`).addEventListener('input', event => {
      const number=Number(event.target.value); values[id]=number; $(`#${id}Label`).textContent=suffix==='%'?number+'%':suffix===' years'?number+' years':fmt(number); updateTool();
    }));
    updateTool();
  }
  function updateTool() {
    const result=tools[activeTool].calculate(values);
    $('#toolResult').textContent=fmt(result.total);
    $('#toolResultText').textContent=result.text;
    $('#resultInvested').textContent=fmt(result.invested);
    $('#resultGrowth').textContent=fmt(result.growth);
    const denom=Math.max(1,Math.abs(result.total));
    $('#investedBar').style.width=Math.max(0,Math.min(100,result.invested/denom*100))+'%';
    $('#growthBar').style.width=Math.max(0,Math.min(100,result.growth/denom*100))+'%';
  }
  $$('.tool-tab').forEach(tab => tab.addEventListener('click', () => {
    $$('.tool-tab').forEach(t=>t.classList.toggle('active',t===tab)); buildTool(tab.dataset.tool);
  }));
  buildTool('sip');
})();
