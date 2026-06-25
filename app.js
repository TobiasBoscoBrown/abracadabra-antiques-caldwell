(function(){
  "use strict";
  var PHONE_TEL = "+12084546446";
  var PHONE_SMS = "12084546446";
  var EMAIL = "hello@abracadabra-antiques-caldwell.vercel.app"; // display-only; handoff uses SMS/tel primarily
  var BIZ = "Abracadabra Antiques";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function(s,r){return (r||document).querySelector(s);};
  var $$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};

  // year
  var yr=$("#yr"); if(yr) yr.textContent=new Date().getFullYear();

  // header scrolled
  var head=$("#siteHead");
  function onScroll(){ if(head) head.classList.toggle("scrolled", window.scrollY>20); }
  onScroll(); window.addEventListener("scroll", onScroll, {passive:true});

  // mobile menu
  var burger=$("#burger"), mnav=$("#mobileNav");
  if(burger&&mnav){
    burger.addEventListener("click",function(){
      var open=burger.classList.toggle("open");
      burger.setAttribute("aria-expanded", open?"true":"false");
      if(open){mnav.hidden=false;} else {mnav.hidden=true;}
    });
    $$("a",mnav).forEach(function(a){a.addEventListener("click",function(){burger.classList.remove("open");burger.setAttribute("aria-expanded","false");mnav.hidden=true;});});
  }

  // open/closed status
  var HOURS={0:[11,16],1:[11,17],2:[11,17],3:[11,17],4:[11,17],5:[11,17],6:[11,16]};
  function setStatus(){
    var el=$("#openStatus"); if(!el) return;
    var now=new Date(), d=now.getDay(), h=now.getHours()+now.getMinutes()/60;
    var rng=HOURS[d], open=rng && h>=rng[0] && h<rng[1];
    el.classList.toggle("open",!!open); el.classList.toggle("closed",!open);
    var txt=$(".status-txt",el);
    function fmt(x){var hh=x%12||12;return hh+(x>=12?" PM":" AM");}
    if(txt){
      if(open){ txt.textContent="Open till "+fmt(rng[1]); }
      else {
        // find next open
        for(var i=0;i<7;i++){var nd=(d+i)%7;var r=HOURS[nd];if(r){ if(i===0 && h<r[0]){txt.textContent="Opens "+fmt(r[0]);return;} if(i>0){var nm=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][nd];txt.textContent="Opens "+nm+" "+fmt(r[0]);return;} }}
        txt.textContent="Closed";
      }
    }
  }
  setStatus(); setInterval(setStatus,60000);

  // FAQ accordion
  $$(".qa").forEach(function(qa){
    var b=$("button",qa), ans=$(".ans",qa);
    if(!b||!ans) return;
    b.setAttribute("aria-expanded","false");
    b.addEventListener("click",function(){
      var open=qa.classList.toggle("open");
      b.setAttribute("aria-expanded",open?"true":"false");
      ans.style.maxHeight = open ? ans.scrollHeight+"px" : null;
    });
  });

  /* ---------- SCROLL-LINKED ANIMATED HERO (signature feature) ---------- */
  var hero=$(".hero");
  if(hero && !reduce){
    document.body.classList.add("sr");
    var img=$(".hero-bg img",hero);
    var frame=$(".hero-frame [data-draw]",hero);
    var revs=$$(".reveal",hero);
    // prepare frame stroke draw
    var paths = frame ? $$("path,line,circle",frame) : [];
    paths.forEach(function(p){ try{var L=p.getTotalLength?p.getTotalLength():400; p.style.strokeDasharray=L; p.style.strokeDashoffset=L;}catch(e){} });
    var ticking=false;
    function frameUpdate(){
      ticking=false;
      var rect=hero.getBoundingClientRect();
      var vh=window.innerHeight||1;
      // progress 0..1 across the hero scroll
      var prog = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
      if(img){ img.style.transform="translateY("+(prog*70 - 10)+"px) scale(1.06)"; }
      var dp=Math.min(1, prog*2.0);
      paths.forEach(function(p){ var L=parseFloat(p.style.strokeDasharray)||400; p.style.strokeDashoffset = L*(1-dp); });
    }
    function onS(){ if(!ticking){ ticking=true; requestAnimationFrame(frameUpdate);} }
    window.addEventListener("scroll", onS, {passive:true});
    window.addEventListener("resize", onS);
    // staged reveal of hero text on load
    requestAnimationFrame(function(){ frameUpdate(); revs.forEach(function(el,i){ setTimeout(function(){el.classList.add("in");}, 120+i*120); }); });
  }
  // general reveal-on-scroll for sections (only if sr active)
  if(!reduce && "IntersectionObserver" in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target);} });},{threshold:.12,rootMargin:"0px 0px -8% 0px"});
    document.body.classList.add("sr");
    $$(".reveal").forEach(function(el){ if(!hero||!hero.contains(el)) io.observe(el); });
  } else {
    $$(".reveal").forEach(function(el){el.classList.add("in");});
  }

  /* ---------- RESERVE ROOM (SHOP MODULE) ---------- */
  var KEY="abracadabra_holds_v1";
  function load(){ try{return JSON.parse(localStorage.getItem(KEY))||[];}catch(e){return [];} }
  function save(items){ try{localStorage.setItem(KEY,JSON.stringify(items));}catch(e){} }
  var items=load();

  function count(){ return items.reduce(function(s,i){return s+i.qty;},0); }
  function syncCount(){
    var n=count();
    $$("#holdCount").forEach(function(el){el.textContent=n;});
    $$(".hold-chip").forEach(function(el){el.classList.toggle("has",n>0);});
    var oc=$("#openCart .cc"); if(oc) oc.textContent=n;
  }
  function find(id){ for(var i=0;i<items.length;i++){ if(items[i].id===id) return items[i]; } return null; }
  function add(id,name,qty){ var it=find(id); if(it){it.qty+=qty;} else {items.push({id:id,name:name,qty:qty});} save(items); syncCount(); renderDrawer(); }
  function setQty(id,q){ var it=find(id); if(it){ it.qty=Math.max(1,q);} save(items); syncCount(); renderDrawer(); }
  function remove(id){ items=items.filter(function(i){return i.id!==id;}); save(items); syncCount(); renderDrawer(); }

  // product cards (shop + home featured)
  $$("[data-add]").forEach(function(card){
    var id=card.getAttribute("data-id"), name=card.getAttribute("data-name");
    var qEl=$(".qv",card), btn=$(".add-btn",card);
    if($(".qminus",card)) $(".qminus",card).addEventListener("click",function(){ if(qEl){var v=Math.max(1,(parseInt(qEl.value,10)||1)-1);qEl.value=v;} });
    if($(".qplus",card)) $(".qplus",card).addEventListener("click",function(){ if(qEl){var v=Math.max(1,(parseInt(qEl.value,10)||1)+1);qEl.value=v;} });
    if(btn) btn.addEventListener("click",function(){
      var q=qEl?Math.max(1,parseInt(qEl.value,10)||1):1;
      add(id,name,q);
      btn.classList.add("added"); var t=btn.querySelector(".lbl");
      if(t){var old=t.textContent;t.textContent="Added";setTimeout(function(){t.textContent=old;btn.classList.remove("added");},1100);}
      openDrawer();
    });
  });

  // drawer
  var drawer=$("#drawer"), back=$("#drawerBack");
  function openDrawer(){ if(drawer){drawer.classList.add("on"); drawer.style.transform="none";} if(back){back.classList.add("on");} renderDrawer(); }
  function closeDrawer(){ if(drawer){drawer.classList.remove("on"); drawer.style.transform="";} if(back){back.classList.remove("on");} }
  $$("[data-open-cart]").forEach(function(b){b.addEventListener("click",function(e){e.preventDefault();openDrawer();});});
  if($("#drawerClose")) $("#drawerClose").addEventListener("click",closeDrawer);
  if(back) back.addEventListener("click",closeDrawer);
  document.addEventListener("keydown",function(e){ if(e.key==="Escape") closeDrawer(); });

  function escapeHtml(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}

  function renderDrawer(){
    var body=$("#drawerItems"); if(!body) return;
    if(!items.length){ body.innerHTML='<div class="drawer-empty">Your hold list is empty. Add a few finds you would like us to set aside, then send the list and we will hold them at the counter.</div>'; }
    else {
      body.innerHTML=items.map(function(it){
        return '<div class="li"><div class="liic"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l9-9 9 9-9 9z"/></svg></div>'+
        '<div class="lim"><b>'+escapeHtml(it.name)+'</b><div class="lp">Ask at counter for pricing</div>'+
        '<div class="liq"><button data-dec="'+it.id+'" aria-label="Decrease">&minus;</button><span>'+it.qty+'</span><button data-inc="'+it.id+'" aria-label="Increase">+</button></div>'+
        '<button class="rm" data-rm="'+it.id+'">Remove</button></div></div>';
      }).join("");
      $$("[data-dec]",body).forEach(function(b){b.addEventListener("click",function(){var it=find(b.getAttribute("data-dec"));if(it)setQty(it.id,it.qty-1);});});
      $$("[data-inc]",body).forEach(function(b){b.addEventListener("click",function(){var it=find(b.getAttribute("data-inc"));if(it)setQty(it.id,it.qty+1);});});
      $$("[data-rm]",body).forEach(function(b){b.addEventListener("click",function(){remove(b.getAttribute("data-rm"));});});
    }
    var hasItems=items.length>0;
    $$("#drawer .handoff .btn, #drawer #copyBtn").forEach(function(b){ b.toggleAttribute("disabled",!hasItems); });
    updateHandoff();
  }

  function summaryText(){
    var note=$("#holdNote")?$("#holdNote").value.trim():"";
    var lines=items.map(function(it){return "- "+it.name+(it.qty>1?(" x"+it.qty):"");});
    var body="Hi "+BIZ+", I would like to put a hold on these finds:\n"+lines.join("\n");
    if(note) body+="\n\nNote: "+note;
    body+="\n\n(Sent from your website)";
    return body;
  }
  function updateHandoff(){
    var txt=summaryText();
    var sms=$("#smsBtn"); if(sms) sms.href="sms:"+PHONE_SMS+"?&body="+encodeURIComponent(txt);
    var mail=$("#mailBtn"); if(mail) mail.href="mailto:?subject="+encodeURIComponent("Hold request — "+BIZ)+"&body="+encodeURIComponent(txt);
    var call=$("#callBtn"); if(call) call.href="tel:"+PHONE_TEL;
  }
  if($("#holdNote")) $("#holdNote").addEventListener("input",updateHandoff);
  if($("#copyBtn")) $("#copyBtn").addEventListener("click",function(){
    var txt=summaryText(); var ok=$("#copyOk");
    function done(){ if(ok){ok.textContent="Copied. Paste it into a text or email to us.";setTimeout(function(){ok.textContent="";},3500);} }
    if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(txt).then(done,function(){fallback(txt,done);}); }
    else fallback(txt,done);
  });
  function fallback(txt,cb){ var ta=document.createElement("textarea"); ta.value=txt; document.body.appendChild(ta); ta.select(); try{document.execCommand("copy");}catch(e){} document.body.removeChild(ta); cb&&cb(); }

  // preselect (department pages link to shop with ?find=id)
  syncCount(); renderDrawer();
  var params=new URLSearchParams(location.search);
  var pre=params.get("find");
  if(pre){ var card=$('[data-id="'+CSS.escape(pre)+'"]'); if(card){ card.scrollIntoView({behavior:reduce?"auto":"smooth",block:"center"}); card.style.outline="2px solid var(--gold)"; setTimeout(function(){card.style.outline="";},2200);} }

})();
