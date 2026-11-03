const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{
    const target=document.querySelector(a.getAttribute('href'));
    if(target){e.preventDefault();target.scrollIntoView({behavior: reduceMotion ? 'auto' : 'smooth'});}
  });
});

document.getElementById('year').textContent = new Date().getFullYear();

// ---------- Mobile menu ----------
(function(){
  const header = document.querySelector('.nav');
  const toggle = header.querySelector('.nav-toggle');
  const menu = document.getElementById('nav-menu');
  function setOpen(open){
    header.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  toggle.addEventListener('click', ()=> setOpen(!header.classList.contains('menu-open')));
  menu.querySelectorAll('a').forEach(a=> a.addEventListener('click', ()=> setOpen(false)));
  document.addEventListener('keydown', e=>{
    if(e.key === 'Escape' && header.classList.contains('menu-open')){ setOpen(false); toggle.focus(); }
  });
  document.addEventListener('click', e=>{
    if(header.classList.contains('menu-open') && !header.contains(e.target)) setOpen(false);
  });
  window.addEventListener('resize', ()=>{ if(window.innerWidth > 800) setOpen(false); });
})();
