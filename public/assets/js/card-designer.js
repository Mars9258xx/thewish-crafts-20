(function(){
  const $=id=>document.getElementById(id);
  const themes=[
    {a:'#E91E63',b:'#FBC9DB',bg:'#FFF4F8'},
    {a:'#8F174F',b:'#E5C9D7',bg:'#FBF3F7'},
    {a:'#D89A57',b:'#F4DFC5',bg:'#FFF9F0'},
    {a:'#4F8A78',b:'#CDE7DD',bg:'#F2FBF7'},
    {a:'#6B6FA8',b:'#DADBF1',bg:'#F6F6FD'},
    {a:'#B85B52',b:'#F0D1CD',bg:'#FFF7F5'}
  ];
  let theme=0, sticker='🎂', align='center', photoData='';
  const occasion=$('occasion'), name=$('name'), from=$('from'), message=$('message'), age=$('age'), customTitle=$('customTitle'), font=$('font'), photo=$('photo');
  function renderThemes(){ $('themes').innerHTML=themes.map((t,i)=>`<button type="button" class="cd-theme ${i===theme?'active':''}" aria-label="Theme ${i+1}" style="background:linear-gradient(135deg,${t.bg},${t.b})" data-theme="${i}"></button>`).join(''); document.querySelectorAll('.cd-theme').forEach(b=>b.onclick=()=>{theme=+b.dataset.theme;renderThemes();render()}); }
  function title(){if(customTitle.value.trim()) return customTitle.value.trim(); const o=occasion.value; if(o==='Birthday'){const a=age.value.trim();return a?`Happy ${a}${/1$/.test(a)?'st':/2$/.test(a)?'nd':/3$/.test(a)?'rd':'th'} Birthday`:'Happy Birthday'} if(o==='Anniversary') return 'Happy Anniversary'; if(o==='Thank You') return 'Thank You'; return 'A Little Note For You';}
  function render(){const t=themes[theme], card=$('card'); $('cardTitle').textContent=title(); $('cardName').textContent=name.value.trim()||'Your Name'; $('cardMessage').textContent=message.value.trim()||'A little message made just for you.'; $('cardFrom').textContent='With love, '+(from.value.trim()||'Someone Special'); $('cardSticker').textContent=sticker; $('cardKicker').textContent=occasion.value.toUpperCase(); card.style.setProperty('--card-accent',t.a);card.style.setProperty('--card-border',t.b);card.style.setProperty('--card-bg',t.bg); card.style.textAlign=align; $('cardContent').style.textAlign=align; $('cardTitle').style.fontFamily=font.value; $('cardName').style.fontFamily=font.value==='"Dancing Script",cursive'?'"Dancing Script",cursive':font.value; card.classList.toggle('has-photo',!!photoData); $('cardPhoto').src=photoData||''; }
  document.querySelectorAll('[data-sticker]').forEach(b=>b.onclick=()=>{sticker=b.dataset.sticker;document.querySelectorAll('[data-sticker]').forEach(x=>x.classList.remove('active'));b.classList.add('active');render()});
  document.querySelectorAll('[data-align]').forEach(b=>b.onclick=()=>{align=b.dataset.align;document.querySelectorAll('[data-align]').forEach(x=>x.classList.remove('active'));b.classList.add('active');render()});
  [occasion,name,from,message,age,customTitle,font].forEach(x=>x.addEventListener('input',render)); occasion.addEventListener('change',()=>{age.closest('.cd-field').style.display=occasion.value==='Birthday'?'block':'none';render()});
  photo.addEventListener('change',()=>{const f=photo.files&&photo.files[0];if(!f){photoData='';render();return} if(!f.type.startsWith('image/')){alert('Please choose an image file.');photo.value='';return} const r=new FileReader();r.onload=()=>{photoData=r.result;render()};r.readAsDataURL(f)});
  $('download').onclick=async()=>{if(typeof html2canvas==='undefined'){alert('Export library load nahi hui. Internet connection check karke dobara try karein.');return} const canvas=await html2canvas($('card'),{scale:3,backgroundColor:null,useCORS:true});const a=document.createElement('a');a.download='WishCraft-Card.png';a.href=canvas.toDataURL('image/png');a.click()};
  $('reset').onclick=()=>{occasion.value='Birthday';name.value='Ananya';from.value='Someone Special';message.value='May your day be filled with beautiful moments, genuine smiles and all the happiness you deserve. Keep shining! ✨';age.value='21';customTitle.value='';font.value='"Playfair Display", Georgia, serif';photo.value='';photoData='';theme=0;sticker='🎂';align='center';document.querySelectorAll('[data-sticker]').forEach(x=>x.classList.remove('active'));document.querySelector('[data-sticker="🎂"]').classList.add('active');document.querySelectorAll('[data-align]').forEach(x=>x.classList.toggle('active',x.dataset.align==='center'));renderThemes();occasion.dispatchEvent(new Event('change'))};
  renderThemes(); occasion.dispatchEvent(new Event('change')); render();
})();
