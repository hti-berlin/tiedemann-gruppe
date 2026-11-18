/* Tiedemann Gruppe · gemeinsame Skripte für index.html, team.html, jobs.html */
(function(){
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function pad(n){ return (n < 10 ? '0' : '') + n; }

  /* ----- Header ----- */
  var hdr = document.getElementById('hdr');
  if (hdr){
    var btn = hdr.querySelector('.menu-btn'), nav = document.getElementById('nav');
    var brand = hdr.querySelector('.brand-text');
    var onScroll = function(){
      var solid = window.scrollY > 80;
      hdr.classList.toggle('solid', solid);
      if (brand){
        brand.tabIndex = solid ? 0 : -1;
        brand.setAttribute('aria-hidden', solid ? 'false' : 'true');
      }
    };
    window.addEventListener('scroll', onScroll, { passive:true }); onScroll();
    var setMenu = function(open){
      btn.setAttribute('aria-expanded', open);
      btn.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
      hdr.classList.toggle('menu-open', open);
      document.body.classList.toggle('no-scroll', open);
    };
    btn.addEventListener('click', function(){ setMenu(btn.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function(e){ if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && hdr.classList.contains('menu-open')) { setMenu(false); btn.focus(); } });
  }

  /* ----- Hero slider (nur Startseite) ----- */
  var hero = document.getElementById('start');
  var playBtn = document.getElementById('play');
  if (hero && playBtn){
    var slides = hero.querySelectorAll('.slide'), caps = hero.querySelectorAll('.cap-item');
    var cnt = document.getElementById('cnt'), prog = document.getElementById('prog');
    var DUR = 6000, idx = 0, elapsed = 0, last = null;
    var userPaused = reduce, hoverPaused = false, focusPaused = false;
    var show = function(i){
      idx = (i + slides.length) % slides.length;
      for (var k = 0; k < slides.length; k++){
        var on = k === idx;
        slides[k].classList.toggle('is-active', on);
        slides[k].setAttribute('aria-hidden', on ? 'false' : 'true');
        caps[k].classList.toggle('is-active', on);
        caps[k].querySelector('a').tabIndex = on ? 0 : -1;
      }
      cnt.textContent = pad(idx + 1);
      elapsed = 0; prog.style.transform = 'scaleX(0)';
    };
    var paused = function(){ return userPaused || hoverPaused || focusPaused || document.hidden; };
    var tick = function(t){
      if (last !== null && !paused()){
        elapsed += t - last;
        if (elapsed >= DUR) show(idx + 1);
        prog.style.transform = 'scaleX(' + Math.min(elapsed / DUR, 1) + ')';
      }
      last = t;
      requestAnimationFrame(tick);
    };
    var setUserPaused = function(p){
      userPaused = p;
      hero.classList.toggle('is-paused', p);
      playBtn.setAttribute('aria-label', p ? 'Automatischen Wechsel starten' : 'Automatischen Wechsel anhalten');
    };
    document.getElementById('prev').addEventListener('click', function(){ show(idx - 1); });
    document.getElementById('next').addEventListener('click', function(){ show(idx + 1); });
    playBtn.addEventListener('click', function(){ setUserPaused(!userPaused); });
    hero.addEventListener('mouseenter', function(){ hoverPaused = true; });
    hero.addEventListener('mouseleave', function(){ hoverPaused = false; });
    hero.addEventListener('focusin', function(){ focusPaused = true; });
    hero.addEventListener('focusout', function(e){ if (!hero.contains(e.relatedTarget)) focusPaused = false; });
    hero.addEventListener('keydown', function(e){
      if (e.target.closest('.nav')) return;
      if (e.key === 'ArrowLeft'){ show(idx - 1); } else if (e.key === 'ArrowRight'){ show(idx + 1); }
    });
    var sx = null;
    hero.addEventListener('touchstart', function(e){ sx = e.touches[0].clientX; }, { passive:true });
    hero.addEventListener('touchend', function(e){ if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1)); sx = null; });
    setUserPaused(reduce);
    show(0);
    requestAnimationFrame(tick);
  }

  /* ----- Lightbox ----- */
  var lb = document.getElementById('lb');
  if (lb){
    var lbImg = document.getElementById('lb-img'), lbCap = document.getElementById('lb-cap'), lbCount = document.getElementById('lb-count');
    var group = [], gi = 0, opener = null;
    var render = function(){
      var b = group[gi], im = b.querySelector('img');
      lbImg.src = b.getAttribute('data-full'); lbImg.alt = im.alt;
      lbCap.textContent = b.getAttribute('data-cap') || '';
      lbCount.textContent = pad(gi + 1) + ' / ' + pad(group.length);
    };
    var step = function(d){ gi = (gi + d + group.length) % group.length; render(); };
    Array.prototype.forEach.call(document.querySelectorAll('.g-item'), function(b){
      b.setAttribute('aria-label', 'Bild vergrößern: ' + (b.getAttribute('data-cap') || b.querySelector('img').alt));
      b.addEventListener('click', function(){
        var g = b.closest('[data-gallery]');
        group = Array.prototype.slice.call(g.querySelectorAll('.g-item'));
        gi = group.indexOf(b); opener = b; render();
        if (typeof lb.showModal === 'function'){ lb.showModal(); document.body.classList.add('no-scroll'); }
        else { window.open(b.getAttribute('data-full'), '_blank'); }
      });
    });
    document.getElementById('lb-prev').addEventListener('click', function(){ step(-1); });
    document.getElementById('lb-next').addEventListener('click', function(){ step(1); });
    document.getElementById('lb-close').addEventListener('click', function(){ lb.close(); });
    lb.addEventListener('keydown', function(e){ if (e.key === 'ArrowLeft') step(-1); else if (e.key === 'ArrowRight') step(1); });
    lb.addEventListener('close', function(){ document.body.classList.remove('no-scroll'); if (opener) opener.focus(); });
    lb.addEventListener('click', function(e){ if (e.target === lb || e.target.classList.contains('lb-stage')) lb.close(); });
  }

  /* ----- Akkordeon (Stellenanzeigen) ----- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-acc]'), function(t){
    var panel = document.getElementById(t.getAttribute('aria-controls'));
    if (!panel) return;
    var label = t.querySelector('[data-acc-label]');
    var set = function(open){
      t.setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.hidden = !open;
      if (label) label.textContent = open ? label.getAttribute('data-close') : label.getAttribute('data-open');
    };
    set(location.hash === '#' + panel.id || t.getAttribute('aria-expanded') === 'true');
    t.addEventListener('click', function(){ set(t.getAttribute('aria-expanded') !== 'true'); });
    window.addEventListener('hashchange', function(){ if (location.hash === '#' + panel.id) set(true); });
    Array.prototype.forEach.call(document.querySelectorAll('a[href="#' + panel.id + '"]'), function(a){
      a.addEventListener('click', function(){ set(true); });
    });
  });

  /* ----- Reveal ----- */
  var items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reduce){
    Array.prototype.forEach.call(items, function(el){ el.classList.add('is-in'); });
    return;
  }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { threshold:0.1, rootMargin:'0px 0px -40px 0px' });
  Array.prototype.forEach.call(items, function(el){ io.observe(el); });
})();
