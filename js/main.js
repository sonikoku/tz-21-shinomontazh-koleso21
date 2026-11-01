/* КОЛЕСО 21 — основной скрипт: меню, калькулятор */
(function () {
  'use strict';

    // Сохраняем UTM-метки в память при заходе на ЛЮБУЮ страницу сайта
  (function saveUTM() {
    var params = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'storage'];
    params.forEach(function (key) {
      var value = new URLSearchParams(window.location.search).get(key);
      if (value) sessionStorage.setItem(key, value);
    });
  })();

  /* ===== Мобильное меню ===== */
  var burger = document.querySelector('.burger');
  var nav = document.getElementById('main-nav');

  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('is-locked', open);
  }

  if (burger && nav) {
    burger.addEventListener('click', function () {
      setMenu(burger.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setMenu(false);
        burger.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !nav.contains(e.target) && !burger.contains(e.target)) setMenu(false);
    });
    window.matchMedia('(min-width: 1280px)').addEventListener('change', function (mq) {
      if (mq.matches) setMenu(false);
    });
  }

  /* ===== Калькулятор шиномонтажа ===== */
  var BASE_PRICES = { 'R13-R15': 1600, 'R16-R17': 2200, 'R18-R19': 2900, 'R20+': 3600 };
  var CAR_MULTIPLIERS = { 'легковой': 1, 'кроссовер': 1.1, 'внедорожник': 1.2 };
  var STORAGE_PRICES = { 'R13-R15': 3000, 'R16-R17': 3000, 'R18-R19': 3800, 'R20+': 3800 };

  var form = document.getElementById('calc-form');
  if (!form) return;

  var rimSelect = document.getElementById('rim-size');
  var carSelect = document.getElementById('car-type');
  var storageCheckbox = document.getElementById('add-storage');
  var result = document.getElementById('calc-result');
  var outPackage = document.getElementById('result-package');
  var outStorage = document.getElementById('result-storage');
  var storageRow = document.getElementById('result-storage-row');
  var outTotal = document.getElementById('result-total');
  var bookBtn = document.getElementById('calc-book-btn');

  function formatRub(value) {
    return value.toLocaleString('ru-RU') + ' ₽';
  }

  function mapCarToForm(car) {
    if (car === 'легковой') return 'car';
    if (car === 'кроссовер') return 'crossover';
    if (car === 'внедорожник') return 'suv';
    return '';
  }
  function mapRimToForm(rim) {
    if (rim === 'R13-R15') return 'r13_15';
    if (rim === 'R16-R17') return 'r16_17';
    if (rim === 'R18-R19') return 'r18_19';
    if (rim === 'R20+') return 'r20_plus';
    return '';
  }

  function calculate() {
    var rim = rimSelect.value;
    var car = carSelect.value;
    var packagePrice = Math.round(BASE_PRICES[rim] * CAR_MULTIPLIERS[car] / 10) * 10;
    var storagePrice = storageCheckbox.checked ? STORAGE_PRICES[rim] : 0;
    return { rim: rim, car: car, packagePrice: packagePrice, storagePrice: storagePrice, total: packagePrice + storagePrice };
  }

  function render(data) {
    outPackage.textContent = formatRub(data.packagePrice);
    outStorage.textContent = formatRub(data.storagePrice);
    storageRow.hidden = data.storagePrice === 0;
    outTotal.textContent = formatRub(data.total);
    result.hidden = false;

    if (bookBtn) {
      var urlCar = mapCarToForm(data.car);
      var urlRim = mapRimToForm(data.rim);
      var urlStorage = data.storagePrice > 0 ? '1' : '0';
      bookBtn.href = 'contacts.html?service=tires&car_type=' + urlCar + '&rim_size=' + urlRim + '&storage=' + urlStorage + '#booking';
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = calculate();
    render(data);
    
    // Отправляем событие через глобальную функцию из analytics.js
    if (window.trackCustomEvent) {
      window.trackCustomEvent('tire_calc', {
        rim_size: data.rim,
        car_type: data.car,
        total_price: data.total,
        currency: 'RUB',
        page_section: 'calculator'
      });
    }
  });

  form.addEventListener('change', function () {
    if (!result.hidden) render(calculate());
  });
})();