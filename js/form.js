/* js/form.js — логика страницы contacts.html: слоты, валидация, отправка, аналитика */
(function () {
  'use strict';

  // ЗАМЕНИТЕ на реальный URL вашего Apps Script (заканчивается на /exec)
  const API_URL = "https://script.google.com/macros/s/AKfycbxsSAArwqHhwDcxPs4GSPTowdSjKjmLrA418NTLfW-hYmW7-Ys2X1YoXAbSZvxYhvMjzQ/exec";

  const OCCUPANCY = {
    '2026-11-01': { '08:00': 4, '12:00': 3, '15:00': 4 } 
  };

  const SLOT_TIMES = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];
  const WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

  let selectedDate = null;
  let selectedTime = null;

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function getUrlParam(param) {
    return new URLSearchParams(window.location.search).get(param);
  }

//   function saveUTMToSession() {
//     ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'storage'].forEach(function (key) {
//       var value = getUrlParam(key);
//       if (value) sessionStorage.setItem(key, value);
//     });
//   }

  function fillHiddenFields() {
    var map = {
      utm_source: sessionStorage.getItem('utm_source') || 'direct',
      utm_medium: sessionStorage.getItem('utm_medium') || 'none',
      utm_campaign: sessionStorage.getItem('utm_campaign') || 'not_set',
      utm_content: sessionStorage.getItem('utm_content') || 'not_set'
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = map[id];
    });
  }

  function prefillFromUrl() {
    var carType = getUrlParam('car_type');
    var rimSize = getUrlParam('rim_size');
    var storage = getUrlParam('storage');
    var service = getUrlParam('service');

    var carSelect = document.getElementById('car_type');
    var rimSelect = document.getElementById('rim_size');
    var serviceSelect = document.getElementById('service_type');

    if (service && serviceSelect) serviceSelect.value = service;
    if (carType && carSelect && ['car', 'crossover', 'suv'].indexOf(carType) !== -1) carSelect.value = carType;
    if (rimSize && rimSelect && ['r13_15', 'r16_17', 'r18_19', 'r20_plus'].indexOf(rimSize) !== -1) rimSelect.value = rimSize;
    
    // Если пришло storage=1, ставим комбинированную услугу
    if (storage === '1' && serviceSelect) {
      serviceSelect.value = 'tires_storage';
    }
  }

  // Скрываем диаметр шин, если выбрано автосервисное обслуживание
  function toggleFieldsByService() {
    var serviceSelect = document.getElementById('service_type');
    if (!serviceSelect) return;

    var rimField = document.getElementById('rim_size').closest('.field');
    var service = serviceSelect.value;

    if (service === 'oil' || service === 'diagnostics' || service === 'alignment' || service === 'battery') {
      rimField.style.display = 'none';
      document.getElementById('rim_size').required = false;
      document.getElementById('rim_size').value = 'r13_15'; 
    } else {
      rimField.style.display = 'flex';
      document.getElementById('rim_size').required = true;
    }
  }

  function renderDates() {
    var container = document.getElementById('dates-container');
    if (!container) return;
    container.innerHTML = '';
    var today = new Date();

    for (var i = 0; i < 14; i++) {
      var date = new Date(today);
      date.setDate(today.getDate() + i);
      var yyyy = date.getFullYear();
      var mm = String(date.getMonth() + 1).padStart(2, '0');
      var dd = String(date.getDate()).padStart(2, '0');
      var dateStr = yyyy + '-' + mm + '-' + dd;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'date-btn';
      btn.dataset.date = dateStr;
      btn.innerHTML = '<span class="date-btn__weekday">' + WEEKDAYS[date.getDay()] + '</span>' +
                      '<span class="date-btn__day">' + date.getDate() + '</span>' +
                      '<span class="date-btn__month">' + MONTHS[date.getMonth()] + '</span>';

      (function (ds, el) {
        el.addEventListener('click', function () { selectDate(ds, el); });
      })(dateStr, btn);
      container.appendChild(btn);
    }
  }

  function selectDate(dateStr, btnEl) {
    document.querySelectorAll('.date-btn').forEach(function (b) { b.classList.remove('is-active'); });
    btnEl.classList.add('is-active');
    selectedDate = dateStr;
    selectedTime = null;
    renderSlots();
    updateSubmitButton();
  }

  function renderSlots() {
    var container = document.getElementById('slots-container');
    if (!container) return;
    container.innerHTML = '';

    if (!selectedDate) {
      container.innerHTML = '<p style="color: var(--c-muted); grid-column: 1 / -1;">Сначала выберите дату</p>';
      return;
    }

    var dateOccupancy = OCCUPANCY[selectedDate] || {};
    SLOT_TIMES.forEach(function (time) {
      var occupied = dateOccupancy[time] || 0;
      var isFull = occupied >= 4;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'slot-btn';
      btn.disabled = isFull;

      if (isFull) {
        btn.innerHTML = time + '<span class="slot-btn__meta">Мест нет</span>';
      } else {
        btn.innerHTML = time + '<span class="slot-btn__meta">' + (4 - occupied) + ' мест</span>';
        (function (t, el) {
          el.addEventListener('click', function () { selectSlot(t, el, selectedDate); });
        })(time, btn);
      }
      container.appendChild(btn);
    });
  }

  function selectSlot(time, btnEl, dateStr) {
    document.querySelectorAll('.slot-btn').forEach(function (b) { b.classList.remove('is-selected'); });
    btnEl.classList.add('is-selected');
    selectedTime = time;

    var slotErr = document.getElementById('slot-error-msg');
    if (slotErr) slotErr.classList.remove('is-visible');

    var hiddenSlot = document.getElementById('selected_slot');
    if (hiddenSlot) hiddenSlot.value = dateStr + ' ' + time;
    var dateObj = new Date(dateStr);
    if (window.trackCustomEvent) {
      window.trackCustomEvent('slot_select', { slot_date: dateStr, slot_time: time, weekday: WEEKDAYS[dateObj.getDay()] });
    }
    updateSubmitButton();
  }

  function updateSubmitButton() {
    var btn = document.getElementById('submit-btn');
    if (!btn) return;
    if (selectedDate && selectedTime) {
      btn.disabled = false;
      btn.textContent = 'Записаться';
    } else {
      btn.disabled = true;
      btn.textContent = 'Выберите время и оставьте заявку';
    }
  }

  function showFieldError(input, msgId) {
    if (!input) return;
    input.classList.add('input-error');
    var msg = document.getElementById(msgId);
    if (msg) msg.classList.add('is-visible');
  }

  function hideFieldError(input, msgId) {
    if (!input) return;
    input.classList.remove('input-error');
    var msg = document.getElementById(msgId);
    if (msg) msg.classList.remove('is-visible');
  }

  function validateForm() {
    var isValid = true;
    document.querySelectorAll('.input-error').forEach(function (el) { el.classList.remove('input-error'); });
    document.querySelectorAll('.field-error-msg').forEach(function (el) { el.classList.remove('is-visible'); });

    var name = document.getElementById('name');
    if (!name.value.trim() || name.value.trim().length < 2 || name.value.trim().length > 60) {
      showFieldError(name, 'name-error');
      if (window.trackCustomEvent) window.trackCustomEvent('form_error', { field_name: 'name', error_type: 'validation' });
      isValid = false;
    }

    var phone = document.getElementById('phone');
    var cleanPhone = phone.value.replace(/\D/g, '');
    if (!/^7\d{10}$/.test(cleanPhone)) {
      showFieldError(phone, 'phone-error');
      if (window.trackCustomEvent) window.trackCustomEvent('form_error', { field_name: 'phone', error_type: 'validation' });
      isValid = false;
    }

    var email = document.getElementById('email');
    if (email && email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      showFieldError(email, 'email-error');
      if (window.trackCustomEvent) window.trackCustomEvent('form_error', { field_name: 'email', error_type: 'validation' });
      isValid = false;
    }

    var carType = document.getElementById('car_type');
    var rimSize = document.getElementById('rim_size');
    var serviceType = document.getElementById('service_type');

    if (serviceType && !serviceType.value) {
      serviceType.classList.add('input-error');
      isValid = false;
    }
    if (carType && !carType.value) {
      carType.classList.add('input-error');
      isValid = false;
    }
    
    // Проверяем rim_size только если он виден (не скрыт для автосервиса)
    if (rimSize && rimSize.required && !rimSize.value) {
      rimSize.classList.add('input-error');
      isValid = false;
    }

    var consent = document.getElementById('consent');
    if (consent && !consent.checked) {
      var consentErr = document.getElementById('consent-error');
      if (consentErr) consentErr.classList.add('is-visible');
      if (window.trackCustomEvent) window.trackCustomEvent('form_error', { field_name: 'consent', error_type: 'required' });
      isValid = false;
    }

    // Проверка времени и даты (оставляем только один раз)
    if (!selectedDate || !selectedTime) {
      var slotErr = document.getElementById('slot-error-msg');
      if (slotErr) slotErr.classList.add('is-visible'); // Показываем красный текст
      
      if (window.trackCustomEvent) window.trackCustomEvent('form_error', { field_name: 'slot', error_type: 'required' });
      isValid = false;
    }

    return isValid;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) {
      var firstError = document.querySelector('.input-error');
      if (firstError) firstError.focus();
      return;
    }

    var btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.textContent = 'Отправляем...';
    var errorDiv = document.getElementById('form-error-msg');
    if (errorDiv) errorDiv.style.display = 'none';

    var formData = {
      request_id: 'REQ-' + generateUUID().toUpperCase(),
      name: document.getElementById('name').value.trim(),
      phone: '+7' + document.getElementById('phone').value.replace(/\D/g, '').replace(/^7/, ''),
      email: document.getElementById('email').value.trim(),
      service_type: document.getElementById('service_type').value,
      car_type: document.getElementById('car_type').value,
      rim_size: document.getElementById('rim_size').value,
      slot: selectedDate + ' ' + selectedTime,
      utm_source: document.getElementById('utm_source').value,
      utm_medium: document.getElementById('utm_medium').value,
      utm_campaign: document.getElementById('utm_campaign').value,
      utm_content: document.getElementById('utm_content').value
    };

    try {
      // Возвращаем no-cors, так как Google ломает CORS при перенаправлении
      await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(formData)
      });

      // Так как мы используем no-cors, мы не можем прочитать JSON от Google.
      // Но раз ошибки сети нет, значит данные улетели.
      sessionStorage.setItem('request_summary', JSON.stringify({
        request_id: formData.request_id,
        name: formData.name,
        slot_date: selectedDate,
        slot_time: selectedTime,
        service: formData.service_type
      }));

      // Отправляем событие (сделано после fetch, как требует ТЗ)
        if (window.trackCustomEvent) {
          // Добавляем transport_type: 'beacon', чтобы события не терялись при переходе
          window.trackCustomEvent('form_submit', { 
            form_id: 'booking-form',
            transport_type: 'beacon' 
          });

          window.trackCustomEvent('generate_lead', {
            lead_rim_size: formData.rim_size,
            lead_car_type: formData.car_type,
            lead_source: formData.utm_source,
            transport_type: 'beacon' // И сюда тоже
          });
        }
      
      // Переходим на страницу спасибо
      setTimeout(function() {
        window.location.href = 'thanks.html';
      }, 200);

    } catch (error) {
      // Сюда попадем только если реально пропал интернет
      console.error('Ошибка отправки:', error);
      if (errorDiv) {
        errorDiv.textContent = 'Ошибка сети: не удалось отправить заявку. Проверьте интернет.';
        errorDiv.style.display = 'block';
      }
      if (window.trackCustomEvent) {
        window.trackCustomEvent('form_error', { field_name: 'server', error_type: 'server' });
      }
      btn.textContent = 'Ошибка';
      btn.classList.add('btn--secondary');
      setTimeout(function () {
        btn.disabled = false;
        btn.textContent = 'Записаться';
        btn.classList.remove('btn--secondary');
      }, 3000);
    }
  }

  function setupPhoneMask() {
    var phoneInput = document.getElementById('phone');
    if (!phoneInput) return;
    phoneInput.addEventListener('input', function (e) {
      var x = e.target.value.replace(/\D/g, '').match(/(\d{0,1})(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/);
      if (!x[2]) e.target.value = x[1] ? '+7' : '';
      else if (!x[3]) e.target.value = '+7 (' + x[2];
      else if (!x[4]) e.target.value = '+7 (' + x[2] + ') ' + x[3];
      else if (!x[5]) e.target.value = '+7 (' + x[2] + ') ' + x[3] + '-' + x[4];
      else e.target.value = '+7 (' + x[2] + ') ' + x[3] + '-' + x[4] + '-' + x[5];
    });
  }

  function setupLiveValidation() {
    var name = document.getElementById('name');
    var phone = document.getElementById('phone');
    var consent = document.getElementById('consent');

    if (name) name.addEventListener('input', function () { hideFieldError(name, 'name-error'); });
    if (phone) phone.addEventListener('input', function () { hideFieldError(phone, 'phone-error'); });
    if (consent) consent.addEventListener('change', function () {
      if (consent.checked) {
        var err = document.getElementById('consent-error');
        if (err) err.classList.remove('is-visible');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('booking-form');
    if (!form) return;

    saveUTMToSession();
    fillHiddenFields();
    prefillFromUrl();
    renderDates();
    setupPhoneMask();
    setupLiveValidation();

    // Инициализация скрытия полей
    toggleFieldsByService();
    var serviceSelect = document.getElementById('service_type');
    if (serviceSelect) {
      serviceSelect.addEventListener('change', toggleFieldsByService);
    }

    var hiddenId = document.getElementById('request_id');
    if (hiddenId) hiddenId.value = 'REQ-' + generateUUID().toUpperCase();

    form.addEventListener('submit', handleSubmit);
  });
})();