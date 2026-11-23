(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const progress=document.createElement('div');progress.id='rp-progress';document.body.append(progress);
let scheduled=false;
function updateProgress(){const max=document.documentElement.scrollHeight-innerHeight;progress.style.width=(max>0?scrollY/max*100:0)+'%';scheduled=false;}
addEventListener('scroll',()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(updateProgress);},{passive:true});updateProgress();
const header=$('.site-header'),links=$$('.desktop-nav a[href^="#"]');
const sections=links.map(a=>$(a.getAttribute('href'))).filter(Boolean);
if('IntersectionObserver'in window){
 const toneObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;const light=entry.target.dataset.tone==='light';header?.classList.toggle('header-light',light);document.body.dataset.surface=light?'light':'dark';}),{rootMargin:'-42% 0px -52% 0px',threshold:0});
 $$('main section[data-tone]').forEach(s=>toneObserver.observe(s));
 const navObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;links.forEach(a=>a.classList.toggle('is-current',a.getAttribute('href')==='#'+entry.target.id));}),{rootMargin:'-35% 0px -55% 0px'});
 sections.forEach(s=>navObserver.observe(s));
 if(!reduce){const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target);}),{threshold:.08,rootMargin:'0px 0px -30px 0px'});$$('.rs-reveal,.rs-animate-line').forEach(el=>revealObserver.observe(el));}
}else $$('.rs-reveal,.rs-animate-line').forEach(el=>el.classList.add('is-visible'));
})();