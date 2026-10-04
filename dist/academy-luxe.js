/* DigitalBurj Academy — visual system behaviour.
   Progressive enhancement only: it decorates what the Academy already renders (cards, buttons, routes) and adds
   discovery and conversion modules. It never reads or changes learner evidence, scores, access or payments. */
(function(){
'use strict';
var d=document,w=window,reduce=w.matchMedia&&w.matchMedia('(prefers-reduced-motion: reduce)').matches,fine=w.matchMedia&&w.matchMedia('(hover:hover) and (pointer:fine)').matches;
var $=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
function h(tag,cls,html){var e=d.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function hash(s){var x=2166136261;for(var i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,16777619)}return x>>>0}
function rng(seed){var a=seed;return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

/* ---------- subject colour: every field has its own spectrum ---------- */
var PAL={'Foundations':['#14c4b4','#0b6f66','#b6fff3'],'Build & technology':['#7c5cff','#2f249e','#d9d0ff'],'Business & operations':['#3b7dff','#17358f','#cfe0ff'],'AI & automation':['#ff4f9a','#5b35e0','#ffd0e6'],'Creative work':['#ff7a45','#d62f8f','#ffe0cf'],'Professional growth':['#ffb224','#e0300f','#fff0c9'],'Computing & IT':['#19cfff','#2742c9','#d3f6ff'],'Accounting & finance':['#2fd08a','#0a5f4a','#cffbe6'],'Business & management':['#5b6cff','#17237a','#d8dcff'],'Law, governance & society':['#e0b45a','#4a3514','#fff1cf'],'Hospitality, travel & events':['#ff6b5a','#c47a05','#ffe1da'],'Education & training':['#46b6ff','#6a3df0','#d4efff'],'Yoga, fitness & wellbeing':['#8fdc5a','#0f8f7e','#e6ffd0'],'Beauty & personal care':['#ff7eb6','#e0503f','#ffdcec'],'Fashion, art & design':['#d946ef','#e8602a','#fbd5ff'],'Traditional & cultural studies':['#ff9a2e','#7a1426','#ffe3c2'],'Safety, fire & environment':['#f23a1d','#7d1606','#ffd5cc'],'Technical trades':['#6b8bb0','#142f4d','#d9e6f5'],'Agriculture & home science':['#3fae5a','#9bc92c','#dcf7d9']};
var FALLBACK=['#ff7a45','#0b100e','#ffe0cf'];
var G={compass:'<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',code:'<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/>',briefcase:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M3 13h18"/>',spark:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',pen:'<path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 013 3L8 19zM14 7l3 3"/>',trend:'<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',chip:'<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',coins:'<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',org:'<rect x="9" y="3" width="6" height="5" rx="1"/><rect x="3" y="16" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M6 16v-4h12v4"/>',scales:'<path d="M12 4v16M6 20h12M5 7h14M5 7l-3 7a3 3 0 006 0zM19 7l-3 7a3 3 0 006 0z"/>',bell:'<path d="M3 17h18M5 17a7 7 0 0114 0M12 6V4M10 4h4"/>',cap:'<path d="M2 9l10-5 10 5-10 5zM6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/>',lotus:'<path d="M12 20c-4 0-8-3-9-8 4 0 7 2 9 5 2-3 5-5 9-5-1 5-5 8-9 8zM12 17c-2-2-3-5 0-12 3 7 2 10 0 12z"/>',drop:'<path d="M12 3c3.5 4.5 6 7.5 6 11a6 6 0 01-12 0c0-3.5 2.5-6.5 6-11z"/><path d="M9.5 14.5a2.5 2.5 0 002.5 2.5"/>',palette:'<path d="M12 3a9 9 0 100 18c1.2 0 2-.8 2-1.8 0-1.2-1-1.3-1-2.4 0-1 .8-1.8 1.8-1.8H17a4 4 0 004-4c0-4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',shield:'<path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',wrench:'<path d="M15 4a5 5 0 00-4.6 7L3 18.4 5.6 21 13 13.6A5 5 0 0020 9l-3 3-3-1-1-3z"/>',leaf:'<path d="M5 19C5 10 10 4 20 4c0 10-6 15-15 15zM5 19l8-8"/>'};
var CATG={'Foundations':'compass','Build & technology':'code','Business & operations':'briefcase','AI & automation':'spark','Creative work':'pen','Professional growth':'trend','Computing & IT':'chip','Accounting & finance':'coins','Business & management':'org','Law, governance & society':'scales','Hospitality, travel & events':'bell','Education & training':'cap','Yoga, fitness & wellbeing':'lotus','Beauty & personal care':'drop','Fashion, art & design':'palette','Traditional & cultural studies':'sun','Safety, fire & environment':'shield','Technical trades':'wrench','Agriculture & home science':'leaf'};
function svgIcon(name){return '<svg viewBox="0 0 24 24" aria-hidden="true">'+(G[name]||G.compass)+'</svg>'}

/* ---------- generated cover art: six motifs, seeded per course so no two covers repeat ---------- */
function art(id,pal){
  var r=rng(hash(id)),m=hash(id)%6,c3=pal[2],o='';
  if(m===0){var n=9+Math.floor(r()*5),x=0,bw=320/n;for(var i=0;i<n;i++){var ht=30+r()*88;o+='<rect x="'+(i*bw+3).toFixed(1)+'" y="'+(150-ht).toFixed(1)+'" width="'+(bw-6).toFixed(1)+'" height="'+ht.toFixed(1)+'" rx="3" fill="#fff" fill-opacity="'+(.10+r()*.22).toFixed(2)+'"/>';if(r()>.55)o+='<rect x="'+(i*bw+3).toFixed(1)+'" y="'+(150-ht).toFixed(1)+'" width="'+(bw-6).toFixed(1)+'" height="5" rx="2" fill="'+c3+'" fill-opacity=".9"/>'}}
  else if(m===1){var cx=60+r()*200,cy=30+r()*80;for(var k=1;k<=6;k++)o+='<circle cx="'+cx.toFixed(0)+'" cy="'+cy.toFixed(0)+'" r="'+(k*(16+r()*8)).toFixed(0)+'" fill="none" stroke="#fff" stroke-opacity="'+(.34-k*.04).toFixed(2)+'" stroke-width="'+(k===2?2.4:1.2)+'"/>';o+='<circle cx="'+cx.toFixed(0)+'" cy="'+cy.toFixed(0)+'" r="7" fill="'+c3+'"/>'}
  else if(m===2){for(var j=0;j<7;j++){var y=18+j*20,a=6+r()*16,p=r()*6,path='M0 '+y;for(var xx=0;xx<=320;xx+=20)path+=' L'+xx+' '+(y+Math.sin(xx/38+p)*a).toFixed(1);o+='<path d="'+path+'" fill="none" stroke="'+(j===3?c3:'#fff')+'" stroke-opacity="'+(j===3?.95:.2+r()*.2).toFixed(2)+'" stroke-width="'+(j===3?2.4:1.4)+'"/>'}}
  else if(m===3){var cols=16,rows=8,ox=r()*18;for(var a2=0;a2<rows;a2++)for(var b=0;b<cols;b++){var dist=Math.abs((b/cols)-(a2/rows)*.9-.2-r()*.05);o+='<circle cx="'+(b*21+ox).toFixed(0)+'" cy="'+(a2*21+8)+'" r="'+(1.2+Math.max(0,1-dist*2.2)*4.2).toFixed(1)+'" fill="'+(dist<.1?c3:'#fff')+'" fill-opacity="'+(dist<.1?.95:.28).toFixed(2)+'"/>'}}
  else if(m===4){var s=26+Math.floor(r()*14),q=[];for(var yy=-1;yy<7;yy++)for(var x2=-1;x2<14;x2++){var px=x2*s*.87,py=yy*s+(x2%2?s/2:0),f=r();if(f>.45)o+='<path d="M'+(px)+' '+(py-s/2)+' l'+(s*.43)+' '+(s*.25)+' v'+(s*.5)+' l-'+(s*.43)+' '+(s*.25)+' l-'+(s*.43)+' -'+(s*.25)+' v-'+(s*.5)+'z" fill="'+(f>.93?c3:'#fff')+'" fill-opacity="'+(f>.93?.9:(.05+f*.16)).toFixed(2)+'"/>'}}
  else{var nodes=[],cnt=7+Math.floor(r()*4);for(var t=0;t<cnt;t++)nodes.push([20+r()*280,16+r()*118,2+r()*4]);for(var u=0;u<nodes.length;u++)for(var v=u+1;v<nodes.length;v++){var dx=nodes[u][0]-nodes[v][0],dy=nodes[u][1]-nodes[v][1];if(dx*dx+dy*dy<8200)o+='<line x1="'+nodes[u][0].toFixed(0)+'" y1="'+nodes[u][1].toFixed(0)+'" x2="'+nodes[v][0].toFixed(0)+'" y2="'+nodes[v][1].toFixed(0)+'" stroke="#fff" stroke-opacity=".3"/>'}nodes.forEach(function(n,ix){o+='<circle cx="'+n[0].toFixed(0)+'" cy="'+n[1].toFixed(0)+'" r="'+(n[2]+2).toFixed(1)+'" fill="'+(ix%3===0?c3:'#fff')+'" fill-opacity="'+(ix%3===0?.95:.8)+'"/>'})}
  return '<svg class="art" viewBox="0 0 320 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><radialGradient id="g'+hash(id)+'" cx="85%" cy="0%" r="80%"><stop offset="0" stop-color="'+c3+'" stop-opacity=".55"/><stop offset="1" stop-color="'+c3+'" stop-opacity="0"/></radialGradient></defs><rect width="320" height="150" fill="url(#g'+hash(id)+')"/>'+o+'</svg>'
}
function decorateCards(root){
  $$('.course-card:not([data-lx])',root).forEach(function(card,idx){
    card.setAttribute('data-lx','1');
    var cat=($('.course-card-body .small.muted',card)||{}).textContent||'',id=card.getAttribute('data-course')||($('h3',card)||{}).textContent||String(idx),pal=PAL[cat.trim()]||FALLBACK;
    var cover=h('div','lx-cover',art(id,pal)+'<span class="glyph">'+svgIcon(CATG[cat.trim()]||'compass')+'</span><span class="tag">'+esc(cat.trim()||'Course')+'</span>');
    cover.style.setProperty('--c1',pal[0]);cover.style.setProperty('--c2',pal[1]);
    var body=$('.course-card-body',card);if(body)card.insertBefore(cover,body);else card.appendChild(cover);
    card.classList.add('lx-spot');if(fine)card.classList.add('lx-tilt');
  });
}

/* ---------- pointer choreography: spotlight, tilt, magnetic CTAs ---------- */
var mag=null;
function pointer(e){
  var t=e.target&&e.target.closest?e.target.closest('.lx-spot'):null;
  if(t){var b=t.getBoundingClientRect(),x=e.clientX-b.left,y=e.clientY-b.top;t.style.setProperty('--sx',x+'px');t.style.setProperty('--sy',y+'px');
    if(t.classList.contains('lx-tilt')&&!reduce){t.style.setProperty('--ry',((x/b.width-.5)*6).toFixed(2)+'deg');t.style.setProperty('--rx',((.5-y/b.height)*5).toFixed(2)+'deg')}}
  if(reduce)return;
  var btn=e.target&&e.target.closest?e.target.closest('.btn.primary,.lx-cta,.btn.wa'):null;
  if(btn){var r=btn.getBoundingClientRect();btn.style.setProperty('--mx-x',((e.clientX-r.left-r.width/2)*.14).toFixed(1)+'px');btn.style.setProperty('--mx-y',((e.clientY-r.top-r.height/2)*.22).toFixed(1)+'px');mag=btn}
  else if(mag){mag.style.setProperty('--mx-x','0px');mag.style.setProperty('--mx-y','0px');mag=null}
}
function leave(e){var t=e.target&&e.target.closest?e.target.closest('.lx-tilt'):null;if(t){t.style.setProperty('--rx','0deg');t.style.setProperty('--ry','0deg')}}
if(fine){d.addEventListener('pointermove',pointer,{passive:true});d.addEventListener('pointerout',leave,{passive:true})}

/* ---------- reveal on scroll ---------- */
var io=null;
if('IntersectionObserver' in w&&!reduce){io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target)}})},{rootMargin:'0px 0px -6% 0px',threshold:.06})}
function reveal(root){
  var sel='.course-card,.panel,.journey-item,.lx-tile,.lx-flow>div,.lx-chip,.dashboard-feature,.guide-invitation,.certificate,.sequence,.order-list>*';
  var n=0;$$(sel,root).forEach(function(el){
    if(el.getAttribute('data-lxr')||el.closest('.lx-marquee')||el.closest('.lx-rail'))return;el.setAttribute('data-lxr','1');
    if(!io){return}
    var r=el.getBoundingClientRect();if(r.top<w.innerHeight*.9&&r.bottom>0){return}
    el.style.setProperty('--i',String(Math.min(n++%6,5)));el.classList.add('lx-reveal');io.observe(el)
  });
}

/* ---------- progress bar, parallax ---------- */
var defs=h('div','','<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="lxg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb224"/><stop offset="1" stop-color="#f23a1d"/></linearGradient></defs></svg>');
var bar=h('div','lx-progress','<i></i>');bar.setAttribute('aria-hidden','true');
var ticking=false;
function onScroll(){if(ticking)return;ticking=true;w.requestAnimationFrame(function(){ticking=false;var max=d.documentElement.scrollHeight-w.innerHeight,p=max>0?w.scrollY/max:0;bar.firstChild.style.setProperty('--p',p.toFixed(4));var bg=$('.lx-hero-bg');if(bg&&!reduce)bg.style.setProperty('--py',(Math.min(w.scrollY,600)*.18).toFixed(1)+'px')})}
w.addEventListener('scroll',onScroll,{passive:true});

/* ---------- home: cinematic hero, discovery marquee, learn-your-way ---------- */
var CATS=Object.keys(PAL);
var small=w.matchMedia&&w.matchMedia('(max-width:700px)').matches;
function scene(n){return '/brand/scene/s'+n+(small?'-m':'-d')+'.webp'}
function countUp(el){var to=parseInt(el.getAttribute('data-to'),10),t0=null;if(reduce){el.textContent=to.toLocaleString('en-US');return}function step(ts){t0=t0||ts;var p=Math.min((ts-t0)/1300,1),e=1-Math.pow(1-p,4);el.textContent=Math.round(to*e).toLocaleString('en-US');if(p<1)w.requestAnimationFrame(step)}w.requestAnimationFrame(step)}
function typeTerminal(pre){
  var lines=[['<span class="p">$</span> academy start <span class="vi">--course</span> web',0],['<span class="ok">✓</span> understand   <span class="dim">read the brief</span>',1],['<span class="ok">✓</span> explain      <span class="dim">say it in words</span>',1],['<span class="p">▸</span> build        <span class="dim">live workspace</span>',1],['<span class="dim">○ test &amp; fix   break it, then repair it</span>',1],['<span class="dim">○ prove        submit evidence</span>',1]],i=0;
  if(reduce){pre.innerHTML=lines.map(function(l){return l[0]}).join('\n');return}
  pre.innerHTML='';function next(){if(i>=lines.length){pre.insertAdjacentHTML('beforeend','\n<span class="p">$</span> <span class="caret"></span>');return}pre.insertAdjacentHTML('beforeend',(i?'\n':'')+lines[i][0]);i++;setTimeout(next,i===1?650:520)}setTimeout(next,500)}
function buildHero(main){
  var cta=$('.continue-course a.btn.primary,.dashboard-feature a.btn.primary,.dashboard-feature a.btn',main),href=cta?cta.getAttribute('href'):'#paths',label=cta&&/continue|start|open/i.test(cta.textContent)?cta.textContent.trim():'Start learning';
  var hero=h('section','lx-hero','<div class="lx-hero-bg" style="--img:url('+scene('03')+')"></div><div><span class="lx-eyebrow">Learn it. Apply it. Prove it.</span><h2 class="lx-title">Skills you can <em>prove</em>.</h2><p class="lx-lead">Practical courses across technology, business and the trades. Each one is built around real projects, a live practice workspace and evidence you can show an employer or client.</p><div class="lx-actions"><a class="btn primary lx-cta" href="'+esc(href||'#paths')+'">'+esc(label)+'</a><a class="btn ghost-light" href="#paths">Browse all courses</a></div><div class="lx-stats"><div><b data-to="129">0</b><span>Practical courses</span></div><div><b data-to="1290">0</b><span>Guided projects</span></div><div><b data-to="19">0</b><span>Fields of work</span></div></div></div><div class="lx-term" aria-hidden="true"><div class="lx-term-bar"><i></i><i></i><i></i><span>academy — practice workspace</span></div><pre></pre><div class="lx-term-foot"><span>12-stage workflow</span><span>Evidence, not points</span><span>Teacher review</span></div></div>');
  var seen=false,fire=function(){if(seen)return;seen=true;$$('[data-to]',hero).forEach(countUp);typeTerminal($('pre',hero))};
  hero.arm=function(){if(io&&'IntersectionObserver' in w){var o=new IntersectionObserver(function(es){if(es[0].isIntersecting){fire();o.disconnect()}},{threshold:.15});o.observe(hero);setTimeout(fire,2500)}else fire()};
  return hero;
}
function goCategory(cat){
  var go=function(){var sel=$('#course-category');if(!sel)return false;sel.value=cat||'';['input','change'].forEach(function(t){sel.dispatchEvent(new Event(t,{bubbles:true}))});var s=$('#path-search');if(s){var top=s.getBoundingClientRect().top+w.scrollY-110;w.scrollTo({top:top,behavior:reduce?'auto':'smooth'})}syncRail();return true};
  if(location.hash==='#paths'&&go())return;location.hash='#paths';var tries=0,t=setInterval(function(){if(go()||++tries>30)clearInterval(t)},100)
}
function chip(cat){var p=PAL[cat]||FALLBACK,b=h('button','lx-chip','<i></i>'+esc(cat));b.type='button';b.style.setProperty('--c1',p[0]);b.style.setProperty('--c2',p[1]);b.setAttribute('data-cat',cat);b.addEventListener('click',function(){goCategory(cat)});return b}
function buildMarquee(){var track=h('div','lx-marquee-track');CATS.concat(CATS).forEach(function(c,i){var b=chip(c);if(i>=CATS.length){b.setAttribute('aria-hidden','true');b.tabIndex=-1}track.appendChild(b)});var m=h('div','lx-marquee');m.setAttribute('aria-label','Browse by field of work');m.appendChild(track);return m}
function buildRail(){var rail=h('div','lx-rail');rail.setAttribute('role','group');rail.setAttribute('aria-label','Filter by field of work');var all=chip('All fields');all.removeAttribute('data-cat');all.setAttribute('data-cat','');all.firstChild.style.background='linear-gradient(135deg,#f23a1d,#ffb224)';all.onclick=function(){goCategory('')};rail.appendChild(all);CATS.forEach(function(c){rail.appendChild(chip(c))});return rail}
function syncRail(){var sel=$('#course-category'),rail=$('.lx-rail');if(!sel||!rail)return;$$('.lx-chip',rail).forEach(function(b){b.classList.toggle('on',(b.getAttribute('data-cat')||'')===sel.value)})}

var deferred=null;w.addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferred=e});
function sheet(html){var s=$('.lx-sheet')||h('div','lx-sheet');s.innerHTML='<div class="lx-sheet-card" role="dialog" aria-modal="true">'+html+'<button class="btn dark" type="button" data-close>Got it</button></div>';if(!s.parentNode)d.body.appendChild(s);s.classList.add('open');s.onclick=function(e){if(e.target===s||e.target.hasAttribute('data-close'))s.classList.remove('open')}}
function buildWay(main){
  var titles=$$('.course-card h3',main).map(function(x){return x.textContent.trim()}).filter(Boolean).slice(0,12),opts=(titles.length?titles:['Digital confidence','Websites & product building','Data & decision making']).map(function(t){return '<option>'+esc(t)+'</option>'}).join('');
  var sec=h('section','lx-way','<div class="lx-way-head"><div><span class="label">Learn your way</span><h2>Web, phone or WhatsApp.<br>Same Academy, wherever you are.</h2></div><p>Practise in the full workspace on a laptop, keep the Academy on your phone’s home screen, and send yourself a study plan on WhatsApp.</p></div><div class="lx-bento">'+
  '<article class="lx-tile web lx-spot" style="--img:url('+scene('20')+')"><div class="img"></div><div class="ico">'+svgIcon('code')+'</div><span class="k">Web app</span><h3>The full practice workspace</h3><p>Editors, data tools, API and workflow simulators, all with fictional data. Build, break and fix inside your browser.</p><div class="row"><a class="btn primary lx-cta" href="workspace.html">Open the workspace</a><a class="btn ghost-light" href="#studio">Guided tools</a></div></article>'+
  '<article class="lx-tile mob lx-spot" style="--img:url('+scene('21')+')"><div class="img"></div><div class="ico"><svg viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg></div><span class="k">Mobile app</span><h3>Add Academy to your phone</h3><p>Install it like an app: full-screen, one tap from your home screen, ready for a ten-minute lesson on the bus.</p><div class="row"><button class="btn primary lx-cta" type="button" data-install>Install on my phone</button></div></article>'+
  '<article class="lx-tile wa lx-spot" style="--img:url('+scene('12')+')"><div class="img"></div><div class="ico"><svg viewBox="0 0 24 24"><path d="M3 21l1.6-4.6A8.5 8.5 0 1112 20.5a8.4 8.4 0 01-4.1-1.1z"/><path d="M9 9.5c.4 2.2 2.3 4.1 5 5l1.2-1.2-1.8-1-.8.6c-.8-.4-1.5-1.1-1.9-1.9l.6-.8-1-1.8z"/></svg></div><span class="k">WhatsApp</span><h3>Send my study plan</h3><form class="lx-wa-form" data-wa><select aria-label="Course" name="course">'+opts+'</select><select aria-label="Hours each week" name="hours"><option>2 hours a week</option><option selected>5 hours a week</option><option>8 hours a week</option><option>10 hours a week</option></select></form><div class="row"><button class="btn wa" type="button" data-wa-send>Open in WhatsApp</button></div></article></div>');
  sec.addEventListener('click',function(e){
    var b=e.target.closest('button');if(!b)return;
    if(b.hasAttribute('data-install')){if(deferred){deferred.prompt();deferred=null}else sheet('<h3>Add Academy to your home screen</h3><p class="muted">Your browser installs it from its own menu.</p><ol><li><b>iPhone / iPad (Safari):</b> tap Share, then <b>Add to Home Screen</b>.</li><li><b>Android (Chrome):</b> tap the ⋮ menu, then <b>Install app</b>.</li><li><b>Computer (Chrome / Edge):</b> use the install icon in the address bar.</li></ol>')}
    if(b.hasAttribute('data-wa-send')){var f=$('[data-wa]',sec),msg='My DigitalBurj Academy plan\n• Course: '+f.course.value+'\n• Time: '+f.hours.value+'\n• Learn it. Apply it. Prove it.\nStart here: '+w.location.origin+'/';w.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank','noopener')}
  });
  return sec;
}
function buildFlow(){
  var steps=[['01','Understand','Read the brief and inspect real evidence before touching a tool.',['#14c4b4','#0b6f66'],'25%'],['02','Build','Work in the live workspace with a calm explanation beside every step.',['#7c5cff','#2f249e'],'50%'],['03','Test & fix','Break it on purpose, read the failure and repair it.',['#ffb224','#e0300f'],'75%'],['04','Prove','Submit your evidence for review and keep a record you can verify.',['#f23a1d','#ff7a45'],'100%']];
  var f=h('section','lx-flow');steps.forEach(function(s){var c=h('div','','<b>'+s[0]+'</b><h4>'+s[1]+'</h4><p>'+s[2]+'</p>');c.style.setProperty('--c1',s[3][0]);c.style.setProperty('--c2',s[3][1]);c.style.setProperty('--w',s[4]);f.appendChild(c)});return f}

/* ---------- mobile dock ---------- */
function buildDock(){
  if($('.lx-dock')||!$('.academy-shell'))return;
  var nav=$$('#navigation a.nav-link');if(!nav.length)return;
  var find=function(re){return nav.filter(function(a){return re.test(a.textContent)})[0]};
  var items=[[find(/my courses/i),'Home','<path d="M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/>'],[find(/browse/i),'Courses','<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>'],[find(/practice workspace/i),'Practice','<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/>'],[find(/learning plan|my activity/i),'Plan','<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>']];
  var dock=h('nav','lx-dock');dock.setAttribute('aria-label','Quick navigation');
  items.forEach(function(it){if(!it[0])return;var a=h('a','','<svg viewBox="0 0 24 24" aria-hidden="true">'+it[2]+'</svg><span>'+it[1]+'</span>');a.href=it[0].getAttribute('href');a.setAttribute('data-nav',it[0].getAttribute('href'));dock.appendChild(a)});
  var more=h('button','','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10"/></svg><span>Menu</span>');more.type='button';more.addEventListener('click',function(){var m=$('#mobile-menu');if(m)m.click()});dock.appendChild(more);
  d.body.appendChild(dock);markDock();
}
function markDock(){var dock=$('.lx-dock');if(!dock)return;var cur=location.hash||'#home';$$('a',dock).forEach(function(a){var t=a.getAttribute('data-nav')||'';a.classList.toggle('on',t.slice(-cur.length)===cur&&t.indexOf('#')>-1||(cur==='#home'&&/#home$/.test(t)))})}

/* ---------- route lifecycle ---------- */
var busy=false,lastRoute=null;
function enhance(){
  if(busy)return;busy=true;
  try{
    var main=$('#main');
    if(main){
      var route=main.dataset.route||'';
      if(route!==lastRoute){lastRoute=route;if(!reduce){main.classList.remove('lx-enter');void main.offsetWidth;main.classList.add('lx-enter');setTimeout(function(){main.classList.remove('lx-enter')},1100)}w.scrollTo({top:0,behavior:'instant'})}
      if(route==='home'&&!$('.lx-hero',main)&&$('.page-head',main)){
        var hero=buildHero(main),mq=buildMarquee();main.insertBefore(mq,main.firstChild);main.insertBefore(hero,main.firstChild);hero.arm();
        if(!$('.lx-way',main)){main.appendChild(buildWay(main));main.appendChild(buildFlow())}
      }
      if(route==='paths'&&!$('.lx-rail',main)){var s=$('#path-search',main);if(s){var host=s.closest('.toolbar')||s.parentNode;host.parentNode.insertBefore(buildRail(),host);syncRail();var sel=$('#course-category');if(sel&&!sel.__lx){sel.__lx=1;sel.addEventListener('change',syncRail)}}}
      decorateCards(main);
    }
    $$('.panel,.journey-item,.lx-tile,.sequence',d).forEach(function(el){if(!el.classList.contains('lx-spot')&&!el.closest('.recipe-main,.recipe-sheet')&&!el.hasAttribute('data-lxs')){el.setAttribute('data-lxs','1');el.classList.add('lx-spot')}});
    reveal(d);buildDock();markDock();
  }catch(err){if(w.console)console.warn('academy-luxe',err)}
  busy=false;
}
var raf=0;function schedule(){if(raf)return;raf=w.requestAnimationFrame(function(){raf=0;enhance()})}
function boot(){
  d.body.appendChild(bar);d.body.appendChild(defs);onScroll();enhance();
  var main=$('#main'),nav=$('#navigation');
  var mo=new MutationObserver(schedule);if(main)mo.observe(main,{childList:true,subtree:true,attributes:true,attributeFilter:['data-route']});if(nav)mo.observe(nav,{childList:true});
  w.addEventListener('hashchange',function(){schedule();markDock()});
  d.documentElement.classList.add('lx');
}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot);else boot();
})();
