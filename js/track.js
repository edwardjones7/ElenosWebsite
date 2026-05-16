(function () {
  if (navigator.doNotTrack === "1" || navigator.doNotTrack === "yes") return;

  var API_BASE = window.ELENOS_API_BASE || "";
  if (!API_BASE) return;

  var SESSION_KEY = "elenos-session-id";
  var sessionId;
  try {
    sessionId = sessionStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()) + "-" + Math.random().toString(36).slice(2);
      sessionStorage.setItem(SESSION_KEY, sessionId);
    }
  } catch (_) {
    sessionId = String(Date.now()) + "-" + Math.random().toString(36).slice(2);
  }

  function send(type, meta) {
    var body = {
      type: type,
      path: location.pathname,
      referrer: document.referrer || null,
      session_id: sessionId,
      meta: meta || null,
    };
    var json = JSON.stringify(body);
    var url = API_BASE.replace(/\/$/, "") + "/api/track/";

    if (navigator.sendBeacon) {
      try {
        var blob = new Blob([json], { type: "application/json" });
        if (navigator.sendBeacon(url, blob)) return;
      } catch (_) {}
    }
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json,
      keepalive: true,
      credentials: "omit",
    }).catch(function () {});
  }

  window.elenosTrack = send;
  send("pageview");
})();
