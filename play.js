/* RupeePilot Play Lab: tactile interactions and educational calculators */
(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const money=n=>'₹'+Math.round(n).toLocaleString('en-IN');
const fields=['#rpCapital','#rpRisk','#rpEntry','#rpStop'].map(s=>$ (s));
const [capital,risk,entry,stop]=fields;
const shares=$('#rpShares'),loss=$('#rpLoss'),value=$('#rpValue'),explain=$('#rpRiskExplain');
function calculate(){
 if(!fields.every(Boolean))return;
 const [c,r,e,s]=fields.map(el=>Number(el.value));
 const valid=[c,r,e,s].every(Number.isFinite)&&c>0&&r>0&&r<=5&&e>0&&s>0&&s<e;
 if(!valid){shares.textContent='—';loss.textContent='—';value.textContent='—';explain.textContent='Enter positive values and set the stop price below the entry price. Risk is capped at 5% in this learning tool.';return;}
 const budget=c*r/100,perShare=e-s,qty=Math.floor(budget/perShare),planned=qty*perShare,position=qty*e;
 shares.innerHTML=qty.toLocaleString('en-IN')+' <small>shares</small>';
 loss.textContent=money(planned);value.textContent=money(position);
 explain.textContent='At '+money(perShare)+' risk per share, '+qty.toLocaleString('en-IN')+' shares means a planned loss of '+money(planned)+' against your '+money(budget)+' risk budget.';
}
fields.forEach(el=>el?.addEventListener('input',calculate));calculate();
const terms={
 pe:{symbol:'P/E',title:'Price-to-earnings',text:'How much the market pays for each rupee of a company’s annual earnings per share. Compare with similar businesses and the company’s own history.',caution:'A high P/E can reflect growth expectations — or an expensive share price. A low P/E can signal value — or serious trouble.'},
 eps:{symbol:'EPS',title:'Earnings per share',text:'A company’s profit attributable to each outstanding share. Look at the trend over several years and check whether growth comes from the core business.',caution:'One strong quarter does not make a trend. Check dilution, one-off gains and cash flow alongside EPS.'},
 roe:{symbol:'ROE',title:'Return on equity',text:'Net profit relative to shareholders’ equity. It helps show how efficiently a company uses owners’ capital to generate earnings.',caution:'Very high ROE can be boosted by heavy debt or a tiny equity base. Compare it with leverage and peers.'},
 de:{symbol:'D/E',title:'Debt-to-equity',text:'A comparison of borrowings with shareholders’ equity. It gives a quick view of financial leverage and how much debt sits behind the business.',caution:'Healthy levels differ by industry. Banks and lenders need different analysis from manufacturers or software firms.'}
};
const symbol=$('#rpTermSymbol'),title=$('#rpTermTitle'),desc=$('#rpTermText'),caution=$('#rpTermCaution');
$$('.term-tab').forEach(btn=>btn.addEventListener('click',()=>{
 const item=terms[btn.dataset.term];if(!item)return;
 $$('.term-tab').forEach(b=>{const active=b===btn;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
 const panel=$('.term-definition');panel?.classList.remove('term-pop');void panel?.offsetWidth;panel?.classList.add('term-pop');
 symbol.textContent=item.symbol;title.textContent=item.title;desc.textContent=item.text;caution.textContent=item.caution;
}));
if(reduced)return;
const palette=['#ff8d9f','#ffcb70','#a9f0dc','#9e9bff','#d7a5ff'];
function burst(x,y){
 for(let i=0;i<14;i++){
  const p=document.createElement('i'),angle=(Math.PI*2*i/14)+(Math.random()-.5)*.35,dist=38+Math.random()*58;
  p.className='play-confetti';p.style.left=x+'px';p.style.top=y+'px';p.style.background=palette[i%palette.length];
  p.style.setProperty('--dx',Math.cos(angle)*dist+'px');p.style.setProperty('--dy',Math.sin(angle)*dist+'px');p.style.setProperty('--turn',(Math.random()*540-270)+'deg');document.body.append(p);p.addEventListener('animationend',()=>p.remove(),{once:true});
 }
}
document.addEventListener('click',e=>{
 const btn=e.target.closest('button');if(!btn)return;
 const rect=btn.getBoundingClientRect(),x=e.clientX||rect.left+rect.width/2,y=e.clientY||rect.top+rect.height/2;
 const ripple=document.createElement('i');ripple.className='play-ripple';const size=Math.max(rect.width,rect.height);ripple.style.width=size/3+'px';ripple.style.height=size/3+'px';ripple.style.left=(x-rect.left-size/6)+'px';ripple.style.top=(y-rect.top-size/6)+'px';btn.style.position='relative';btn.style.overflow='hidden';btn.append(ripple);ripple.addEventListener('animationend',()=>ripple.remove(),{once:true});
 if(btn.classList.contains('button-lime')||btn.classList.contains('term-tab'))burst(x,y);
});
if(window.matchMedia('(pointer:fine)').matches){
 $$('.play-card').forEach(card=>{
  card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect(),dx=(e.clientX-r.left)/r.width-.5,dy=(e.clientY-r.top)/r.height-.5;card.style.setProperty('--play-rx',(-dy*3)+'deg');card.style.setProperty('--play-ry',(dx*3)+'deg');});
  card.addEventListener('pointerleave',()=>{card.style.setProperty('--play-rx','0deg');card.style.setProperty('--play-ry','0deg');});
 });
}
})();