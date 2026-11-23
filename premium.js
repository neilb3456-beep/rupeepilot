
(() => {
  'use strict';
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scroll progress and subtle pointer feedback.
  const progress = document.createElement('div'); progress.id='rp-progress'; document.body.append(progress);
  const cursor = document.createElement('div'); cursor.className='rp-cursor'; document.body.append(cursor);
  let pointerX=0,pointerY=0,cursorX=0,cursorY=0;
  if (!reduced && matchMedia('(pointer:fine)').matches) {
    addEventListener('pointermove', e => { pointerX=e.clientX; pointerY=e.clientY; cursor.style.opacity='1'; });
    const tick=()=>{cursorX+=(pointerX-cursorX)*.22;cursorY+=(pointerY-cursorY)*.22;cursor.style.left=cursorX+'px';cursor.style.top=cursorY+'px';requestAnimationFrame(tick);}; requestAnimationFrame(tick);
    $$('a,button,select,input').forEach(el=>{el.addEventListener('pointerenter',()=>cursor.classList.add('is-active'));el.addEventListener('pointerleave',()=>cursor.classList.remove('is-active'));});
  }
  const updateProgress=()=>{const max=document.documentElement.scrollHeight-innerHeight;progress.style.width=(max>0?scrollY/max*100:0)+'%';};
  addEventListener('scroll',updateProgress,{passive:true}); updateProgress();

  // Stagger elements as they enter view. Reduced-motion users get static content.
  if (!reduced && 'IntersectionObserver' in window) {
    const io=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('is-visible');io.unobserve(entry.target);}
    }),{threshold:.12,rootMargin:'0px 0px -35px 0px'});
    $$('.rs-reveal,.rs-animate-line').forEach(el=>io.observe(el));
  } else $$('.rs-reveal,.rs-animate-line').forEach(el=>el.classList.add('is-visible'));

  // Market research desk: chart changes, with transparent research limitations.
  const symbols={
    RELIANCE:['NSE:RELIANCE','Reliance Industries','RELIANCE · NSE'],
    HDFCBANK:['NSE:HDFCBANK','HDFC Bank','HDFCBANK · NSE'],
    TCS:['NSE:TCS','Tata Consultancy Services','TCS · NSE'],
    INFY:['NSE:INFY','Infosys','INFY · NSE'],
    ICICIBANK:['NSE:ICICIBANK','ICICI Bank','ICICIBANK · NSE'],
    LT:['NSE:LT','Larsen & Toubro','LT · NSE'],
    ITC:['NSE:ITC','ITC Limited','ITC · NSE'],
    SBIN:['NSE:SBIN','State Bank of India','SBIN · NSE']
  };
  const chart=$('#researchChart'),select=$('#researchSelect'),name=$('#rsAssetName'),symbol=$('#rsAssetSymbol');
  function choose(key){
    const item=symbols[key]||symbols.RELIANCE;
    if(chart) chart.setAttribute('symbol',item[0]);
    if(name) name.textContent=item[1];
    if(symbol) symbol.textContent=item[2];
    if(select) select.value=key;
    $$('.rs-ticker').forEach(b=>b.classList.toggle('active',b.dataset.ticker===key));
  }
  select?.addEventListener('change',()=>choose(select.value));
  $$('.rs-ticker').forEach(b=>b.addEventListener('click',()=>choose(b.dataset.ticker)));
  choose('RELIANCE');

  // A decision checklist: users choose their own horizon and learn what evidence to verify.
  const horizon=$('#researchHorizon'),checklist=$('#researchChecklist');
  const guides={
    long:['Revenue and profit growth across 5 years','Return on capital versus cost of capital','Debt, cash flow and promoter pledging','Valuation versus the company’s own history','Competitive advantage and governance'],
    medium:['Recent earnings trend and management guidance','Relative strength versus sector and index','Valuation versus peers and earnings quality','Upcoming results, policy or sector catalysts','Position size and maximum acceptable loss'],
    short:['Liquidity, spread and trading volume','Trend on daily and weekly timeframes','Volatility, event risk and gap risk','Predefined entry, invalidation and exit plan','Risk per trade before considering reward']
  };
  function renderChecklist(){
    if(!checklist)return;
    const list=guides[horizon?.value||'long'];
    checklist.innerHTML=list.map((x,i)=>'<div class="rs-signal"><div><strong>'+String(i+1).padStart(2,'0')+' / '+x+'</strong><small>Evidence to verify before forming a view</small></div><span>CHECK</span></div>').join('');
  }
  horizon?.addEventListener('change',renderChecklist);renderChecklist();

  // A modest parallax on the hero art; disabled for touch and reduced motion.
  const art=$('.hero-art');
  if(art&&!reduced&&matchMedia('(pointer:fine)').matches){
    addEventListener('pointermove',e=>{
      const rect=art.getBoundingClientRect();if(e.clientY<rect.top-100||e.clientY>rect.bottom+100)return;
      const x=(e.clientX-innerWidth/2)/innerWidth,y=(e.clientY-innerHeight/2)/innerHeight;
      art.style.transform='translate3d('+(-x*12)+'px,'+(-y*9)+'px,0)';
    },{passive:true});
    art.addEventListener('pointerleave',()=>art.style.transform='translate3d(0,0,0)');
  }
})();
