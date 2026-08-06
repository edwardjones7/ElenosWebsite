/* Elenos custom booking flow (/book) + manage page (/book/manage).
 * Vanilla JS, dependency-free. Talks to the Next.js API at ELENOS_API_BASE.
 * Calendly-style month calendar; times render in the visitor's timezone. */
(function () {
  "use strict";

  var API_BASE = (window.ELENOS_API_BASE || "").replace(/\/$/, "");
  var TZ = (function () {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch (e) {
      return "";
    }
  })();

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function track(type, meta) {
    if (typeof window.elenosTrack === "function") window.elenosTrack(type, meta || null);
  }

  // ---- Formatting (visitor timezone) ----
  function fmt(iso, opts) {
    try {
      return new Date(iso).toLocaleString(undefined, opts);
    } catch (e) {
      return iso;
    }
  }
  function timeLabel(iso) {
    return fmt(iso, { hour: "numeric", minute: "2-digit" });
  }
  function fullLabel(iso) {
    return fmt(iso, {
      weekday: "long",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
  }
  // Local-day bucket key (visitor tz), e.g. "2026-6-27" (month is 0-based).
  function dayKeyOf(iso) {
    var d = new Date(iso);
    return d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
  }
  // The visitor's IANA timezone, e.g. "America/New York".
  function tzName() {
    return TZ ? TZ.replace(/_/g, " ") : "your local time";
  }

  // ---- Slot fetching ----
  function fetchSlots() {
    return fetch(API_BASE + "/api/booking/slots/", { headers: { Accept: "application/json" } })
      .then(function (r) {
        if (!r.ok) throw new Error("slots " + r.status);
        return r.json();
      })
      .then(function (data) {
        return (data && data.slots) || [];
      });
  }

  // ---- Calendly-style calendar. Builds its own DOM into `root`. ----
  function mountCalendar(root, slots, onPick) {
    var byDay = {};
    slots.forEach(function (iso) {
      var k = dayKeyOf(iso);
      (byDay[k] = byDay[k] || []).push(iso);
    });
    if (!slots.length) {
      root.innerHTML = "";
      return;
    }

    var first = new Date(slots[0]);
    var last = new Date(slots[slots.length - 1]);
    var viewY = first.getFullYear();
    var viewM = first.getMonth();
    var selectedKey = null;

    root.innerHTML =
      '<div class="book-cal">' +
      '<div class="book-cal-main">' +
      '<div class="book-cal-head">' +
      '<button type="button" class="book-cal-nav" data-prev aria-label="Previous month">&lsaquo;</button>' +
      '<div class="book-cal-title" data-title></div>' +
      '<button type="button" class="book-cal-nav" data-next aria-label="Next month">&rsaquo;</button>' +
      "</div>" +
      '<div class="book-cal-weekdays"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div>' +
      '<div class="book-cal-days" data-days></div>' +
      "</div>" +
      '<div class="book-cal-times" data-times hidden>' +
      '<div class="book-cal-times-head" data-times-head></div>' +
      // data-lenis-prevent lets the times list scroll natively instead of the
      // page's Lenis smooth-scroll hijacking the wheel.
      '<div class="book-cal-slots" data-slots data-lenis-prevent></div>' +
      "</div>" +
      "</div>";

    var titleEl = root.querySelector("[data-title]");
    var daysEl = root.querySelector("[data-days]");
    var timesEl = root.querySelector("[data-times]");
    var timesHead = root.querySelector("[data-times-head]");
    var slotsEl = root.querySelector("[data-slots]");
    var prevBtn = root.querySelector("[data-prev]");
    var nextBtn = root.querySelector("[data-next]");

    function monthKey(y, m) {
      return y * 12 + m;
    }
    var minMK = monthKey(first.getFullYear(), first.getMonth());
    var maxMK = monthKey(last.getFullYear(), last.getMonth());

    function renderTimes(key) {
      selectedKey = key;
      var list = byDay[key] || [];
      if (!list.length) return;
      timesEl.hidden = false;
      timesHead.textContent = new Date(list[0]).toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
      slotsEl.innerHTML = "";
      list.forEach(function (iso) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "book-slot";
        b.textContent = timeLabel(iso);
        b.addEventListener("click", function () {
          onPick(iso);
        });
        slotsEl.appendChild(b);
      });
      Array.prototype.forEach.call(daysEl.children, function (c) {
        c.classList.toggle("selected", c.getAttribute("data-key") === key);
      });
    }

    function renderMonth() {
      var mk = monthKey(viewY, viewM);
      prevBtn.disabled = mk <= minMK;
      nextBtn.disabled = mk >= maxMK;
      titleEl.textContent = new Date(viewY, viewM, 1).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });
      daysEl.innerHTML = "";
      var firstDow = new Date(viewY, viewM, 1).getDay();
      var daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
      var i;
      for (i = 0; i < firstDow; i++) {
        var pad = document.createElement("span");
        pad.className = "book-cal-day pad";
        daysEl.appendChild(pad);
      }
      for (var day = 1; day <= daysInMonth; day++) {
        var key = viewY + "-" + viewM + "-" + day;
        if (byDay[key]) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "book-cal-day has" + (key === selectedKey ? " selected" : "");
          btn.textContent = day;
          btn.setAttribute("data-key", key);
          (function (k) {
            btn.addEventListener("click", function () {
              renderTimes(k);
            });
          })(key);
          daysEl.appendChild(btn);
        } else {
          var s = document.createElement("span");
          s.className = "book-cal-day empty";
          s.textContent = day;
          daysEl.appendChild(s);
        }
      }
    }

    prevBtn.addEventListener("click", function () {
      if (viewM === 0) { viewM = 11; viewY--; } else viewM--;
      renderMonth();
    });
    nextBtn.addEventListener("click", function () {
      if (viewM === 11) { viewM = 0; viewY++; } else viewM++;
      renderMonth();
    });

    renderMonth();
    renderTimes(dayKeyOf(slots[0])); // auto-select the first available day
  }

  // ================= BOOKING PAGE =================
  var widget = document.getElementById("book-widget");
  if (widget) initBooking(widget);

  function initBooking(root) {
    var stepPick = root.querySelector(".book-step-pick");
    var stepDetails = root.querySelector(".book-step-details");
    var stepDone = root.querySelector(".book-step-done");
    var pickerEl = root.querySelector("[data-picker]");
    var loadingEl = root.querySelector("[data-loading]");
    var errorEl = root.querySelector("[data-error]");
    var chosenEl = root.querySelector("[data-chosen]");
    var form = root.querySelector("#book-form");
    var statusEl = root.querySelector("[data-status]");
    var backBtn = root.querySelector("[data-back]");
    var tzNameEl = root.querySelector("[data-tzname]");
    var selected = null;
    var detailsShownAt = 0; // time-trap: when the details form was revealed

    if (tzNameEl) tzNameEl.textContent = tzName();

    function show(el) {
      [stepPick, stepDetails, stepDone].forEach(function (s) {
        if (s) s.hidden = s !== el;
      });
    }

    function load() {
      if (loadingEl) loadingEl.hidden = false;
      if (errorEl) errorEl.hidden = true;
      fetchSlots()
        .then(function (slots) {
          if (loadingEl) loadingEl.hidden = true;
          if (!slots.length) {
            if (errorEl) {
              errorEl.hidden = false;
              errorEl.innerHTML =
                'No open times in the next few weeks. <a href="mailto:ed@elenos.ai">Email us</a> and we\'ll find a slot.';
            }
            return;
          }
          mountCalendar(pickerEl, slots, function (iso) {
            selected = iso;
            detailsShownAt = Date.now();
            if (chosenEl) chosenEl.textContent = fullLabel(iso);
            show(stepDetails);
          });
        })
        .catch(function () {
          if (loadingEl) loadingEl.hidden = true;
          if (errorEl) errorEl.hidden = false;
        });
    }

    if (backBtn) backBtn.addEventListener("click", function () { show(stepPick); });

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!selected) { show(stepPick); return; }
        var data = new FormData(form);

        // Client-side validation so the user gets a clear message up front.
        var nm = (data.get("name") || "").toString().trim();
        var em = (data.get("email") || "").toString().trim();
        function warn(msg) { if (statusEl) { statusEl.textContent = msg; statusEl.style.color = "#c0392b"; } }
        if (!nm) { warn("Please enter your name."); return; }
        if (!EMAIL_RE.test(em)) { warn("Please enter a valid email address."); return; }

        var submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;
        if (statusEl) { statusEl.textContent = "Booking…"; statusEl.style.color = ""; }

        // Turnstile helper lives in /script.js, which loads before this file.
        var tokenPromise = window.elenosTurnstile
          ? window.elenosTurnstile.getToken(form, function () {
              if (statusEl) { statusEl.textContent = "One quick check below — tick the box to book."; statusEl.style.color = ""; }
            })
          : Promise.resolve("");

        tokenPromise
          .then(function (turnstileToken) {
            return fetch(API_BASE + "/api/booking/", {
              method: "POST",
              headers: { "Content-Type": "application/json", Accept: "application/json" },
              body: JSON.stringify({
                name: nm,
                email: em,
                company: data.get("company") || "",
                message: data.get("message") || "",
                slot: selected,
                timezone: TZ,
                source_path: location.pathname,
                _gotcha: data.get("_gotcha") || "",
                form_ms: detailsShownAt ? Date.now() - detailsShownAt : 0,
                turnstile_token: turnstileToken,
              }),
            });
          })
          .then(function (res) {
            return res.json().then(function (body) { return { res: res, body: body }; });
          })
          .then(function (r) {
            if (submitBtn) submitBtn.disabled = false;
            if (r.res.ok && r.body.ok) {
              track("book_submit");
              finishBooking(r.body.booking);
            } else if (r.res.status === 409) {
              if (statusEl) { statusEl.textContent = "That time was just taken — pick another."; statusEl.style.color = "#c0392b"; }
              selected = null;
              show(stepPick);
              load();
            } else if (r.res.status === 400) {
              if (statusEl) { statusEl.textContent = "Please enter a valid name and email address."; statusEl.style.color = "#c0392b"; }
            } else if (r.res.status === 403) {
              if (statusEl) { statusEl.textContent = "Verification failed — please try again."; statusEl.style.color = "#c0392b"; }
            } else {
              if (statusEl) { statusEl.textContent = "Couldn't book. Email ed@elenos.ai."; statusEl.style.color = "#c0392b"; }
            }
          })
          .catch(function () {
            if (submitBtn) submitBtn.disabled = false;
            if (statusEl) { statusEl.textContent = "Network error. Email ed@elenos.ai."; statusEl.style.color = "#c0392b"; }
          });
      });
    }

    function finishBooking(booking) {
      var whenEl = root.querySelector("[data-done-when]");
      var meetEl = root.querySelector("[data-meet]");
      var manageEl = root.querySelector("[data-manage]");
      if (whenEl && booking) whenEl.textContent = fullLabel(booking.starts_at);
      if (meetEl) {
        if (booking && booking.meet_url) { meetEl.href = booking.meet_url; meetEl.hidden = false; }
        else meetEl.hidden = true;
      }
      if (manageEl && booking && booking.manage_token) {
        manageEl.href = "/book/manage/?token=" + encodeURIComponent(booking.manage_token);
      }
      show(stepDone);
    }

    load();
  }

  // ================= MANAGE PAGE =================
  var manage = document.getElementById("manage-widget");
  if (manage) initManage(manage);

  function initManage(root) {
    var token = new URLSearchParams(location.search).get("token") || "";
    var loadingEl = root.querySelector("[data-loading]");
    var errorEl = root.querySelector("[data-error]");
    var viewEl = root.querySelector(".manage-view");
    var whenEl = root.querySelector("[data-when]");
    var statusPill = root.querySelector("[data-status-pill]");
    var meetEl = root.querySelector("[data-meet]");
    var actionsEl = root.querySelector(".manage-actions");
    var rescheduleWrap = root.querySelector(".manage-reschedule");
    var pickerEl = root.querySelector("[data-picker]");
    var msgEl = root.querySelector("[data-msg]");
    var current = null;

    function setMsg(text, ok) {
      if (!msgEl) return;
      msgEl.textContent = text || "";
      msgEl.style.color = ok ? "#1e8f5a" : "#c0392b";
    }

    if (!token) {
      if (loadingEl) loadingEl.hidden = true;
      if (errorEl) { errorEl.hidden = false; errorEl.textContent = "Missing booking reference."; }
      return;
    }

    function render(b) {
      current = b;
      if (viewEl) viewEl.hidden = false;
      if (whenEl) whenEl.textContent = fullLabel(b.starts_at);
      if (statusPill) statusPill.textContent = b.status === "canceled" ? "Canceled" : "Confirmed";
      if (meetEl) {
        if (b.meet_url && b.status !== "canceled") { meetEl.href = b.meet_url; meetEl.hidden = false; }
        else meetEl.hidden = true;
      }
      if (actionsEl) actionsEl.hidden = b.status === "canceled";
    }

    fetch(API_BASE + "/api/booking/manage/?token=" + encodeURIComponent(token), {
      headers: { Accept: "application/json" },
    })
      .then(function (res) { return res.json().then(function (body) { return { res: res, body: body }; }); })
      .then(function (r) {
        if (loadingEl) loadingEl.hidden = true;
        if (r.res.ok && r.body.ok) render(r.body.booking);
        else if (errorEl) { errorEl.hidden = false; errorEl.textContent = "We couldn't find that booking."; }
      })
      .catch(function () {
        if (loadingEl) loadingEl.hidden = true;
        if (errorEl) { errorEl.hidden = false; errorEl.textContent = "Something went wrong. Email ed@elenos.ai."; }
      });

    var cancelBtn = root.querySelector("[data-cancel]");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", function () {
        if (!confirm("Cancel this call?")) return;
        cancelBtn.disabled = true;
        fetch(API_BASE + "/api/booking/cancel/", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ token: token }),
        })
          .then(function (res) { return res.json(); })
          .then(function (body) {
            cancelBtn.disabled = false;
            if (body.ok) {
              track("book_cancel");
              if (current) { current.status = "canceled"; render(current); }
              setMsg("Your call is canceled. You can book again anytime.", true);
            } else setMsg("Couldn't cancel. Email ed@elenos.ai.", false);
          })
          .catch(function () { cancelBtn.disabled = false; setMsg("Network error.", false); });
      });
    }

    var rescheduleBtn = root.querySelector("[data-reschedule]");
    if (rescheduleBtn && rescheduleWrap) {
      rescheduleBtn.addEventListener("click", function () {
        rescheduleWrap.hidden = false;
        rescheduleBtn.disabled = true;

        function onPick(iso) {
          if (!confirm("Move your call to " + fullLabel(iso) + "?")) return;
          fetch(API_BASE + "/api/booking/reschedule/", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ token: token, slot: iso }),
          })
            .then(function (res) { return res.json().then(function (body) { return { res: res, body: body }; }); })
            .then(function (r) {
              if (r.res.ok && r.body.ok) {
                track("book_reschedule");
                rescheduleWrap.hidden = true;
                rescheduleBtn.disabled = false;
                if (current) { current.starts_at = r.body.booking.starts_at; render(current); }
                setMsg("Rescheduled. A new confirmation is on its way.", true);
              } else if (r.res.status === 409) {
                setMsg("That time was just taken — pick another.", false);
                fetchSlots().then(function (s) { mountCalendar(pickerEl, s, onPick); });
              } else setMsg("Couldn't reschedule. Email ed@elenos.ai.", false);
            })
            .catch(function () { setMsg("Network error.", false); });
        }

        fetchSlots()
          .then(function (slots) {
            if (!slots.length) { setMsg("No open times right now — email ed@elenos.ai.", false); return; }
            mountCalendar(pickerEl, slots, onPick);
          })
          .catch(function () { setMsg("Couldn't load times.", false); });
      });
    }
  }
})();
