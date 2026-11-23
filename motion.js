/* RupeePilot — fluid motion controller */
(()=>{'use strict';
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine=window.matchMedia('(pointer:fine)').matches;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
document.documentElement.classList.add('motion-enabled');
const targets='main section:not(.hero),.section-kicker,.display-title,.market-bottom-card,.feature-strip>div,.crypto-feature,.crypto-widget-wrap,.portfolio-app,.tool-lab,.story-card,.news-card,.rs-head,.rs-chart-card,.rs-insight-card,.rs-factor,.rs-caveat,.graphic-bars';
const reveal= $$(targets).filter(el=>!el.closest('.hero'));
reveal.forEach((el,i)=>{if(el.classList.contains('motion-reveal'))return;el.classList.add('motion-reveal');if(el.matches('.section-kicker,.display-title,.rs-head'))el.dataset.motion='left';if(el.matches('.market-bottom-card,.feature-strip>div,.rs-factor'))el.style.setProperty('--motion-delay',(i%5)*75+'ms');});
if(!reduce&&'IntersectionObserver'in window){
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;entry.target.classList.add('is-in','is-visible');observer.unobserve(entry.target);}),{threshold:.12,rootMargin:'0px 0px -48px 0px'});
 reveal.forEach(el=>observer.observe(el));
 $$('.reveal,.rs-reveal,.rs-animate-line').forEach(el=>observer.observe(el));
}else reveal.concat($$('.reveal,.rs-reveal,.rs-animate-line')).forEach(el=>el.classList.add('is-in','is-visible'));
if(reduce)return;
let raf=0,px=0,py=0;
if(fine){
 addEventListener('pointermove',e=>{px=e.clientX;py=e.clientY;if(raf)return;raf=requestAnimationFrame(()=>{document.documentElement.style.setProperty('--pointer-x',px+'px');document.documentElement.style.setProperty('--pointer-y',py+'px');const art=$('.hero-art');if(art){const r=art.getBoundingClientRect();if(py>r.top-80&&py<r.bottom+80){const dx=(px-(r.left+r.width/2))/r.width,dy=(py-(r.top+r.height/2))/r.height;art.style.setProperty('--tilt-x',(-dy*2.4)+'deg');art.style.setProperty('--tilt-y',(dx*3.2)+'deg');}}raf=0;});},{passive:true});
 $$('.button,.round-link,.rs-ticker').forEach(el=>{el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();el.style.setProperty('--mx',(e.clientX-r.left-r.width/2)*.12+'px');el.style.setProperty('--my',(e.clientY-r.top-r.height/2)*.12+'px');});el.addEventListener('pointerleave',()=>{el.style.setProperty('--mx','0px');el.style.setProperty('--my','0px');});});
}
const art=$('.hero-art');if(art&&fine)art.addEventListener('pointerleave',()=>{art.style.setProperty('--tilt-x','0deg');art.style.setProperty('--tilt-y','0deg');});
const navLinks=$$('.desktop-nav a[href^="#"]'),sections=navLinks.map(a=>$(a.getAttribute('href'))).filter(Boolean);
if('IntersectionObserver'in window){const navObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting)return;navLinks.forEach(a=>a.classList.toggle('is-current',a.getAttribute('href')==='#'+e.target.id));}),{rootMargin:'-35% 0px -55% 0px'});sections.forEach(s=>navObserver.observe(s));}
})();