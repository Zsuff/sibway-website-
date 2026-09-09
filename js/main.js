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
        if (typeof form.__reapplyQuoteService === "function") form.__reapplyQuoteService();
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
            if (typeof form.__reapplyQuoteService === "function") form.__reapplyQuoteService();
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

/* --- Service-aware форма заявки: title/helper/placeholder/hidden service ---
   Ізольований блок. Спрацьовує лише якщо форма явно підтримує потрібні
   data-атрибути (наразі — лише contacts.html); на інших сторінках із
   [data-quote-form] (наприклад, головна) безпечно нічого не робить —
   без DOM-вузлів і без JS-помилок. Мову бере з наявного hidden
   input[name="language"] форми, без нових body-атрибутів чи URL-евристик
   для мови. Значення з URL ніколи не потрапляє в DOM напряму: спочатку
   звіряється з allowlist, і лише тоді використовується як ключ
   статичного словника нижче. */
(function () {
  "use strict";

  var ALLOWED_SERVICES = ["transport", "customs", "warehouse", "audit"];
  var DEFAULT_SERVICE = "general";

  var CONTENT = {
    uk: {
      general: {
        title: "Заявка на розрахунок",
        helper: "Опишіть вашу задачу — це допоможе нам підготувати точний розрахунок або відповідь.",
        label: "Опишіть вантаж, маршрут і терміни",
        placeholder: "Наприклад: 20 палет, Польща — Україна, дата готовності вантажу."
      },
      transport: {
        title: "Заявка на розрахунок перевезення",
        helper: "Вкажіть дані про вантаж і маршрут — це потрібно для точного прорахунку перевезення.",
        label: "Опишіть вантаж, маршрут і терміни",
        placeholder: "Наприклад: 20 палет, Польща — Україна, дата готовності вантажу."
      },
      customs: {
        title: "Запит щодо митного оформлення",
        helper: "Опишіть товар і етап митного оформлення — це допоможе зрозуміти ваш запит.",
        label: "Опишіть товар і етап митного оформлення",
        placeholder: "Наприклад: країна відправлення, тип товару, код УКТ ЗЕД — якщо відомий, дата прибуття."
      },
      warehouse: {
        title: "Запит щодо складських послуг",
        helper: "Вкажіть тип вантажу, потрібні складські операції та орієнтовний період.",
        label: "Опишіть вантаж і потрібні складські послуги",
        placeholder: "Наприклад: тип вантажу, кількість палет або місць, потрібні операції та орієнтовний період."
      },
      audit: {
        title: "Запит на логістичний аудит",
        helper: "Опишіть поточну логістичну задачу та що саме потрібно покращити.",
        label: "Опишіть вашу логістичну задачу",
        placeholder: "Наприклад: напрямки перевезень, поточна задача та що потрібно покращити."
      }
    },
    en: {
      general: {
        title: "Request a quote",
        helper: "Describe your request — this will help us prepare an accurate quote or response.",
        label: "Describe your cargo, route and deadlines",
        placeholder: "E.g.: 20 pallets, Poland — Ukraine, cargo ready date."
      },
      transport: {
        title: "Request a transport quote",
        helper: "Share your cargo and route details — we need them to prepare an accurate transport quote.",
        label: "Describe your cargo, route and deadlines",
        placeholder: "E.g.: 20 pallets, Poland — Ukraine, cargo ready date."
      },
      customs: {
        title: "Customs clearance enquiry",
        helper: "Describe the goods and the current customs-clearance stage — this will help us understand your request.",
        label: "Describe the goods and customs-clearance stage",
        placeholder: "E.g.: country of dispatch, type of goods, UKTZED code — if known, arrival date."
      },
      warehouse: {
        title: "Warehousing services enquiry",
        helper: "Specify the cargo type, required warehouse operations and estimated period.",
        label: "Describe your cargo and required warehouse services",
        placeholder: "E.g.: cargo type, number of pallets or units, required operations and estimated period."
      },
      audit: {
        title: "Logistics audit request",
        helper: "Describe your current logistics challenge and what you would like to improve.",
        label: "Describe your logistics challenge",
        placeholder: "E.g.: transport directions, current task and what needs improving."
      }
    },
    pl: {
      general: {
        title: "Zapytanie o wycenę",
        helper: "Opisz swoje zapytanie — pomoże nam to przygotować dokładną wycenę lub odpowiedź.",
        label: "Opisz ładunek, trasę i terminy",
        placeholder: "Np.: 20 palet, Polska — Ukraina, data gotowości ładunku."
      },
      transport: {
        title: "Zapytanie o wycenę transportu",
        helper: "Podaj dane o ładunku i trasie — są potrzebne do dokładnej wyceny transportu.",
        label: "Opisz ładunek, trasę i terminy",
        placeholder: "Np.: 20 palet, Polska — Ukraina, data gotowości ładunku."
      },
      customs: {
        title: "Zapytanie o odprawę celną",
        helper: "Opisz towar i etap odprawy celnej — pomoże nam to zrozumieć Twoje zapytanie.",
        label: "Opisz towar i etap odprawy celnej",
        placeholder: "Np.: kraj wysyłki, rodzaj towaru, kod CN/UKTZED — jeśli znany, data przybycia."
      },
      warehouse: {
        title: "Zapytanie o usługi magazynowe",
        helper: "Podaj rodzaj ładunku, wymagane operacje magazynowe i orientacyjny okres.",
        label: "Opisz ładunek i wymagane usługi magazynowe",
        placeholder: "Np.: rodzaj ładunku, liczba palet lub miejsc, wymagane operacje i orientacyjny okres."
      },
      audit: {
        title: "Zapytanie o audyt logistyczny",
        helper: "Opisz aktualne wyzwanie logistyczne i co chcesz usprawnić.",
        label: "Opisz swoje wyzwanie logistyczne",
        placeholder: "Np.: kierunki przewozów, obecne zadanie i co wymaga usprawnienia."
      }
    }
  };

  /* Порожній, відсутній, невалідний, з іншим регістром або дубльований
     параметр — усе трактується як "general". URLSearchParams.getAll
     дозволяє окремо виявити саме дублювання (getAll().length !== 1). */
  var resolveService = function () {
    var all;
    try {
      all = new URLSearchParams(window.location.search).getAll("service");
    } catch (e) {
      return DEFAULT_SERVICE;
    }
    if (all.length !== 1) return DEFAULT_SERVICE;
    if (ALLOWED_SERVICES.indexOf(all[0]) !== -1) return all[0];
    return DEFAULT_SERVICE;
  };

  document.querySelectorAll("form[data-quote-form]").forEach(function (form) {
    var scope = form.closest("section") || form.parentElement;
    var titleEl = scope ? scope.querySelector("[data-quote-title]") : null;
    var helperEl = scope ? scope.querySelector("[data-quote-helper]") : null;
    var serviceInput = form.querySelector("[data-quote-service]");
    var messageEl = form.querySelector("[data-quote-message]");
    var languageInput = form.querySelector('input[name="language"]');
    /* Опційний елемент: label textarea. На відміну від полів вище він не
       входить до обов'язкового guard нижче — якщо атрибут десь відсутній,
       title/helper/placeholder все одно продовжують працювати як раніше. */
    var messageLabelEl = form.querySelector("[data-quote-message-label]");

    /* Форма без потрібних data-атрибутів (наприклад, форма на головній
       сторінці) — не чіпаємо: жодних нових DOM-вузлів, жодних помилок,
       звичайний submit-flow іншого блоку лишається незмінним. */
    if (!titleEl || !helperEl || !serviceInput || !messageEl || !languageInput) return;

    var dict = CONTENT[languageInput.value];
    if (!dict) return;

    var resolved = resolveService();

    var applyService = function (service) {
      var entry = dict[service] || dict[DEFAULT_SERVICE];
      if (!entry) return;
      titleEl.textContent = entry.title;
      helperEl.textContent = entry.helper;
      messageEl.setAttribute("placeholder", entry.placeholder);
      if (messageLabelEl && entry.label) messageLabelEl.textContent = entry.label;
      serviceInput.value = service;
    };

    applyService(resolved);

    /* form.reset() (викликається у флоу успішної відправки вище) не
       збуджує подію "reset" і поверне hidden-поле до value="general" з
       HTML. Даємо тому блоку спосіб повторно застосувати resolved
       service без дублювання цієї логіки. */
    form.__reapplyQuoteService = function () {
      applyService(resolved);
    };
  });
})();

/* --- Cookie notice: інформаційне повідомлення про cookies/GA4 ---
   Суто інформаційне: не блокує, не вмикає й не вимикає жодну аналітику.
   Не використовує cookies — лише localStorage, без персональних даних. */
(function () {
  "use strict";

  var STORAGE_KEY = "sibway-cookie-notice-dismissed";
  var notice = document.querySelector("[data-cookie-notice]");
  if (!notice) return;

  var dismissBtn = notice.querySelector("[data-cookie-notice-dismiss]");
  var reopenBtns = document.querySelectorAll("[data-cookie-notice-reopen]");
  var lastOpener = null;

  var storageGet = function () {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  };
  var storageSet = function () {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch (e) { /* ignore */ }
  };
  var storageClear = function () {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
  };

  var hide = function () {
    notice.hidden = true;
    if (lastOpener) {
      lastOpener.focus();
      lastOpener = null;
    }
  };

  var show = function (opener) {
    lastOpener = opener || null;
    notice.hidden = false;
    if (dismissBtn) dismissBtn.focus();
  };

  var dismiss = function () {
    storageSet();
    hide();
  };

  /* Перший показ: без взаємодії користувача, без переведення фокусу. */
  if (!storageGet()) {
    notice.hidden = false;
  }

  if (dismissBtn) {
    dismissBtn.addEventListener("click", dismiss);
  }

  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape" && !notice.hidden) {
      dismiss();
    }
  });

  reopenBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      storageClear();
      show(btn);
    });
  });
})();
