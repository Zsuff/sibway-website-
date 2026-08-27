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

  /* --- Валідація форми заявки (демо, без відправки на сервер) --- */
  document.querySelectorAll("[data-quote-form]").forEach(function (form) {
    var status = form.querySelector("[data-form-status]");
    var consentWrap = form.querySelector("[data-consent]");

    var messages = {
      error: status ? status.getAttribute("data-error") : "",
      success: status ? status.getAttribute("data-success") : ""
    };

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
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

      if (!status) return;

      if (invalid.length) {
        status.textContent = messages.error;
        status.setAttribute("data-state", "error");
        invalid[0].focus();
      } else {
        status.textContent = messages.success;
        status.setAttribute("data-state", "success");
        form.reset();
        form.querySelectorAll("[aria-invalid]").forEach(function (f) {
          f.setAttribute("aria-invalid", "false");
        });
        if (consentWrap) consentWrap.setAttribute("data-invalid", "false");
      }
    });
  });
})();
