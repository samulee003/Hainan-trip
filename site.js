(function () {
  'use strict';

  const STORAGE_PREFIX = 'hainan-family-guide:';

  function setNavState(toggle, nav, open) {
    toggle.setAttribute('aria-expanded', String(open));
    nav.hidden = !open;
    toggle.textContent = open ? '關閉目錄' : '開啟目錄';
  }

  function setupMobileNavigation() {
    document.querySelectorAll('[data-menu-toggle]').forEach(function (toggle) {
      const navId = toggle.getAttribute('aria-controls');
      const nav = navId ? document.getElementById(navId) : null;
      if (!nav) return;

      setNavState(toggle, nav, false);

      toggle.addEventListener('click', function () {
        const willOpen = toggle.getAttribute('aria-expanded') !== 'true';
        setNavState(toggle, nav, willOpen);
      });

      nav.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          if (window.matchMedia('(max-width: 47.99rem)').matches) {
            setNavState(toggle, nav, false);
          }
        });
      });

      window.addEventListener('resize', function () {
        if (!window.matchMedia('(max-width: 47.99rem)').matches) {
          setNavState(toggle, nav, true);
        } else if (toggle.getAttribute('aria-expanded') !== 'true') {
          nav.hidden = true;
        }
      });
    });
  }

  function setupDisclosures() {
    document.querySelectorAll('[data-disclosure]').forEach(function (disclosure) {
      const trigger = disclosure.querySelector('[data-disclosure-trigger]');
      const panel = disclosure.querySelector('[data-disclosure-panel]');
      if (!trigger || !panel) return;

      const isOpenByDefault = disclosure.getAttribute('data-default-open') !== 'false';
      const openLabel = trigger.textContent.trim();
      const closedLabel = openLabel.indexOf('收合') === 0 ? '展開' + openLabel.slice(2) : openLabel;
      const setState = function (open) {
        trigger.setAttribute('aria-expanded', String(open));
        panel.hidden = !open;
        if (openLabel.indexOf('收合') === 0) {
          trigger.textContent = open ? openLabel : closedLabel;
        }
      };

      setState(isOpenByDefault);

      trigger.addEventListener('click', function () {
        setState(trigger.getAttribute('aria-expanded') !== 'true');
      });
    });
  }

  function setupPrintButtons() {
    document.querySelectorAll('[data-print]').forEach(function (button) {
      button.addEventListener('click', function () {
        window.print();
      });
    });
  }

  function setupChecklist() {
    const key = STORAGE_PREFIX + 'checklist';
    const items = Array.from(document.querySelectorAll('[data-check-item]'));
    if (!items.length) return;

    let saved = {};
    try {
      saved = JSON.parse(window.localStorage.getItem(key) || '{}');
    } catch (error) {
      saved = {};
    }

    items.forEach(function (input) {
      const id = input.getAttribute('data-check-item');
      input.checked = Boolean(saved[id]);
      input.addEventListener('change', function () {
        saved[id] = input.checked;
        try {
          window.localStorage.setItem(key, JSON.stringify(saved));
        } catch (error) {
          // The checklist still works when storage is unavailable.
        }
      });
    });
  }

  function setupHashState() {
    const links = Array.from(document.querySelectorAll('[data-anchor-link]'));
    const sections = Array.from(document.querySelectorAll('[data-section]'));
    if (!links.length || !sections.length || !('IntersectionObserver' in window)) return;

    const markActive = function (id) {
      links.forEach(function (link) {
        const linkId = (link.getAttribute('href') || '').split('#')[1];
        link.classList.toggle('is-active', linkId === id);
      });
    };

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) markActive(entry.target.id);
      });
    }, {
      rootMargin: '-30% 0px -55% 0px',
      threshold: 0
    });

    sections.forEach(function (section) { observer.observe(section); });

    if (window.location.hash) {
      markActive(window.location.hash.slice(1));
    }

    links.forEach(function (link) {
      link.addEventListener('click', function () {
        const id = (link.getAttribute('href') || '').split('#')[1];
        if (id) markActive(id);
      });
    });
  }

  function setupLastLocation() {
    const page = document.body.getAttribute('data-page');
    if (!page) return;

    try {
      window.localStorage.setItem(STORAGE_PREFIX + 'last-page', page);
      if (window.location.hash) {
        window.localStorage.setItem(STORAGE_PREFIX + 'last-anchor', window.location.hash.slice(1));
      }
    } catch (error) {
      // Navigation should not depend on storage.
    }
  }

  function setupDayNav() {
    const nav = document.querySelector('[data-day-nav]');
    if (!nav) return;
    const cards = Array.from(document.querySelectorAll('.day-card'));
    function toggleCard(card, open) {
      const trigger = card.querySelector('[data-disclosure-trigger]');
      const panel = card.querySelector('[data-disclosure-panel]');
      if (!trigger || !panel) return;
      const isOpen = trigger.getAttribute('aria-expanded') === 'true';
      if (open && !isOpen) trigger.click();
      if (!open && isOpen) trigger.click();
    }
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        const id = (link.getAttribute('href') || '').split('#')[1];
        const target = document.getElementById(id);
        if (!target) return;
        cards.forEach(function (c) { if (c !== target) toggleCard(c, false); });
        toggleCard(target, true);
        window.setTimeout(function () {
          link.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }, 80);
      });
    });

    // During the trip, open today's card automatically on first load.
    if (!window.location.hash) {
      const now = new Date();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      const todayLink = Array.from(nav.querySelectorAll('a')).find(function (link) {
        const date = link.querySelector('.day-nav__date');
        return date && date.textContent.trim() === month + '/' + day;
      });
      if (todayLink) {
        const id = (todayLink.getAttribute('href') || '').split('#')[1];
        const target = document.getElementById(id);
        if (target) {
          cards.forEach(function (c) { toggleCard(c, c === target); });
          todayLink.classList.add('is-active');
          window.setTimeout(function () {
            todayLink.scrollIntoView({ block: 'nearest', inline: 'center' });
          }, 120);
        }
      }
    }
  }

  setupMobileNavigation();
  setupDisclosures();
  setupPrintButtons();
  setupChecklist();
  setupHashState();
  setupLastLocation();
  setupDayNav();
}());
