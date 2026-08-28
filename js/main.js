/* Sibway Logistics — мінімальний UI-скрипт */
(function () {
  "use strict";

  /* --- Мобільне меню --- */
  var burger = document.querySelector("[data-burger]");
  var nav = document.querySelector("[data-nav]");

  if (burger && nav) {
    var setOpen = function (open) {
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      nav.setAttribute("data-open", open ? "true" : "false");
    };

    burger.addEventListener("click", function () {
      setOpen(burger.getAttribute("aria-expanded") !== "true");
    });

    nav.addEventListener("click", function (ev) {
      if (ev.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && burger.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        burger.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1100) setOpen(false);
    });
  }

  /* --- Поява блоків при скролі --- */
  var reveals = document.querySelectorAll(".reveal");
  if (reveals.length) {
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      reveals.forEach(function (el) { el.classList.add("is-visible"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
      reveals.forEach(function (el) { io.observe(el); });
    }
  }

  /* --- Форма заявки: валідація + відправка на Formspree ---
     Успіх показуємо ВИКЛЮЧНО після підтвердження від сервера. Якщо запит не
     пройшов, користувач бачить помилку й альтернативний канал зв'язку. */
  document.querySelectorAll("[data-quote-form]").forEach(function (form) {
    var status = form.querySelector("[data-form-status]");
    var consentWrap = form.querySelector("[data-consent]");
    var submitBtn = form.querySelector("[type=submit]");
    var honeypot = form.querySelector("[name=_gotcha]");
    var endpoint = form.getAttribute("action");
    var sending = false;

    var messages = {
      error: status ? status.getAttribute("data-error") : "",
      success: status ? status.getAttribute("data-success") : "",
      pending: status ? status.getAttribute("data-pending") : "",
      network: status ? status.getAttribute("data-network") : ""
    };

    var show = function (state, text) {
      if (!status) return;
      status.textContent = text;
      status.setAttribute("data-state", state);
    };

    var setBusy = function (busy) {
      sending = busy;
      if (submitBtn) submitBtn.disabled = busy;
    };

    var clearInvalid = function () {
      form.querySelectorAll("[aria-invalid]").forEach(function (f) {
        f.setAttribute("aria-invalid", "false");
      });
      if (consentWrap) consentWrap.setAttribute("data-invalid", "false");
    };

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (sending) return;

      var invalid = [];

      form.querySelectorAll("input[required], textarea[required]").forEach(function (field) {
        var ok = field.type === "checkbox" ? field.checked : field.value.trim() !== "";
        if (field.type === "email" && field.value.trim() !== "") {
          ok = ok && /.+@.+\..+/.test(field.value.trim());
        }
        if (!ok) invalid.push(field);
        if (field.type !== "checkbox") {
          field.setAttribute("aria-invalid", ok ? "false" : "true");
        }
      });

      if (consentWrap) {
        var cb = consentWrap.querySelector("input[type=checkbox]");
        consentWrap.setAttribute("data-invalid", cb && !cb.checked ? "true" : "false");
      }

      if (invalid.length) {
        show("error", messages.error);
        invalid[0].focus();
        return;
      }

      /* Пастка для ботів: поле приховане, тож людина його не заповнить.
         Мовчки вдаємо успіх, щоб не підказувати боту про перевірку. */
      if (honeypot && honeypot.value !== "") {
        form.reset();
        clearInvalid();
        show("success", messages.success);
        return;
      }

      /* Без endpoint не вдаємо, що заявку надіслано. */
      if (!endpoint) {
        show("error", messages.network);
        return;
      }

      setBusy(true);
      show("pending", messages.pending);

      fetch(endpoint, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      })
        .then(function (response) {
          if (response.ok) {
            form.reset();
            clearInvalid();
            show("success", messages.success);
            return;
          }
          return response.json().then(
            function (data) {
              var detail = data && data.errors && data.errors.length
                ? data.errors.map(function (e) { return e.message; }).join(" ")
                : "";
              show("error", detail || messages.network);
            },
            function () { show("error", messages.network); }
          );
        })
        .catch(function () {
          show("error", messages.network);
        })
        .then(function () {
          setBusy(false);
        });
    });
  });
})();
