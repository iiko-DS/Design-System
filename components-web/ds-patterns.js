/* ============================================================================
   iiko DS · Паттерны поведения для прототипов (20.10.2026)
   ----------------------------------------------------------------------------
   Единые механики, которые раньше дублировались в каждой странице (и из-за
   дублей расходились). Страницы подключают этот файл ДО своего inline-скрипта:

     <script src="../../../Design-System/components-web/ds-patterns.js"></script>

   Что здесь:
     - скролл списков компонентом Scroll (инстанс `ds-scroll--v`, см. fixes.css):
       показ полосы по переполнению, длина ползунка — пропорционально видимой
       части, позиция — по scrollTop; колесо над полосой крутит список, ползунок
       перетаскивается (как на стендах Menu (Container) / Select);
     - ничего более; при добавлении новых общих механик — только сюда, не в
       страницы.
   ========================================================================== */
(function () {
  'use strict';

  /* ── Скролл списка (вертикальный вариант Scroll) ─────────────────────────
     list  — прокручиваемый элемент (.fpop__scroll / .mass-edit__list …)
     strip — полоса компонента Scroll (.fscroll с .ds-scroll__background/__knob)
     Минимальная длина ползунка — 24 px (длина ползунка Scroll S, fixes.css). */
  function scrollSync(list, strip) {
    if (!list || !strip) return;
    /* интерактив — один раз на полосу, как на стендах Menu/Select: колесо над
       полосой крутит список, ползунок перетаскивается мышью */
    if (!strip.__dsScrollInit) {
      strip.__dsScrollInit = true;
      strip.addEventListener('wheel', function (e) {
        list.scrollTop += e.deltaY;
        scrollSync(list, strip);
        e.preventDefault();
      }, { passive: false });
      var knob = strip.querySelector('.ds-scroll__knob');
      var track = strip.querySelector('.ds-scroll__background');
      if (knob && track) {
        knob.addEventListener('mousedown', function (e) {
          e.preventDefault();
          var startY = e.clientY;
          var startTop = list.scrollTop;
          var range = track.clientHeight - knob.offsetHeight;
          var max = list.scrollHeight - list.clientHeight;
          function move(ev) {
            list.scrollTop = startTop + (ev.clientY - startY) * max / Math.max(1, range);
            scrollSync(list, strip);
          }
          function up() {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
          }
          document.addEventListener('mousemove', move);
          document.addEventListener('mouseup', up);
        });
      }
    }
    var can = list.scrollHeight > list.clientHeight + 1;
    strip.hidden = !can;
    if (!can) return;
    var track = strip.querySelector('.ds-scroll__background');
    var knob = strip.querySelector('.ds-scroll__knob');
    if (!track || !knob) return;
    var trackH = track.clientHeight;
    var knobH = Math.max(24, Math.round(trackH * list.clientHeight / list.scrollHeight));
    var maxTop = trackH - knobH;
    var ratio = list.scrollTop / (list.scrollHeight - list.clientHeight);
    knob.style.height = knobH + 'px';
    knob.style.marginTop = Math.round(maxTop * ratio) + 'px';
  }

  /* вешает слушатель прокрутки и сразу синхронизирует; возвращает функцию
     обновления — вызывать её после перестроения списка (поиск/фильтр/раскрытие) */
  function initScroll(list, strip) {
    var sync = function () { scrollSync(list, strip); };
    list.addEventListener('scroll', sync);
    sync();
    return sync;
  }

  /* ── Search: крестик очистки значения ─────────────────────────────────────
     Паттерн (20.10.2026): при непустом значении в правом слоте компонента
     Search (.ds-search__right-icon) показывается ✕; клик очищает значение,
     шлёт input (фильтры страницы пересчитываются) и возвращает фокус в поле.
     Иконка — Icon size (S/XS — 20, M — 24), цвет — как у иконки поиска.
     Подключается само для всех .ds-search с input.ds-search__label; для
     разметки, добавленной позже, — вызвать DSPatterns.initSearchClear(root). */
  function initSearchClear(root) {
    var scope = root || document;
    var boxes = scope.querySelectorAll ? scope.querySelectorAll('.ds-search') : [];
    Array.prototype.forEach.call(boxes, function (box) {
      var input = box.querySelector('input.ds-search__label');
      if (!input || box.__dsClearInit || box.querySelector('.hc-search__clear')) return;   /* у старого шапочного поиска свой крестик — не дублируем */
      box.__dsClearInit = true;
      var slot = box.querySelector('.ds-search__right-icon');
      if (!slot) {
        slot = document.createElement('span');
        slot.className = 'ds-search__right-icon';
        box.appendChild(slot);
      }
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ds-search__clear';
      btn.setAttribute('aria-label', 'Очистить');
      btn.hidden = true;
      btn.innerHTML = '<span class="ds-icon-size ds-icon-size--state ' + (box.classList.contains('ds-search--m') ? 'ds-icon-size--6x' : 'ds-icon-size--5x') + '"><span class="material-icons" aria-hidden="true">close</span></span>';
      slot.insertBefore(btn, slot.firstChild);
      var sync = function () { btn.hidden = !input.value; };
      input.addEventListener('input', sync);
      input.addEventListener('change', sync);
      btn.addEventListener('mousedown', function (e) { e.preventDefault(); });   /* фокус остаётся в поле */
      btn.addEventListener('click', function () {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus();
        sync();
      });
      sync();
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initSearchClear(document); });
  } else {
    initSearchClear(document);
  }

  /* ── Input: Empty → Focus — подпись уезжает наверх (06.11.2026) ────────────
     Один паттерн на все страницы: раньше каждая страница дублировала переключение
     подписи «по значению» — и на фокусе пустого поля подпись НЕ поднималась,
     хотя у Textarea по фокусу она уезжает вверх (журнал ДС №262) → на одном экране
     два поля формы вели себя по-разному (замечание заказчика: «почему поведение
     отличается… всё одинаковое везде»). Правило: подпись видна, если в поле есть
     текст ИЛИ поле в фокусе, плейсхолдер в этот момент скрыт (он и есть подпись
     состояния Empty); ушли из пустого поля — вернулся плейсхолдер. */
  function initFloatLabel(root) {
    var wraps = (root || document).querySelectorAll('.ds-input');
    Array.prototype.forEach.call(wraps, function (wrap) {
      if (wrap.__dsFloatInit) return;
      var field = wrap.querySelector('input.ds-input__field');
      var label = wrap.querySelector('.ds-input__label');
      if (!field || !label) return;                 /* S/XS и поля-селекты — без подписи */
      wrap.__dsFloatInit = true;
      if (!field.hasAttribute('data-ph')) field.setAttribute('data-ph', field.placeholder || '');
      var sync = function () {
        var up = !!field.value || document.activeElement === field;
        label.hidden = !up;
        wrap.classList.toggle('ds-input--populated', up);
        wrap.classList.toggle('ds-input--empty', !up);
        field.placeholder = up ? '' : (field.getAttribute('data-ph') || '');
      };
      field.addEventListener('focus', sync);
      field.addEventListener('blur', sync);
      field.addEventListener('input', sync);
      wrap.__dsFloatSync = sync;
      sync();
    });
  }
  /* пересчитать подпись после ПРОГРАММНОГО заполнения поля (страница ставит value сама) */
  function syncFloatLabel(wrap) {
    if (wrap && typeof wrap.__dsFloatSync === 'function') wrap.__dsFloatSync();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initFloatLabel(document); });
  } else {
    initFloatLabel(document);
  }

  window.DSPatterns = {
    scrollSync: scrollSync,
    initScroll: initScroll,
    initSearchClear: initSearchClear,
    initFloatLabel: initFloatLabel,
    syncFloatLabel: syncFloatLabel
  };
})();
