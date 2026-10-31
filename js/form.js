/* js/form.js — логика страницы contacts.html: слоты, валидация, отправка, аналитика */
(function () {
  'use strict';

  /* ===== Конфигурация ===== */
  // ЗАМЕНИТЕ на реальный URL вашего Apps Script (раздел 6.2 ТЗ)
  const API_URL = "https://script.google.com/macros/s/ВАШ_ID/exec";

  // Занятость слотов: дата → время → число занятых постов (всего 4)
  // Пустой объект допустим для демонстрации, но по ТЗ лучше добавить пару занятых слотов
  const OCCUPANCY = {
    // '2026-11-03': { '08:00': 4, '09:00': 3, '12:00': 4 },
    // '2026-11-04': { '10:00': 4, '15:00': 2 }
  };

  const SLOT_TIMES = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00'
  ];

  const WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

  let selectedDate = null;
  let selectedTime = null;

  /* ===== Утилиты ===== */
  function generateUUID() {
    // Формат из ТЗ раздел 6.1: REQ- + UUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function getUrlParam(param) {
    return new URLSearchParams(window.location.search).get(param);
  }

  function saveUTMToSession() {
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'storage'].forEach(function (key) {
      var value = getUrlParam(key);
      if (value) sessionStorage.setItem(key, value);
    });
  }

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

    var carSelect = document.getElementById('car_type');
    var rimSelect = document.getElementById('rim_size');

    if (carType && carSelect) {
      // Значения из калькулятора: car / crossover / suv
      if (carType === 'car') carSelect.value = 'car';
      if (carType === 'crossover') carSelect.value = 'crossover';
      if (carType === 'suv') carSelect.value = 'suv';
    }
    if (rimSize && rimSelect) {
      // Значения из калькулятора: r13_15 / r16_17 / r18_19 / r20_plus
      if (['r13_15', 'r16_17', 'r18_19', 'r20_plus'].indexOf(rimSize) !== -1) {
        rimSelect.value = rimSize;
      }
    }
    if (storage === '1') {
      var consentText = document.querySelector('.checkbox__text');
      if (consentText) {
        consentText.insertAdjacentHTML('beforeend', '<br><small style="color:var(--c-red)">* Выбрано сезонное хранение шин</small>');
      }
    }
  }

  /* ===== Даты и слоты ===== */
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
      btn.innerHTML =
        '<span class="date-btn__weekday">' + WEEKDAYS[date.getDay()] + '</span>' +
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

    var hiddenSlot = document.getElementById('selected_slot');
    if (hiddenSlot) hiddenSlot.value = dateStr + ' ' + time;

    var dateObj = new Date(dateStr);
    if (window.trackCustomEvent) {
      window.trackCustomEvent('slot_select', {
        slot_date: dateStr,
        slot_time: time,
        weekday: WEEKDAYS[dateObj.getDay()]
      });
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

  /* ===== Валидация ===== */
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

    // Сброс всех ошибок
    document.querySelectorAll('.input-error').forEach(function (el) { el.classList.remove('input-error'); });
    document.querySelectorAll('.field-error-msg').forEach(function (el) { el.classList.remove('is-visible'); });

    // Имя: 2–60 символов
    var name = document.getElementById('name');
    if (!name.value.trim() || name.value.trim().length < 2 || name.value.trim().length > 60) {
      showFieldError(name, 'name-error');
      if (window.trackCustomEvent) {
        window.trackCustomEvent('form_error', { field_name: 'name', error_type: 'validation' });
      }
      isValid = false;
    }

    // Телефон: +7 и 10 цифр
    var phone = document.getElementById('phone');
    var cleanPhone = phone.value.replace(/\D/g, '');
    var phonePattern = /^7\d{10}$/;
    if (!phonePattern.test(cleanPhone)) {
      showFieldError(phone, 'phone-error');
      if (window.trackCustomEvent) {
        window.trackCustomEvent('form_error', { field_name: 'phone', error_type: 'validation' });
      }
      isValid = false;
    }

    // Email (необязательный, но если заполнен — проверяем формат)
    var email = document.getElementById('email');
    if (email && email.value.trim()) {
      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email.value.trim())) {
        showFieldError(email, 'email-error');
        if (window.trackCustomEvent) {
          window.trackCustomEvent('form_error', { field_name: 'email', error_type: 'validation' });
        }
        isValid = false;
      }
    }

    // car_type и rim_size
    var carType = document.getElementById('car_type');
    var rimSize = document.getElementById('rim_size');
    if (carType && !carType.value) {
      carType.classList.add('input-error');
      if (window.trackCustomEvent) {
        window.trackCustomEvent('form_error', { field_name: 'car_type', error_type: 'validation' });
      }
      isValid = false;
    }
    if (rimSize && !rimSize.value) {
      rimSize.classList.add('input-error');
      if (window.trackCustomEvent) {
        window.trackCustomEvent('form_error', { field_name: 'rim_size', error_type: 'validation' });
      }
      isValid = false;
    }

    // Согласие
    var consent = document.getElementById('consent');
    if (consent && !consent.checked) {
      var consentErr = document.getElementById('consent-error');
      if (consentErr) consentErr.classList.add('is-visible');
      if (window.trackCustomEvent) {
        window.trackCustomEvent('form_error', { field_name: 'consent', error_type: 'required' });
      }
      isValid = false;
    }

    // Выбор слота
    if (!selectedDate || !selectedTime) {
      if (window.trackCustomEvent) {
        window.trackCustomEvent('form_error', { field_name: 'slot', error_type: 'required' });
      }
      isValid = false;
    }

    return isValid;
  }

  /* ===== Отправка ===== */
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
      car_type: document.getElementById('car_type').value,
      rim_size: document.getElementById('rim_size').value,
      slot: selectedDate + ' ' + selectedTime,
      utm_source: document.getElementById('utm_source').value,
      utm_medium: document.getElementById('utm_medium').value,
      utm_campaign: document.getElementById('utm_campaign').value,
      utm_content: document.getElementById('utm_content').value
    };

    // Скрытое поле request_id тоже заполним — на случай, если пригодится
    var hiddenId = document.getElementById('request_id');
    if (hiddenId) hiddenId.value = formData.request_id;

    try {
      var response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('HTTP ' + response.status);

      var result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Сервер вернул ok: false');

      // Успех: сохраняем для thanks.html
      sessionStorage.setItem('request_summary', JSON.stringify({
        request_id: formData.request_id,
        name: formData.name,
        slot_date: selectedDate,
        slot_time: selectedTime,
        service: 'Шиномонтаж'
      }));

      // generate_lead — только после ok:true (ТЗ 4.3)
      if (window.trackCustomEvent) {
        window.trackCustomEvent('generate_lead', {
          lead_rim_size: formData.rim_size,
          lead_car_type: formData.car_type,
          lead_source: formData.utm_source
        });
      }

      window.location.href = 'thanks.html';

    } catch (error) {
      console.error('Ошибка отправки:', error);

      if (errorDiv) {
        errorDiv.textContent = 'Ошибка: не удалось отправить заявку. Попробуйте позже или позвоните нам.';
        errorDiv.style.display = 'block';
      }

      if (window.trackCustomEvent) {
        window.trackCustomEvent('form_error', {
          field_name: 'server',
          error_type: 'server',
          request_id: formData.request_id
        });
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

  /* ===== Маска телефона ===== */
  function setupPhoneMask() {
    var phoneInput = document.getElementById('phone');
    if (!phoneInput) return;
    phoneInput.addEventListener('input', function (e) {
      var x = e.target.value.replace(/\D/g, '').match(/(\d{0,1})(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/);
      if (!x[2]) {
        e.target.value = x[1] ? '+7' : '';
      } else if (!x[3]) {
        e.target.value = '+7 (' + x[2];
      } else if (!x[4]) {
        e.target.value = '+7 (' + x[2] + ') ' + x[3];
      } else if (!x[5]) {
        e.target.value = '+7 (' + x[2] + ') ' + x[3] + '-' + x[4];
      } else {
        e.target.value = '+7 (' + x[2] + ') ' + x[3] + '-' + x[4] + '-' + x[5];
      }
    });
  }

  /* ===== Сброс ошибок при вводе ===== */
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

  /* ===== Инициализация ===== */
  document.addEventListener('DOMContentLoaded', function () {
    // Если формы нет на странице — выходим (form.js подключён и на других страницах)
    var form = document.getElementById('booking-form');
    if (!form) return;

    saveUTMToSession();
    fillHiddenFields();
    prefillFromUrl();
    renderDates();
    setupPhoneMask();
    setupLiveValidation();

    // request_id в скрытое поле (для совместимости)
    var hiddenId = document.getElementById('request_id');
    if (hiddenId) hiddenId.value = 'REQ-' + generateUUID().toUpperCase();

    form.addEventListener('submit', handleSubmit);
  });
})();