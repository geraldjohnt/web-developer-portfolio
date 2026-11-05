/* Version 2 behaviour: the hero component types itself out and each line "compiles"
   its part of the page; sections compile as they scroll in; a CI pipeline runs; a small
   terminal and a command palette (Ctrl/Cmd + K) let visitors move around like in an editor. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) root.classList.add('reduce');
  var $ = function (s) { return document.querySelector(s); };
  $('#year').textContent = new Date().getFullYear();

  /* ---------------- sound ---------------- */
  var Sound = (function () {
    var ctx = null, out = null, buf = null, last = {};
    var enabled = true;
    try { enabled = localStorage.getItem('gjt-sound') !== 'off'; } catch (e) {}
    function ensure() {
      if (!enabled) return;
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
        try { ctx = new AC(); out = ctx.createGain(); out.gain.value = 0.5; out.connect(ctx.destination); } catch (e) { ctx = null; return; }
      }
      if (ctx.state === 'suspended') ctx.resume();
    }
    function ready() { return enabled && ctx && ctx.state === 'running'; }
    function gap(n, ms) { var t = performance.now(); if (last[n] && t - last[n] < ms) return false; last[n] = t; return true; }
    function click(vol, freq) {
      if (!buf) { buf = ctx.createBuffer(1, ctx.sampleRate * 0.03, ctx.sampleRate); var d = buf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 4); }
      var s = ctx.createBufferSource(); s.buffer = buf; s.playbackRate.value = 0.8 + Math.random() * 0.5;
      var f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 1.4;
      var g = ctx.createGain(); g.gain.value = vol;
      s.connect(f); f.connect(g); g.connect(out); s.start();
    }
    function note(freq, t0, dur, vol, type) {
      var t = ctx.currentTime + t0, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.02);
    }
    return {
      get enabled() { return enabled; },
      setEnabled: function (v) { enabled = v; try { localStorage.setItem('gjt-sound', v ? 'on' : 'off'); } catch (e) {} if (v) ensure(); else if (ctx) ctx.suspend(); },
      unlock: ensure,
      key: function () { if (ready() && gap('key', 38)) click(0.16, 2400 + Math.random() * 1600); },
      tick: function () { if (ready() && gap('tick', 70)) click(0.08, 4200); },
      ok: function () { if (!ready()) return; note(660, 0, 0.12, 0.05); note(990, 0.09, 0.18, 0.045); },
      err: function () { if (ready()) note(160, 0, 0.18, 0.05, 'square'); }
    };
  })();
  var soundBtn = $('#sound-btn');
  function syncSound() { soundBtn.setAttribute('aria-pressed', String(Sound.enabled)); soundBtn.title = Sound.enabled ? 'Typing sounds: on' : 'Typing sounds: off'; }
  soundBtn.addEventListener('click', function () { Sound.setEnabled(!Sound.enabled); syncSound(); if (Sound.enabled) setTimeout(Sound.ok, 60); });
  syncSound();
  function gesture(e) {
    if (soundBtn.contains(e.target)) return;
    Sound.unlock();
    ['pointerdown', 'keydown', 'touchstart'].forEach(function (t) { window.removeEventListener(t, gesture, true); });
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (t) { window.addEventListener(t, gesture, true); });

  /* ---------------- line-number gutter ---------------- */
  var gutter = $('#gutter');
  function fillGutter() {
    if (getComputedStyle(gutter).display === 'none') return;
    var h = document.documentElement.scrollHeight, n = Math.ceil(h / 24), s = '';
    for (var i = 1; i <= n; i++) s += i + '\n';
    gutter.style.height = h + 'px'; gutter.textContent = s;
  }
  var gT; window.addEventListener('resize', function () { clearTimeout(gT); gT = setTimeout(fillGutter, 200); });
  window.addEventListener('load', fillGutter);

  /* ---------------- hero: type the component ---------------- */
  var L = [
    [['kw', 'import'], ' { ', ['fn', 'Developer'], ' } ', ['kw', 'from'], ' ', ['str', '"@/people"'], ';'],
    [],
    [['kw', 'export default function'], ' ', ['fn', 'Hero'], '() {'],
    ['  ', ['kw', 'return'], ' ('],
    ['    ', ['p', '<'], ['tag', 'Developer']],
    ['      ', ['attr', 'role'], ['p', '='], ['str', '"Full-stack developer · Software engineer"']],
    ['      ', ['attr', 'headline'], ['p', '='], ['str', '"I build software that solves real business problems."']],
    ['      ', ['attr', 'experience'], ['p', '={'], ['num', '9'], ['p', '}'], '  ', ['com', '// years: web apps, internal tools, APIs']],
    ['      ', ['attr', 'stack'], ['p', '={['], ['str', '"JavaScript"'], ', ', ['str', '"Python"'], ', ', ['str', '"PHP"'], ', ', ['str', '"Laravel"'], ', ', ['str', '"Vue"'], ['p', ']}']],
    ['      ', ['attr', 'aiAssisted'], ['p', '={['], ['str', '"Claude"'], ', ', ['str', '"Claude Code"'], ['p', ']}']],
    ['      ', ['attr', 'clients'], ['p', '='], ['str', '"international"'], ' ', ['attr', 'timezone'], ['p', '='], ['str', '"any"']],
    ['      ', ['attr', 'onHire'], ['p', '={'], '() ', ['kw', '=>'], ' ', ['fn', 'scrollTo'], '(', ['str', '"#contact"'], ')', ['p', '}']],
    ['      ', ['attr', 'stats'], ['p', '={{'], ' years: ', ['num', '9'], ', teams: ', ['num', '7'], ' ', ['p', '}}']],
    ['    ', ['p', '/>']],
    ['  );'],
    ['}']
  ];
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function lineLen(line) { var n = 0; line.forEach(function (t) { n += (typeof t === 'string' ? t : t[1]).length; }); return n; }
  function restHTML(line, chars) {
    var all = '', i; for (i = 0; i < line.length; i++) all += typeof line[i] === 'string' ? line[i] : line[i][1];
    return '<span class="rest">' + esc(all.slice(chars)) + '</span>';
  }
  function lineHTML(line, chars) {
    var html = '', left = chars === undefined ? Infinity : chars;
    for (var i = 0; i < line.length && left > 0; i++) {
      var t = line[i], txt = typeof t === 'string' ? t : t[1], part = txt.slice(0, left);
      left -= part.length;
      html += typeof t === 'string' ? esc(part) : '<span class="tk-' + t[0] + '">' + esc(part) + '</span>';
    }
    return html;
  }
  var codeEl = $('#code');
  var rows = L.map(function (line, i) {
    var r = document.createElement('div'); r.className = 'l';
    r.innerHTML = '<span class="n">' + (i + 1) + '</span><span class="t">' + (reduce ? '' : restHTML(line, 0)) + '</span>';
    codeEl.appendChild(r); return r.lastChild;
  });
  var heroParts = Array.prototype.slice.call(document.querySelectorAll('.hero-out [data-line]'));
  function compileLine(n, quiet) {
    heroParts.forEach(function (el) {
      if (+el.getAttribute('data-line') === n && !el.classList.contains('ok')) {
        el.classList.add('ok');
        if (!quiet) { el.classList.add('flash'); setTimeout(function () { el.classList.remove('flash'); }, 950); }
      }
    });
  }

  var termOut = $('#term-out'), termInput = $('#term-input'), termForm = $('#term-form');
  function print(html, cls) {
    var p = document.createElement('p'); if (cls) p.className = cls; p.innerHTML = html;
    termOut.appendChild(p);
    while (termOut.childNodes.length > 80) termOut.removeChild(termOut.firstChild);
    termOut.scrollTop = termOut.scrollHeight;
  }
  var sbBuild = $('#sb-build');
  function bootDone() {
    print('<span class="cmd">$ npm run dev</span>');
    setTimeout(function () {
      print('<span class="ok">✓</span> compiled 16 modules in <span class="cu">412ms</span>');
      print('<span class="ac">➜</span> ready: <a href="https://geraldjohnt.github.io/web-developer-portfolio/">geraldjohnt.github.io/web-developer-portfolio</a>');
      print('<span class="dim">Type <span class="ac">help</span> for commands, or press Ctrl+K.</span>');
      sbBuild.textContent = '✓ build passed'; sbBuild.classList.add('pass');
      var hud = document.querySelector('.hud'); if (hud) hud.classList.add('on');
      Sound.ok();
      setTimeout(fillGutter, 300);
    }, reduce ? 0 : 420);
  }

  var lens = L.map(lineLen);
  if (reduce) {
    rows.forEach(function (t, i) { t.innerHTML = lineHTML(L[i]); });
    heroParts.forEach(function (el) { el.classList.add('ok'); });
    bootDone();
  } else {
    var start = performance.now() + 450;
    var RATE = 0.15;      // characters per ms
    var EOL = 7;          // pause at the end of each line, in characters
    var total = lens.reduce(function (a, b) { return a + b + EOL; }, 0);
    var curLine = -1;
    var caret = '<span class="caret"></span>';
    (function type(now) {
      var typed = Math.max(0, (now - start) * RATE), acc = 0;
      for (var i = 0; i < L.length; i++) {
        var len = lens[i];
        if (typed >= acc + len + EOL) {
          if (rows[i].dataset.done !== '1') {
            rows[i].innerHTML = lineHTML(L[i]); rows[i].dataset.done = '1';
            rows[i].parentNode.classList.remove('cur');
            compileLine(i + 1);
          }
        } else {
          var c = Math.max(0, Math.floor(typed - acc));
          if (typed >= acc) {
            if (curLine !== i) { curLine = i; rows[i].parentNode.classList.add('cur'); }
            rows[i].innerHTML = lineHTML(L[i], c) + caret + restHTML(L[i], c);
            if (c > 0 && c < len) Sound.key();
          }
          break;
        }
        acc += len + EOL;
      }
      if (typed < total) requestAnimationFrame(type);
      else { heroParts.forEach(function (el) { el.classList.add('ok'); }); bootDone(); }
    })(performance.now());
  }

  /* ---------------- terminal ---------------- */
  var history = [], hIdx = 0;
  function go(id) {
    var el = document.getElementById(id); if (!el) return;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }
  var cmds = {
    help: function () {
      print('<span class="ac">whoami</span>      who I am           <span class="ac">stack</span>     languages &amp; tools');
      print('<span class="ac">about</span>       open about.md      <span class="ac">skills</span>    open skills.json');
      print('<span class="ac">experience</span>  open git.log       <span class="ac">projects</span>  open projects/');
      print('<span class="ac">contact</span>     open contact.sh    <span class="ac">va</span>        VA &amp; automation services');
      print('<span class="ac">holo</span>        project stack.holo <span class="ac">github</span>    my GitHub');
      print('<span class="ac">clear</span>       clear the terminal');
    },
    whoami: function () { print('Gerald John Tangpos — Full-Stack Developer &amp; Software Engineer'); print('<span class="dim">9+ years · Cebu, Philippines (GMT+8) · works any time zone</span>'); },
    stack: function () { print('<span class="cu">languages</span>  JavaScript · Python · PHP · C# · Java · SQL'); print('<span class="cu">web</span>        Laravel · Vue.js · AngularJS · WordPress · REST APIs'); print('<span class="cu">data</span>       MySQL · SQL Server · MongoDB · Firebase'); print('<span class="cu">ai</span>         Claude · Claude Code'); },
    about: function () { print('→ opening <span class="ac">about.md</span>'); go('about'); },
    skills: function () { print('→ opening <span class="ac">skills.json</span>'); go('skills'); },
    holo: function () { print('→ projecting <span class="ac">stack.holo</span>'); go('architecture'); },
    experience: function () { print('→ <span class="ac">git log --graph</span>'); go('experience'); },
    projects: function () { print('→ opening <span class="ac">projects/</span>'); go('projects'); },
    contact: function () { print('→ opening <span class="ac">contact.sh</span>'); go('contact'); },
    va: function () { print('VA &amp; automation portfolio: <a href="https://geraldjohnt.github.io/va-portfolio/">geraldjohnt.github.io/va-portfolio</a>'); },
    github: function () { print('<a href="https://github.com/geraldjohnt" target="_blank" rel="noopener">github.com/geraldjohnt</a>'); },
    clear: function () { termOut.innerHTML = ''; },
    ls: function () { print('about.md  skills.json  git.log  projects/  contact.sh'); },
    'sudo hire-me': function () { print('<span class="ok">Permission granted.</span> Opening contact form…'); go('contact'); setTimeout(function () { $('#cf-name').focus({ preventScroll: true }); }, reduce ? 0 : 700); }
  };
  cmds.cv = cmds.whoami; cmds['cat about.md'] = cmds.about; cmds.hire = cmds['sudo hire-me'];
  termForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var raw = termInput.value.trim(); termInput.value = '';
    print('<span class="dim">$</span> <span class="cmd">' + esc(raw) + '</span>');
    if (!raw) return;
    history.push(raw); hIdx = history.length;
    var c = cmds[raw.toLowerCase()] || cmds[raw.toLowerCase().replace(/^(cd|open|cat)\s+/, '').replace(/[./]/g, '')];
    if (c) { c(); Sound.ok(); }
    else { print('<span class="err">command not found:</span> ' + esc(raw) + ' — try <span class="ac">help</span>'); Sound.err(); }
  });
  termInput.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowUp' && history.length) { hIdx = Math.max(0, hIdx - 1); termInput.value = history[hIdx]; e.preventDefault(); }
    else if (e.key === 'ArrowDown' && history.length) { hIdx = Math.min(history.length, hIdx + 1); termInput.value = history[hIdx] || ''; e.preventDefault(); }
    else if (e.key.length === 1) Sound.key();
  });

  /* ---------------- compile on scroll ---------------- */
  var targets = Array.prototype.slice.call(document.querySelectorAll('[data-compile]'));
  function compile(el, delay) {
    setTimeout(function () {
      el.classList.add('ok', 'flash'); Sound.tick();
      setTimeout(function () { el.classList.remove('flash'); }, 950);
      if (el.id === 'pipeline') runPipeline();
    }, delay);
  }
  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('ok'); });
    passPipeline();
  } else {
    var io = new IntersectionObserver(function (entries) {
      var batch = entries.filter(function (en) { return en.isIntersecting; }).map(function (en) { io.unobserve(en.target); return en.target; });
      batch.sort(function (a, b) { return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1; });
      batch.forEach(function (el, i) { compile(el, Math.min(i * 90, 720)); });
    }, { rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (el) { io.observe(el); });
    // never leave content hidden for keyboard users
    document.addEventListener('focusin', function (e) {
      var el = e.target.closest && e.target.closest('[data-compile]:not(.ok)');
      if (el) { io.unobserve(el); el.classList.add('ok'); if (el.id === 'pipeline') runPipeline(); }
    });
  }

  /* ---------------- CI pipeline ---------------- */
  var plRan = false;
  function passPipeline() {
    document.querySelectorAll('.stages li').forEach(function (li) { li.classList.add('done'); });
    var st = $('#pl-status'); st.className = 'pl-status pass'; st.querySelector('b').textContent = 'Passed';
    $('#pl-time').textContent = '6 / 6 stages';
  }
  function runPipeline() {
    if (plRan) return; plRan = true;
    var li = document.querySelectorAll('.stages li'), st = $('#pl-status'), tm = $('#pl-time');
    st.className = 'pl-status run'; st.querySelector('b').textContent = 'Running';
    var t0 = performance.now(), i = 0, STEP = 520;
    (function tick(now) {
      tm.textContent = ((now - t0) / 1000).toFixed(1) + 's';
      var k = Math.floor((now - t0) / STEP);
      while (i < li.length && i < k) { li[i].classList.remove('run'); li[i].classList.add('done'); Sound.tick(); i++; }
      if (i < li.length) { li[i].classList.add('run'); requestAnimationFrame(tick); }
      else { st.className = 'pl-status pass'; st.querySelector('b').textContent = 'Passed'; Sound.ok(); }
    })(t0);
  }

  /* ---------------- tabs + status bar follow the scroll ---------------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tabs a[data-tab]'));
  var names = { top: 'Hero.tsx', about: 'about.md', skills: 'skills.json', architecture: 'stack.holo', experience: 'git.log', projects: 'projects/', workflow: 'deliver.yml', 'business-support': 'va-services', contact: 'contact.sh' };
  var sbFile = $('#sb-file'), sbLn = $('#sb-ln');
  var secs = Object.keys(names).map(function (id) { return document.getElementById(id); }).filter(Boolean);
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.scrollY, mid = y + window.innerHeight * 0.35, cur = secs[0];
      secs.forEach(function (s) { if (s.offsetTop <= mid) cur = s; });
      tabs.forEach(function (a) { a.classList.toggle('on', a.dataset.tab === cur.id); });
      sbFile.textContent = names[cur.id];
      sbLn.textContent = 'Ln ' + (Math.floor(y / 24) + 1) + ', Col 1';
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------------- back to top ---------------- */
  var toTop = $('#to-top'), ttT = false;
  function checkTop() {
    ttT = false;
    var near = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - window.innerHeight * 0.9;
    var show = near && window.scrollY > window.innerHeight;
    toTop.classList.toggle('show', show); toTop.tabIndex = show ? 0 : -1;
  }
  window.addEventListener('scroll', function () { if (!ttT) { ttT = true; requestAnimationFrame(checkTop); } }, { passive: true });
  window.addEventListener('resize', checkTop);
  toTop.addEventListener('click', function (e) {
    e.preventDefault(); Sound.ok();
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    $('.brand').focus({ preventScroll: true });
  });
  checkTop();

  /* ---------------- mobile menu ---------------- */
  var bar = $('#bar'), toggle = bar.querySelector('.nav-toggle'), menu = $('#nav-menu');
  function setOpen(open) { bar.classList.toggle('open', open); toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); }
  toggle.addEventListener('click', function () { setOpen(!bar.classList.contains('open')); });
  menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
  document.addEventListener('click', function (e) { if (bar.classList.contains('open') && !bar.contains(e.target)) setOpen(false); });
  window.addEventListener('resize', function () { if (window.innerWidth > 860) setOpen(false); });

  /* ---------------- command palette ---------------- */
  var pal = $('#palette'), palIn = $('#pal-input'), palList = $('#pal-list'), sel = 0, shown = [], palOpener = null;
  var items = [
    { t: 'Go to about.md', k: 'section', run: function () { go('about'); } },
    { t: 'Go to skills.json', k: 'section', run: function () { go('skills'); } },
    { t: 'Go to stack.holo (architecture hologram)', k: 'section', run: function () { go('architecture'); } },
    { t: 'Go to git.log (experience)', k: 'section', run: function () { go('experience'); } },
    { t: 'Go to projects/', k: 'section', run: function () { go('projects'); } },
    { t: 'Go to deliver.yml (how I work)', k: 'section', run: function () { go('workflow'); } },
    { t: 'Go to contact.sh', k: 'section', run: function () { go('contact'); } },
    { t: 'Hire me: open the contact form', k: 'action', run: function () { go('contact'); setTimeout(function () { $('#cf-name').focus({ preventScroll: true }); }, reduce ? 0 : 700); } },
    { t: 'Open GitHub profile', k: 'link', run: function () { window.open('https://github.com/geraldjohnt', '_blank', 'noopener'); } },
    { t: 'Open VA & automation portfolio', k: 'link', run: function () { location.href = 'https://geraldjohnt.github.io/va-portfolio/'; } },
    { t: 'Focus the terminal', k: 'action', run: function () { go('top'); setTimeout(function () { termInput.focus({ preventScroll: true }); }, reduce ? 0 : 500); } },
    { t: 'Toggle typing sounds', k: 'setting', run: function () { soundBtn.click(); } }
  ];
  function renderPal() {
    var q = palIn.value.trim().toLowerCase();
    shown = items.filter(function (it) { return !q || it.t.toLowerCase().indexOf(q) > -1; });
    sel = Math.min(sel, Math.max(0, shown.length - 1));
    palList.innerHTML = '';
    shown.forEach(function (it, i) {
      var li = document.createElement('li'); li.setAttribute('role', 'option'); li.setAttribute('aria-selected', String(i === sel));
      li.innerHTML = '<span>' + esc(it.t) + '</span><small>' + it.k + '</small>';
      li.addEventListener('click', function () { runPal(i); });
      palList.appendChild(li);
    });
    if (!shown.length) palList.innerHTML = '<li aria-selected="false"><span>No matches</span></li>';
  }
  function openPal() { palOpener = document.activeElement; pal.hidden = false; palIn.value = ''; sel = 0; renderPal(); palIn.focus(); Sound.tick(); }
  function closePal() { pal.hidden = true; if (palOpener && palOpener.focus) palOpener.focus({ preventScroll: true }); }
  function runPal(i) { var it = shown[i]; if (!it) return; pal.hidden = true; it.run(); Sound.ok(); }
  $('#palette-btn').addEventListener('click', openPal);
  palIn.addEventListener('input', function () { sel = 0; renderPal(); });
  palIn.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { sel = Math.min(shown.length - 1, sel + 1); renderPal(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); renderPal(); e.preventDefault(); }
    else if (e.key === 'Enter') { runPal(sel); e.preventDefault(); }
    else if (e.key === 'Tab') e.preventDefault();
  });
  pal.addEventListener('click', function (e) { if (e.target === pal) closePal(); });
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); if (pal.hidden) openPal(); else closePal(); }
    else if (e.key === 'Escape') { if (!pal.hidden) closePal(); else if (bar.classList.contains('open')) { setOpen(false); toggle.focus(); } }
  });
  if (/Mac|iPhone|iPad/.test(navigator.platform || '')) $('#palette-btn kbd').textContent = '⌘';
})();
