/* Elenos first-party analytics tracker (Phase 3).
 *
 * Replaces the queue stub installed in (marketing)/layout.tsx and drains anything
 * script.js already queued. Sends pageviews, element-level clicks ([data-track]),
 * and a presence heartbeat to /api/e. Dependency-free, no build step.
 *
 * Accuracy notes:
 *   - Stable session id (30-min sliding idle) so repeat views = ONE session.
 *   - Persistent visitor id (vid) for unique-visitor counts.
 *   - Bot guard (webdriver / headless UA) so automated traffic is not counted.
 *   - sendBeacon (survives unload, no preflight) with a keepalive-fetch fallback.
 *   - Pageview de-dup (500ms) to avoid double counts from re-renders / bfcache.
 */
(function () {
  "use strict";

  // ---- Endpoint (mirror script.js's ELENOS_API_BASE convention) ----
  var BASE = (window.ELENOS_API_BASE || "").replace(/\/$/, "");
  var ENDPOINT = BASE + "/api/e";

  // ---- Bot / non-human guard ----
  function isBot() {
    try {
      if (navigator.webdriver) return true;
      var ua = navigator.userAgent || "";
      return /bot|crawl|spider|slurp|headless|phantom|puppeteer|playwright|lighthouse|gtmetrix|pingdom|prerender|google web preview/i.test(
        ua
      );
    } catch (e) {
      return false;
    }
  }
  if (isBot() || document.visibilityState === "prerender") return;

  // ---- Identity (localStorage) ----
  var SID_KEY = "el_sid",
    SID_TS_KEY = "el_sid_ts",
    VID_KEY = "el_vid",
    MAX_IDLE_MS = 30 * 60 * 1000; // 30-min sliding session window

  function uuid() {
    try {
      if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    } catch (e) {}
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
  function read(k) {
    try {
      return localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  }
  function write(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch (e) {}
  }

  function sessionId() {
    var now = Date.now();
    var id = read(SID_KEY);
    var ts = parseInt(read(SID_TS_KEY) || "0", 10);
    if (!id || !ts || now - ts > MAX_IDLE_MS) {
      id = uuid();
      write(SID_KEY, id);
    }
    write(SID_TS_KEY, String(now)); // slide the window on every event
    return id;
  }
  function visitorId() {
    var id = read(VID_KEY);
    if (!id) {
      id = uuid();
      write(VID_KEY, id);
    }
    return id;
  }

  // ---- Transport ----
  function send(type, meta) {
    var payload;
    try {
      payload = JSON.stringify({
        type: type,
        path: location.pathname || "/",
        referrer: document.referrer || null,
        session_id: sessionId(),
        meta: Object.assign({}, meta || {}, { vid: visitorId() }),
      });
    } catch (e) {
      return;
    }

    // sendBeacon with a text/plain blob is a CORS "simple request" (no preflight)
    // and survives page unload. /api/e parses the body with req.json() regardless.
    try {
      if (navigator.sendBeacon) {
        var blob = new Blob([payload], { type: "text/plain;charset=UTF-8" });
        if (navigator.sendBeacon(ENDPOINT, blob)) return;
      }
    } catch (e) {}

    // Fallback: keepalive fetch (preflighted; /api/e has an OPTIONS handler).
    try {
      fetch(ENDPOINT, {
        method: "POST",
        keepalive: true,
        mode: "cors",
        credentials: "omit",
        headers: { "Content-Type": "application/json" },
        body: payload,
      }).catch(function () {});
    } catch (e) {}
  }

  // ---- Pageviews (load + SPA history changes, de-duped) ----
  var lastPath = null,
    lastPvAt = 0;
  function pageview() {
    var p = location.pathname || "/";
    var now = Date.now();
    if (p === lastPath && now - lastPvAt < 500) return;
    lastPath = p;
    lastPvAt = now;
    send("pageview");
  }
  (function patchHistory() {
    ["pushState", "replaceState"].forEach(function (m) {
      var orig = history[m];
      if (typeof orig !== "function") return;
      history[m] = function () {
        var ret = orig.apply(this, arguments);
        try {
          pageview();
        } catch (e) {}
        return ret;
      };
    });
    window.addEventListener("popstate", function () {
      pageview();
    });
  })();

  // ---- Element-level clicks (any [data-track] on the page) ----
  document.addEventListener(
    "click",
    function (e) {
      var t = e.target;
      var el = t && t.closest ? t.closest("[data-track]") : null;
      if (!el) return;
      var name = el.getAttribute("data-track");
      if (!name) return;
      send("click", {
        name: name,
        text: (el.textContent || "").trim().slice(0, 80),
        href: el.getAttribute("href") || null,
        tag: (el.tagName || "").toLowerCase(),
      });
    },
    true // capture, so stopPropagation elsewhere can't hide the click
  );

  // ---- Heartbeat (powers "live now") ----
  function beat() {
    send("heartbeat");
  }
  function startHeartbeat() {
    beat();
    setInterval(function () {
      if (document.visibilityState === "visible") beat();
    }, 15000);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") beat();
    });
  }

  // ---- Replace the stub + drain anything script.js already queued ----
  window.elenosTrack = function (type, meta) {
    if (type) send(type, meta || null);
  };
  var queued = window.__elenosQueue;
  if (queued && queued.length) {
    for (var i = 0; i < queued.length; i++) {
      try {
        window.elenosTrack(queued[i][0], queued[i][1]);
      } catch (e) {}
    }
  }
  window.__elenosQueue = [];

  // ---- Go ----
  pageview();
  startHeartbeat();
})();
