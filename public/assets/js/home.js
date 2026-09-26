/* Wish Craft Phase 6 — homepage reveal */
(()=>{
  const items=[...document.querySelectorAll('.wc-reveal')];
  if(!items.length)return;
  if(!('IntersectionObserver' in window)){items.forEach(el=>el.classList.add('is-visible'));return;}
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },{threshold:.12,rootMargin:'0px 0px -30px'});
  items.forEach((el,i)=>{el.style.transitionDelay=Math.min(i%4*55,165)+'ms';observer.observe(el)});
})();
