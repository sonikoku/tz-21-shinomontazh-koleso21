document.addEventListener("DOMContentLoaded", function () {
  // === 1. ГЕНЕРАЦИЯ REQ-ID В ФОРМАТЕ UUID (Пункт 6.1 ТЗ) ===
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // === 2. ЧТЕНИЕ ИЗ ССЫЛКИ КАЛЬКУЛЯТОРА И СЕССИИ (Пункт 3.3 / 6.3) ===
  function getUrlParam(param) {
    var params = new URLSearchParams(window.location.search);
    return params.get(param);
  }

  // Читаем метки и параметры при первой загрузке страницы и сохраняем в sessionStorage
  if (getUrlParam("utm_source")) sessionStorage.setItem("utm_source", getUrlParam("utm_source"));
  if (getUrlParam("utm_medium")) sessionStorage.setItem("utm_medium", getUrlParam("utm_medium"));
  if (getUrlParam("utm_campaign")) sessionStorage.setItem("utm_campaign", getUrlParam("utm_campaign"));
  if (getUrlParam("utm_content")) sessionStorage.setItem("utm_content", getUrlParam("utm_content"));
  if (getUrlParam("storage")) sessionStorage.setItem("add_storage", getUrlParam("storage"));

  // Подставляем параметры калькулятора в select-поля формы
  var carType = getUrlParam("car_type");
  var rimSize = getUrlParam("rim_size");
  var carSelect = document.getElementById("car-type") || document.querySelector('select[name="car_type"]');
  var rimSelect = document.getElementById("rim-size") || document.querySelector('select[name="rim_size"]');

  if (carType && carSelect) {
    if (carType === 'car') carSelect.value = 'Легковой';
    if (carType === 'crossover') carSelect.value = 'Кроссовер';
    if (carType === 'suv') carSelect.value = 'Внедорожник';
  }
  if (rimSize && rimSelect) {
    if (rimSize === 'r13_15') rimSelect.value = 'R13–R15';
    if (rimSize === 'r16_17') rimSelect.value = 'R16–R17';
    if (rimSize === 'r18_19') rimSelect.value = 'R18–R19';
    if (rimSize === 'r20_plus') rimSelect.value = 'R20+';
  }

  // Выводим текстовую плашку, если выбрано хранение шин
  if (sessionStorage.getItem("add_storage") === "1") {
    var formHeading = document.querySelector(".contacts__form h2") || document.querySelector("h2");
    var storageNotice = document.createElement("div");
    storageNotice.style.background = "var(--c-gray)";
    storageNotice.style.borderLeft = "4px solid var(--c-yellow)";
    storageNotice.style.padding = "12px";
    storageNotice.style.marginBottom = "20px";
    storageNotice.style.borderRadius = "4px";
    storageNotice.innerHTML = "<strong>Услуга включена:</strong> Сезонное хранение шин";
    if (formHeading) formHeading.parentNode.insertBefore(storageNotice, formHeading.nextSibling);
  }

  // === 3. ВАЛИДАЦИЯ И ОТПРАВКА ФОРМЫ (Пункт 6.3 ТЗ) ===
  var bookingForm = document.getElementById("booking-form") || document.querySelector("form");
  var submitBtn = bookingForm ? bookingForm.querySelector('button[type="submit"]') : null;

  if (bookingForm) {
    bookingForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Находим поля (проверь id в своем HTML)
      var nameInput = document.getElementById("name") || bookingForm.querySelector('input[type="text"]');
      var phoneInput = document.getElementById("phone") || bookingForm.querySelector('input[type="tel"]');
      var agreement = bookingForm.querySelector('input[type="checkbox"]');
      
      var hasError = false;

      // Сброс старых стилей и текстов ошибок
      hideError(nameInput);
      hideError(phoneInput);
      hideError(agreement);

      // Валидация Имени (Пункт 6.1 ТЗ: 2–60 символов)
      if (!nameInput.value || nameInput.value.trim().length < 2 || nameInput.value.trim().length > 60) {
        showError(nameInput, "Пожалуйста, введите имя (от 2 до 60 символов)");
        triggerFormError("name", "validation");
        hasError = true;
      }

      // Валидация Телефона (Пункт 6.1 ТЗ: +7 и 10 цифр)
      var phonePattern = /^\+7\d{10}$/;
      var cleanPhone = phoneInput.value.replace(/\s+/g, ''); // убираем пробелы, если они есть
      if (!phonePattern.test(cleanPhone)) {
        showError(phoneInput, "Пожалуйста, введите телефон в формате +71234567890");
        triggerFormError("phone", "validation");
        hasError = true;
      }

      // Валидация чекбокса согласия (Пункт 3.3 ТЗ)
      if (agreement && !agreement.checked) {
        showError(agreement, "Необходимо согласие с политикой конфиденциальности");
        triggerFormError("agreement", "required");
        hasError = true;
      }

      // Если есть хоть одна ошибка — прекращаем выполнение
      if (hasError) return;

      // Блокируем кнопку на время отправки (Пункт 6.3 ТЗ)
      if (submitBtn) submitBtn.disabled = true;

      // Собираем значения для списков (приводим к латинице под формат БД из ТЗ)
      var carMap = { 'Легковой': 'car', 'Кроссовер': 'crossover', 'Внедорожник': 'suv' };
      var rimMap = { 'R13–R15': 'r13_15', 'R16–R17': 'r16_17', 'R18–R19': 'r18_19', 'R20+': 'r20_plus' };

      // Формируем объект данных для отправки
      var formData = {
        request_id: "REQ-" + generateUUID().toUpperCase(), // Генерируем уникальный ID
        name: nameInput.value.trim(),
        phone: cleanPhone,
        email: (document.getElementById("email") || {value: ""}).value.trim(),
        car_type: carMap[carSelect.value] || "car",
        rim_size: rimMap[rimSelect.value] || "r13_15",
        slot: "2026-11-01 09:00", // Сюда нужно будет подставить выбранную дату/время из твоего календаря слотов
        utm_source: sessionStorage.getItem("utm_source") || "direct",
        utm_medium: sessionStorage.getItem("utm_medium") || "none",
        utm_campaign: sessionStorage.getItem("utm_campaign") || "not_set",
        utm_content: sessionStorage.getItem("utm_content") || "not_set"
      };

      // URL ТВОЕГО ВЕБ-ПРИЛОЖЕНИЯ GOOGLE APPS SCRIPT (замени на свой!)
      var WEB_APP_URL = "https://google.com";

      // Отправка через fetch без перезагрузки (Пункт 6.3 ТЗ)
      fetch(WEB_APP_URL, {
        method: "POST",
        mode: "no-cors", // Используем no-cors для обхода ограничений CORS в Apps Script
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      .then(function () {
        // Так как при no-cors мы не можем прочитать точный JSON-ответ от сервера, 
        // но ТЗ требует отправку события generate_lead при успехе:
        if (window.trackCustomEvent) {
          window.trackCustomEvent("generate_lead", {
            lead_rim_size: formData.rim_size,
            lead_car_type: formData.car_type,
            lead_source: formData.utm_source
          });
        }
        // Перенаправляем на страницу спасибо (Пункт 6.3 ТЗ)
        window.location.href = "thanks.html?req_id=" + formData.request_id;
      })
      .catch(function (error) {
        console.error("Ошибка отправки:", error);
        triggerFormError("server", "server");
        if (submitBtn) submitBtn.disabled = false;
      });
    });
  }

  // === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ИНТЕРФЕЙСА ОШИБОК ===
  function showError(inputElement, message) {
    if (!inputElement) return;
    inputElement.style.borderColor = "var(--c-red)";
    
    // Ищем контейнер поля, чтобы показать в нем текст ошибки
    var parent = inputElement.closest(".field") || inputElement.parentNode;
    var errorBlock = parent.querySelector(".error-message");
    
    if (!errorBlock) {
      // Если блока ошибки в HTML изначально не было, создаем динамически
      errorBlock = document.createElement("div");
      errorBlock.className = "error-message";
      errorBlock.style.color = "var(--c-red)";
      errorBlock.style.fontSize = "14px";
      errorBlock.style.marginTop = "4px";
      parent.appendChild(errorBlock);
    }
    
    errorBlock.textContent = message;
    errorBlock.style.display = "block";
  }

  function hideError(inputElement) {
    if (!inputElement) return;
    inputElement.style.borderColor = "#CDD1D6";
    var parent = inputElement.closest(".field") || inputElement.parentNode;
    var errorBlock = parent.querySelector(".error-message");
    if (errorBlock) {
      errorBlock.style.display = "none";
    }
  }

  function triggerFormError(fieldName, errorType) {
    if (window.trackCustomEvent) {
      window.trackCustomEvent("form_error", {
        field_name: fieldName,
        error_type: errorType
      });
    }
  }
});
