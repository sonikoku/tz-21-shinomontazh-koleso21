/* js/metrics.js — дополнительные метрики для ДЗ №4 */
(function () {
  'use strict';

  function sendEvent(name, params) {
    if (typeof window.trackCustomEvent === 'function') {
      window.trackCustomEvent(name, params);
    } else if (typeof window.gtag === 'function') {
      window.gtag('event', name, params || {});
    }
  }

  // 1. nav_click — клики по пунктам меню
  document.addEventListener('click', function (e) {
    var link = e.target.closest('.nav__link');
    if (link) {
      sendEvent('nav_click', {
        link_text: link.textContent.trim(),
        link_url: link.getAttribute('href')
      });
    }
  });

  // 2. utm_visit — метки кампании из адреса
  (function trackUtmVisit() {
    var params = new URLSearchParams(window.location.search);
    var source = params.get('utm_source');
    if (source) {
      sendEvent('utm_visit', {
        utm_source: source,
        utm_medium: params.get('utm_medium') || '(not set)',
        utm_campaign: params.get('utm_campaign') || '(not set)',
        landing_page: window.location.pathname
      });
    }
  })();

  // 3. read_30s — полминуты на странице
  setTimeout(function () {
    sendEvent('read_30s', { page_location: window.location.href });
  }, 30000);

  // 4. form_error — форма не прошла проверку браузера
  document.addEventListener('invalid', function (e) {
    sendEvent('form_error', {
      field_name: e.target.name || e.target.id || 'unknown',
      error_type: 'html5_validation'
    });
  }, true);

})();