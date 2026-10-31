/* js/analytics.js — Единый файл для сбора всех событий GA4 */
(function () {
  'use strict';

  // Базовая функция отправки, которая есть ТОЛЬКО здесь
  function sendToGA(eventName, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params || {});
    }
  }

  // Глобальная функция, которую будут вызывать другие скрипты
  window.trackCustomEvent = sendToGA;

  // Делегированный перехват кликов по элементам с data-event
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-event]');
    if (!el) return;

    var eventName = el.dataset.event;
    
    // Собираем параметры из data-атрибутов
    var params = { 
      page_section: el.dataset.pageSection || '' 
    };

    if (el.dataset.buttonName) params.button_name = el.dataset.buttonName;
    if (el.dataset.serviceName) params.service_name = el.dataset.serviceName;
    if (el.dataset.network) params.network = el.dataset.network;
    
    // Для хранения
    if (el.dataset.storageType) params.storage_type = el.dataset.storageType;
    if (el.dataset.rimGroup) params.rim_group = el.dataset.rimGroup;
    
    // Для скачивания файлов
    if (el.dataset.fileName) params.file_name = el.dataset.fileName;
    if (el.dataset.fileType) params.file_extension = el.dataset.fileType;

    // Для телефона/e-mail и карт
    if (el.dataset.contactType) params.contact_type = el.dataset.contactType;
    if (el.dataset.mapService) params.map_service = el.dataset.mapService;

    // Отправляем
    sendToGA(eventName, params);
  });

  // Отдельный перехват для раскрытия FAQ (событие toggle)
  document.addEventListener('toggle', function (e) {
    if (e.target && e.target.matches && e.target.matches('details.faq__item[data-event="faq_open"]')) {
      if (!e.target.open) return; // Реагируем только на открытие
      
      sendToGA('faq_open', {
        question_id: e.target.dataset.questionId || '',
        page_section: e.target.dataset.pageSection || ''
      });
    }
  }, true); // Используем фазу перехвата, так как toggle не всплывает
})();