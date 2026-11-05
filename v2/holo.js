/* Holograms for index.html (the version 2 page), drawn on canvas with a small hand-rolled 3D projection.
   - stack.holo: four translucent layers (data → services → API → interface) that materialize
     bottom-up when scrolled into view, joined by data beams, with an AI ring orbiting them.
     Drag to turn it; hovering a legend item lights up its layer.
   - clients.geo: a wireframe globe with arcs from Cebu to the US and Japan.
   Each scene only animates while it is on screen. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ARC = '111,227,245', COP = '228,168,104', WHITE = '235,250,255';
  var FONT = '"JetBrains Mono", ui-monospace, monospace';

  function Scene(canvas, render) {
    var self = this;
    this.c = canvas; this.ctx = canvas.getContext('2d');
    this.render = render; this.visible = false; this.start = null; this.running = false;
    this.yaw = 0; this.pitch = 0; this.drag = null; this.spin = 0;
    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      self.w = canvas.clientWidth; self.h = canvas.clientHeight;
      canvas.width = Math.round(self.w * dpr); canvas.height = Math.round(self.h * dpr);
      self.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!self.running) self.frame(performance.now());
    }
    if ('ResizeObserver' in window) new ResizeObserver(size).observe(canvas); else window.addEventListener('resize', size);
    size();
    new IntersectionObserver(function (en) {
      self.visible = en[0].isIntersecting;
      if (self.visible && self.start === null) self.start = performance.now() + 250;
      if (self.visible && !self.running && !reduce) { self.running = true; requestAnimationFrame(self.loop); }
    }, { rootMargin: '80px' }).observe(canvas);
    this.loop = function (now) {
      if (!self.visible || document.hidden) { self.running = false; return; }
      self.frame(now); requestAnimationFrame(self.loop);
    };
    document.addEventListener('visibilitychange', function () { if (!document.hidden && self.visible && !self.running && !reduce) { self.running = true; requestAnimationFrame(self.loop); } });
  }
  Scene.prototype.frame = function (now) {
    var t = this.start === null ? (reduce ? 99 : 0) : reduce ? 99 : Math.max(0, (now - this.start) / 1000);
    this.ctx.clearRect(0, 0, this.w, this.h);
    this.render(this, t, now / 1000);
  };
  Scene.prototype.draggable = function (el) {
    var self = this;
    el.addEventListener('pointerdown', function (e) { self.drag = { x: e.clientX, y: e.clientY, yaw: self.yaw, pitch: self.pitch }; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', function (e) {
      if (!self.drag) return;
      self.yaw = self.drag.yaw + (e.clientX - self.drag.x) * 0.008;
      self.pitch = Math.max(-0.35, Math.min(0.35, self.drag.pitch + (e.clientY - self.drag.y) * 0.004));
      if (reduce) self.frame(performance.now());
    });
    function up() { self.drag = null; }
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  };

  // rotate around Y (yaw), then X (pitch), then perspective
  function proj(x, y, z, yaw, pitch, cx, cy, k, out) {
    var cy_ = Math.cos(yaw), sy = Math.sin(yaw);
    var x1 = x * cy_ + z * sy, z1 = -x * sy + z * cy_;
    var cp = Math.cos(pitch), sp = Math.sin(pitch);
    var y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
    var f = 900 / (900 + z2 * k);
    out.x = cx + x1 * k * f; out.y = cy + y2 * k * f; out.z = z2; out.s = f;
    return out;
  }
  function ease(p) { p = Math.max(0, Math.min(1, p)); return 1 - Math.pow(1 - p, 3); }
  var P = {}, Q = {}, R = {}, S = {};

  /* ---------------- stack.holo ---------------- */
  var archCanvas = document.getElementById('arch-canvas');
  if (archCanvas) {
    var layers = [
      { name: 'DATA', y: 150, techs: ['MySQL', 'SQL Server', 'MongoDB', 'Firebase'] },
      { name: 'SERVICES', y: 50, techs: ['PHP', 'Python', 'C#', 'Java', 'JavaScript'] },
      { name: 'API', y: -50, techs: ['Laravel', 'REST', 'AJAX'] },
      { name: 'INTERFACE', y: -150, techs: ['Vue.js', 'AngularJS', 'WordPress', 'jQuery'] }
    ];
    layers.forEach(function (L, i) {
      L.nodes = L.techs.map(function (n, j) { var a = j / L.techs.length * Math.PI * 2 + i * 0.7; return { n: n, x: Math.cos(a) * 105, z: Math.sin(a) * 105 }; });
    });
    var beams = [];
    for (var li = 0; li < layers.length - 1; li++) {
      for (var b = 0; b < 3; b++) {
        var A = layers[li], B = layers[li + 1];
        beams.push({ a: A.nodes[b % A.nodes.length], ay: A.y, b: B.nodes[(b * 2 + 1) % B.nodes.length], by: B.y, off: Math.random(), up: b % 2 === 0 });
      }
    }
    var HALF = 165, hl = null;
    var legend = document.querySelectorAll('.arch-legend li');
    Array.prototype.forEach.call(legend, function (li) {
      function on() { hl = li.dataset.layer; }
      function off() { hl = null; }
      li.addEventListener('mouseenter', on); li.addEventListener('mouseleave', off);
      li.addEventListener('focus', on); li.addEventListener('blur', off);
    });

    var arch = new Scene(archCanvas, function (sc, t, now) {
      var ctx = sc.ctx, w = sc.w, h = sc.h, cx = w / 2, cy = h * 0.47;
      var k = Math.min(w / 640, h / 560) * 1.05;
      if (!sc.drag && !reduce) sc.yaw += 0.0035;
      var yaw = sc.yaw + 0.6, pitch = 0.5 + sc.pitch;
      ctx.globalCompositeOperation = 'lighter';
      var flick = reduce ? 1 : (Math.random() < 0.03 ? 0.75 : 1);

      // emitter + light cone
      var eOn = ease(t / 0.5);
      proj(0, 250, 0, yaw, pitch, cx, cy, k, P);
      ctx.save(); ctx.translate(P.x, P.y); ctx.scale(1, 0.32);
      var g = ctx.createRadialGradient(0, 0, 4, 0, 0, 150 * k);
      g.addColorStop(0, 'rgba(' + ARC + ',' + 0.55 * eOn + ')'); g.addColorStop(1, 'rgba(' + ARC + ',0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 150 * k, 0, 6.283); ctx.fill();
      ctx.strokeStyle = 'rgba(' + ARC + ',' + 0.8 * eOn + ')'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, 95 * k, 0, 6.283); ctx.stroke();
      ctx.setLineDash([6, 6]); ctx.lineDashOffset = -now * 20;
      ctx.beginPath(); ctx.arc(0, 0, 70 * k, 0, 6.283); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();

      // layers, bottom first
      layers.forEach(function (L, i) {
        var st = 0.35 + i * 0.42, p = ease((t - st) / 0.7);
        if (p <= 0) return;
        var lit = hl === String(i);
        var a = (lit ? 1 : 0.7) * flick;
        var corners = [[-HALF, -HALF], [HALF, -HALF], [HALF, HALF], [-HALF, HALF]].map(function (c) { return proj(c[0], L.y, c[1], yaw, pitch, cx, cy, k, {}); });
        // fill
        ctx.fillStyle = 'rgba(' + ARC + ',' + (lit ? 0.14 : 0.05) * p + ')';
        ctx.beginPath(); corners.forEach(function (c, ci) { ci ? ctx.lineTo(c.x, c.y) : ctx.moveTo(c.x, c.y); }); ctx.closePath(); ctx.fill();
        // outline drawn progressively
        ctx.strokeStyle = 'rgba(' + ARC + ',' + a + ')'; ctx.lineWidth = lit ? 2 : 1.3;
        ctx.beginPath(); ctx.moveTo(corners[0].x, corners[0].y);
        var dist = p * 4;
        for (var s = 0; s < 4 && dist > 0; s++) {
          var c0 = corners[s], c1 = corners[(s + 1) % 4], f = Math.min(1, dist);
          ctx.lineTo(c0.x + (c1.x - c0.x) * f, c0.y + (c1.y - c0.y) * f); dist -= 1;
        }
        ctx.stroke();
        // grid
        if (p > 0.5) {
          ctx.strokeStyle = 'rgba(' + ARC + ',' + 0.16 * (p - 0.5) * 2 * flick + ')'; ctx.lineWidth = 1;
          ctx.beginPath();
          for (var gi = 1; gi < 4; gi++) {
            var v = -HALF + gi * HALF / 2;
            proj(v, L.y, -HALF, yaw, pitch, cx, cy, k, P); proj(v, L.y, HALF, yaw, pitch, cx, cy, k, Q);
            ctx.moveTo(P.x, P.y); ctx.lineTo(Q.x, Q.y);
            proj(-HALF, L.y, v, yaw, pitch, cx, cy, k, P); proj(HALF, L.y, v, yaw, pitch, cx, cy, k, Q);
            ctx.moveTo(P.x, P.y); ctx.lineTo(Q.x, Q.y);
          }
          ctx.stroke();
        }
        // corner ticks + layer label
        ctx.fillStyle = 'rgba(' + (lit ? WHITE : ARC) + ',' + 0.9 * p + ')';
        ctx.font = '600 ' + Math.round(11 * Math.max(0.8, k)) + 'px ' + FONT; ctx.textAlign = 'left';
        ctx.fillText('L0' + (i + 1) + ' · ' + L.name, Math.min(corners[0].x, corners[3].x, corners[1].x, corners[2].x) - 4, Math.min(corners[0].y, corners[1].y, corners[2].y, corners[3].y) - 8);
        // nodes
        var np = ease((t - st - 0.4) / 0.5);
        if (np > 0) {
          L.nodes.forEach(function (n) {
            proj(n.x, L.y, n.z, yaw, pitch, cx, cy, k, P);
            var depth = Math.max(0.35, Math.min(1, 1 - P.z / 400));
            var r = 3.2 * P.s * Math.max(0.8, k);
            ctx.fillStyle = 'rgba(' + COP + ',' + np * depth + ')';
            ctx.beginPath(); ctx.moveTo(P.x, P.y - r); ctx.lineTo(P.x + r, P.y); ctx.lineTo(P.x, P.y + r); ctx.lineTo(P.x - r, P.y); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = 'rgba(' + ARC + ',' + 0.5 * np * depth + ')'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(P.x, P.y); ctx.lineTo(P.x, P.y - 14 * k); ctx.stroke();
            ctx.fillStyle = 'rgba(' + WHITE + ',' + np * depth * (lit ? 1 : 0.85) + ')';
            ctx.font = '500 ' + Math.round(10.5 * Math.max(0.85, k)) + 'px ' + FONT; ctx.textAlign = 'center';
            ctx.fillText(n.n, P.x, P.y - 18 * k);
          });
        }
      });

      // data beams between layers
      var bp = ease((t - 2.2) / 0.6);
      if (bp > 0) {
        beams.forEach(function (bm) {
          proj(bm.a.x, bm.ay, bm.a.z, yaw, pitch, cx, cy, k, P); proj(bm.b.x, bm.by, bm.b.z, yaw, pitch, cx, cy, k, Q);
          ctx.strokeStyle = 'rgba(' + ARC + ',' + 0.35 * bp + ')'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(P.x, P.y); ctx.lineTo(P.x + (Q.x - P.x) * bp, P.y + (Q.y - P.y) * bp); ctx.stroke();
          if (bp >= 1) {
            var f = (now * 0.6 + bm.off) % 1; if (!bm.up) f = 1 - f;
            ctx.fillStyle = 'rgba(' + COP + ',0.95)';
            ctx.beginPath(); ctx.arc(P.x + (Q.x - P.x) * f, P.y + (Q.y - P.y) * f, 2.4, 0, 6.283); ctx.fill();
          }
        });
      }

      // AI orbit ring
      var rp = ease((t - 2.6) / 0.8);
      if (rp > 0) {
        var ringTilt = 0.42, RAD = 245, seg = 72, ry = now * 0.25;
        ctx.strokeStyle = 'rgba(' + COP + ',' + (hl === 'ai' ? 0.9 : 0.5) * rp + ')'; ctx.lineWidth = hl === 'ai' ? 2 : 1.2;
        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        for (var si = 0; si <= seg * rp; si++) {
          var an = si / seg * Math.PI * 2;
          var x = Math.cos(an) * RAD, z = Math.sin(an) * RAD, y = Math.sin(an) * RAD * Math.sin(ringTilt) * 0.4;
          proj(x, y, z, yaw * 0.4, pitch, cx, cy, k, P);
          si ? ctx.lineTo(P.x, P.y) : ctx.moveTo(P.x, P.y);
        }
        ctx.stroke(); ctx.setLineDash([]);
        ['Claude', 'Claude Code', 'review', 'tests'].forEach(function (lab, j) {
          var an = ry + j * Math.PI / 2;
          var x = Math.cos(an) * RAD, z = Math.sin(an) * RAD, y = Math.sin(an) * RAD * Math.sin(ringTilt) * 0.4;
          proj(x, y, z, yaw * 0.4, pitch, cx, cy, k, P);
          var d = Math.max(0.3, Math.min(1, 1 - P.z / 400)) * rp;
          ctx.fillStyle = 'rgba(' + COP + ',' + d + ')';
          ctx.beginPath(); ctx.arc(P.x, P.y, 4 * P.s, 0, 6.283); ctx.fill();
          ctx.fillStyle = 'rgba(' + WHITE + ',' + d * (j < 2 ? 1 : 0.6) + ')';
          ctx.font = (j < 2 ? '600 ' : '400 ') + Math.round(10.5 * Math.max(0.85, k)) + 'px ' + FONT; ctx.textAlign = 'left';
          ctx.fillText(lab, P.x + 8, P.y + 4);
        });
      }

      // scanning plane that sweeps the stack
      if (t > 3.2 && !reduce) {
        var sy = -200 + ((now * 0.18) % 1) * 400;
        var sc4 = [[-HALF - 20, -HALF - 20], [HALF + 20, -HALF - 20], [HALF + 20, HALF + 20], [-HALF - 20, HALF + 20]].map(function (c) { return proj(c[0], sy, c[1], yaw, pitch, cx, cy, k, {}); });
        ctx.strokeStyle = 'rgba(' + WHITE + ',0.18)'; ctx.lineWidth = 1;
        ctx.beginPath(); sc4.forEach(function (c, ci) { ci ? ctx.lineTo(c.x, c.y) : ctx.moveTo(c.x, c.y); }); ctx.closePath(); ctx.stroke();
      }

      // HUD readout
      ctx.globalCompositeOperation = 'source-over';
      ctx.font = '500 10px ' + FONT; ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(' + ARC + ',0.7)';
      var pct = Math.round(Math.min(1, t / 3.4) * 100);
      ctx.fillText('RENDER ' + (pct < 100 ? pct + '%' : 'COMPLETE') + '  ·  YAW ' + ((((sc.yaw + 0.6) * 57.3) % 360 + 360) % 360).toFixed(0) + '°', 14, 22);
      ctx.fillStyle = 'rgba(' + COP + ',0.7)';
      ctx.fillText('LAYERS 4 · NODES 16 · LINKS ' + beams.length, 14, 36);
    });
    arch.draggable(archCanvas.parentNode);
  }

  /* ---------------- clients.geo ---------------- */
  var geoCanvas = document.getElementById('geo-canvas');
  if (geoCanvas) {
    var D = Math.PI / 180;
    function v3(lat, lon) { return [Math.cos(lat * D) * Math.sin(lon * D), -Math.sin(lat * D), Math.cos(lat * D) * Math.cos(lon * D)]; }
    var home = { n: 'CEBU · HOME', v: v3(10.3, 123.9) };
    var places = [{ n: 'JAPAN', v: v3(35.7, 139.7) }, { n: 'USA', v: v3(38.5, -97) }];
    function slerp(a, b, t) {
      var dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2], om = Math.acos(Math.max(-1, Math.min(1, dot))), so = Math.sin(om) || 1;
      var s1 = Math.sin((1 - t) * om) / so, s2 = Math.sin(t * om) / so;
      return [a[0] * s1 + b[0] * s2, a[1] * s1 + b[1] * s2, a[2] * s1 + b[2] * s2];
    }
    var geo = new Scene(geoCanvas, function (sc, t, now) {
      var ctx = sc.ctx, w = sc.w, h = sc.h, cx = w / 2, cy = h / 2;
      var Rr = Math.min(w, h) * 0.36, k = 1;
      var yaw = -0.35 + Math.sin(now * 0.15) * 0.45, pitch = 0.32;  // Cebu, Japan and the US arc face the viewer
      var on = ease(t / 1.2);
      ctx.globalCompositeOperation = 'lighter';
      // halo
      var g = ctx.createRadialGradient(cx, cy, Rr * 0.6, cx, cy, Rr * 1.35);
      g.addColorStop(0, 'rgba(' + ARC + ',0)'); g.addColorStop(0.75, 'rgba(' + ARC + ',' + 0.12 * on + ')'); g.addColorStop(1, 'rgba(' + ARC + ',0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, Rr * 1.35, 0, 6.283); ctx.fill();
      function pt(v, alt, out) { var s = Rr * (alt || 1); return proj(v[0] * s, v[1] * s, v[2] * s, yaw, pitch, cx, cy, k, out); }
      function line(fn, n, a) {
        var prev = null;
        for (var i2 = 0; i2 <= n; i2++) {
          var v = fn(i2 / n); pt(v, 1, P);
          var front = P.z < 0;
          if (prev) { ctx.strokeStyle = 'rgba(' + ARC + ',' + (front ? a : a * 0.28) * on + ')'; ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(P.x, P.y); ctx.stroke(); }
          prev = { x: P.x, y: P.y };
        }
      }
      ctx.lineWidth = 1;
      for (var lat = -60; lat <= 60; lat += 30) line(function (u) { return v3(lat, u * 360); }, 48, lat === 0 ? 0.6 : 0.32);
      for (var lon = 0; lon < 360; lon += 30) line(function (u) { return v3(-90 + u * 180, lon); }, 32, 0.28);
      // arcs from home
      var ap = ease((t - 1) / 1.2);
      places.forEach(function (pl, i) {
        if (ap <= 0) return;
        var prev = null;
        for (var s = 0; s <= 40 * ap; s++) {
          var u = s / 40, v = slerp(home.v, pl.v, u), alt = 1 + Math.sin(Math.PI * u) * 0.32;
          pt(v, alt, P);
          if (prev) { ctx.strokeStyle = 'rgba(' + COP + ',' + (P.z < 0 ? 0.9 : 0.35) + ')'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(P.x, P.y); ctx.stroke(); }
          prev = { x: P.x, y: P.y };
        }
        if (ap >= 1) {
          var f = (now * 0.35 + i * 0.5) % 1, v2 = slerp(home.v, pl.v, f);
          pt(v2, 1 + Math.sin(Math.PI * f) * 0.32, Q);
          ctx.fillStyle = 'rgba(' + WHITE + ',0.95)'; ctx.beginPath(); ctx.arc(Q.x, Q.y, 2.2, 0, 6.283); ctx.fill();
        }
      });
      // markers
      [home].concat(places).forEach(function (pl, i) {
        pt(pl.v, 1, R);
        var front = R.z < 0, a = (front ? 1 : 0.3) * on;
        var pulse = (now * 0.8 + i * 0.3) % 1;
        ctx.strokeStyle = 'rgba(' + (i ? ARC : COP) + ',' + a * (1 - pulse) + ')'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(R.x, R.y, 3 + pulse * 12, 0, 6.283); ctx.stroke();
        ctx.fillStyle = 'rgba(' + (i ? ARC : COP) + ',' + a + ')';
        ctx.beginPath(); ctx.arc(R.x, R.y, 3, 0, 6.283); ctx.fill();
        if (front) {
          ctx.font = '600 10px ' + FONT; ctx.textAlign = 'left';
          ctx.fillStyle = 'rgba(' + WHITE + ',' + 0.95 * on + ')';
          ctx.fillText(pl.n, R.x + 8, R.y - 6);
        }
      });
      ctx.globalCompositeOperation = 'source-over';
      ctx.font = '500 10px ' + FONT; ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(' + ARC + ',0.7)';
      ctx.fillText('GMT+8 · ANY SHIFT', 12, 20);
      ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(' + COP + ',0.75)';
      ctx.fillText('LINKS 2 · LIVE', w - 12, 20);
    });
  }
})();
