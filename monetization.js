// Configure only on the approved public deployment.
const publisher = '';
const slot = '';

if (/^ca-pub-\d+$/.test(publisher) && /^\d+$/.test(slot)) {
  const panel = document.getElementById('sponsor');
  const label = document.createElement('p');
  label.textContent = 'Advertisement';
  const unit = document.createElement('ins');
  unit.className = 'adsbygoogle';
  unit.style.display = 'block';
  unit.dataset.adClient = publisher;
  unit.dataset.adSlot = slot;
  unit.dataset.adFormat = 'auto';
  unit.dataset.fullWidthResponsive = 'true';
  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + publisher;
  script.onload = () => (window.adsbygoogle = window.adsbygoogle || []).push({});
  script.onerror = () => { panel.hidden = true; };
  panel.append(label, unit);
  panel.hidden = false;
  document.head.append(script);
}
