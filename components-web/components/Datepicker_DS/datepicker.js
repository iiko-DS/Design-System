/* datepicker — компонент ДС «Datepicker» / «Input Datepicker»: поведение + разметка.
   РУЧНОЙ файл: лежит рядом со сгенерированным слоем этого компонента
   (datepicker.css, control-panel.css, elements.css, input-datepicker.css) и обновлениями
   из Фигмы НЕ перезаписывается.

   Что делает:
   • Datepicker.mount() — календарь по классам ДС (ds-datepicker, ds-elements*): сетка дней
     (1-й клик = один день, 2-й = диапазон), листание месяцев (‹ ›) и пилюля «месяц год ⌄» —
     переключение видов как в Figma (Type=Day → Type=Year 4×3 → Type=Month 3×4, узел 58509-5439).
   • Datepicker.mountInput() — сборка «Input Datepicker» (узел 58548-4764): поле даты ДС
     (ds-input*, размер M) + эта же выпадашка по иконке date_range.

   Вид и правки: ручные правки поверх генерации — в ../fixes.css (разделы «Datepicker» п. 9–11
   и «Input Datepicker» п. 12), журнал — DS/fixes.md (№75, 77–78).

   Использование:
     var cal = Datepicker.mount(document.getElementById('cal'), {
       start: new Date(2026, 0, 10), end: new Date(2026, 0, 20),   // необязательно
       onPick: function (s, e) { ... }                              // s,e — Date|null
     });
     cal.view(new Date(2026, 1, 1));   // показать месяц
     cal.reset();                      // начать выбор заново (следующий клик — новый день)

     var dp = Datepicker.mountInput(document.getElementById('dp'), {
       value: new Date(), open: false,                             // необязательно
       onPick: function (s) { ... }                                // s — Date (один день)
     }); */
(function () {
  'use strict';

  var MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  var WDAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];   /* шапка недели — капсом, как в примерах Figma (58987-16573) */

  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function fmtD(d) { return pad2(d.getDate()) + '.' + pad2(d.getMonth() + 1) + '.' + String(d.getFullYear()).slice(2); }
  function fmtFull(d) { return pad2(d.getDate()) + '.' + pad2(d.getMonth() + 1) + '.' + d.getFullYear(); }   /* ДД.ММ.ГГГГ — поле Input Datepicker */
  function cut(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function sameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }

  /* ── Разметка: три вида как в компоненте Figma (Type=Day / Year / Month, узел 58509-5439) ──
     Дни: панель «Октябрь 2026 ⌄» + шапка недели + разделитель + сетка дней;
     Год: 12 лет (4×3), пилюля «‹месяц› ‹год› ⌃»; Месяц: 12 месяцев (3×4), пилюля «‹год› ⌃».
     Классы — только ДС: ds-datepicker, ds-control-panel__*, ds-elements__*. */

  /* Текст пилюли: дни/год — «Октябрь 2026» (месяц+год, как в Figma), месяцы — «2026». */
  function headText(st) {
    var y = st.view.getFullYear();
    if (st.mode === 'month') return String(y);
    if (st.mode === 'year' && st.decade) {          /* Examples: вид года показывает блок «2020 - 2039» */
      var b = Math.floor(y / 20) * 20;
      return b + ' - ' + (b + 19);
    }
    return MONTHS[st.view.getMonth()] + ' ' + y;
  }

  /* Панель-шапка: пилюля «месяц год ⌄» (клик переключает вид) + стрелки ‹ › (только в виде дней). */
  function headHTML(st, up, arrows) {
    return '<div class="ds-datepicker__control-panel">' +
      '<span class="ds-elements ds-elements--month ds-elements--default ds-datepicker__head" role="button" tabindex="0" data-cal-head aria-label="Переключить вид">' +
        '<span class="ds-control-panel__label">' + headText(st) + '</span>' +
        '<span class="ds-control-panel__icon"><span class="ds-icon-size ds-icon-size--5x ds-icon-size--state"><span class="material-icons">' + (up ? 'arrow_drop_up' : 'arrow_drop_down') + '</span></span></span>' +
      '</span>' +
      (arrows
        ? '<span class="ds-control-panel__button-icon-group">' +
            '<span class="ds-control-panel__button-icon" role="button" tabindex="0" data-cal-step="-1" aria-label="Предыдущий месяц"><span class="ds-icon-size ds-icon-size--5x ds-icon-size--state"><span class="material-icons">keyboard_arrow_left</span></span></span>' +
            '<span class="ds-control-panel__button-icon" role="button" tabindex="0" data-cal-step="1" aria-label="Следующий месяц"><span class="ds-icon-size ds-icon-size--5x ds-icon-size--state"><span class="material-icons">keyboard_arrow_right</span></span></span>' +
          '</span>'
        : '') +
    '</div>';
  }

  /* Сетка дней месяца: строки по 7. y/m — какой месяц рисуем (для двухмесячного вида).
     Текущий месяц — «01»…«31» (default/today/selected + диапазон), дни соседних месяцев — выключенные
     серые (как в Figma: opacity .38, клику недоступны). */
  function dayRowsFor(st, y, m, maxRows) {
    var offset = (new Date(y, m, 1).getDay() + 6) % 7;      /* Пн = 0 */
    var days = new Date(y, m + 1, 0).getDate();
    var prevDays = new Date(y, m, 0).getDate();
    var today = st.today || cut(new Date());   /* st.today — фиксированное «сегодня» для витрин */
    var total = Math.ceil((offset + days) / 7) * 7;
    if (maxRows) total = Math.min(total, maxRows * 7);   /* двухмесячный вид: фиксированные 5 рядов, как в Figma */
    var rows = '', row = '';
    for (var i = 0; i < total; i++) {
      var day = i - offset + 1, inner;
      if (day < 1) {          /* хвост прошлого месяца */
        inner = '<span class="ds-elements ds-elements--cell ds-elements--default ds-elements--disabled">' +
                '<span class="ds-elements__label">' + (prevDays + day) + '</span></span>';
      } else if (day > days) { /* начало следующего месяца */
        inner = '<span class="ds-elements ds-elements--cell ds-elements--default ds-elements--disabled">' +
                '<span class="ds-elements__label">' + (day - days) + '</span></span>';
      } else {
        var dt = new Date(y, m, day);
        var isS = st.start && sameDay(dt, st.start);
        var isE = st.end && sameDay(dt, st.end);
        var inR = st.start && st.end && dt >= st.start && dt <= st.end;
        var cls = (isS || isE) ? 'ds-elements--selected' : (sameDay(dt, today) ? 'ds-elements--today' : 'ds-elements--default');
        inner = '<span class="ds-elements ds-elements--cell ' + cls + '" data-day="' + dt.getTime() + '">' +
                '<span class="ds-elements__label">' + pad2(day) + '</span></span>';
        /* один день (начало = конец) — только кружок выбранной ячейки, без подсветки диапазона */
        if (isS && isE) { /* без обёртки */ }
        else if (isS) inner = '<span class="ds-elements__range-highlight-start">' + inner + '</span>';
        else if (isE) inner = '<span class="ds-elements__range-highlight-end">' + inner + '</span>';
        else if (inR) inner = '<span class="ds-elements__range-highlight-middle">' + inner + '</span>';
      }
      row += inner;
      if (i % 7 === 6) { rows += '<div class="ds-datepicker__week-6">' + row + '</div>'; row = ''; }
    }
    return rows;
  }

  function dayRowsHTML(st) {
    return dayRowsFor(st, st.view.getFullYear(), st.view.getMonth());
  }

  /* Панель одного месяца двухмесячного вида: стрелка + пилюля месяца (Elements Datepicker/Month,
     текст Body S 14/20 Medium — по данным Figma), шапка недели, разделитель, сетка дней. */
  function monthPanelHTML(st, date, arrow) {
    var y = date.getFullYear(), m = date.getMonth();
    var wd = '';
    for (var wi = 0; wi < 7; wi++) wd += '<span class="ds-datepicker__label">' + WDAYS[wi] + '</span>';
    var btn = function (step, glyph, label) {
      return '<span class="ds-control-panel__button-icon" role="button" tabindex="0" data-cal-step="' + step + '" aria-label="' + label + '">' +
        '<span class="ds-icon-size ds-icon-size--5x ds-icon-size--state"><span class="material-icons">' + glyph + '</span></span></span>';
    };
    return '<div class="ds-datepicker__month">' +
      '<div class="ds-datepicker__control-panel">' +
        (arrow === 'left' ? btn(-1, 'keyboard_arrow_left', 'Предыдущий месяц') : '') +
        '<span class="ds-elements ds-elements--month ds-elements--default ds-datepicker__month-title">' +
          '<span class="ds-control-panel__label">' + MONTHS[m] + ' ' + y + '</span>' +
        '</span>' +
        (arrow === 'right' ? btn(1, 'keyboard_arrow_right', 'Следующий месяц') : '') +
      '</div>' +
      '<div class="ds-datepicker__elements">' + wd + '</div>' +
      '<div class="ds-datepicker__divider"></div>' +
      '<div class="ds-datepicker__days">' + dayRowsFor(st, y, m, 5) + '</div>' +
    '</div>';
  }

  /* Вид года: блок 20 лет (4×5) вокруг текущего (view.year − 2 … +17), выбранный — синяя пилюля.
     В Figma (Type=Year, 312×292) — 4 колонки × 5 рядов по 70×40. */
  function yearsHTML(st) {
    var cur = st.view.getFullYear();
    var base = st.decade ? Math.floor(cur / 20) * 20 : cur - 2;   /* decade: блок годов выровнен по 20 */
    var rows = '';
    for (var r = 0; r < 5; r++) {
      var row = '';
      for (var c = 0; c < 4; c++) {
        var yy = base + r * 4 + c;
        row += '<span class="ds-elements ds-elements--year ' + (yy === cur ? 'ds-elements--selected' : 'ds-elements--default') + '" role="button" tabindex="0" data-year="' + yy + '">' +
               '<span class="ds-elements__label">' + yy + '</span></span>';
      }
      rows += '<div class="ds-datepicker__week-6">' + row + '</div>';
    }
    return rows;
  }

  /* Вид месяцев: 12 месяцев (3×4). В Figma месяцы в сетке — инстансы того же компонента,
     что годы (свойства узла: Type=Year, Year=Октябрь; Hug 98×40 = пад 16/16 + текст 16/24),
     поэтому рендерятся классами --year (капсула, без иконки) */
  function monthsHTML(st) {
    var cur = st.view.getMonth(), rows = '';
    for (var r = 0; r < 4; r++) {
      var row = '';
      for (var c = 0; c < 3; c++) {
        var mm = r * 3 + c;
        row += '<span class="ds-elements ds-elements--year ' + (mm === cur ? 'ds-elements--selected' : 'ds-elements--default') + '" role="button" tabindex="0" data-month="' + mm + '">' +
               '<span class="ds-elements__label">' + MONTHS[mm] + '</span></span>';
      }
      rows += '<div class="ds-datepicker__week-6">' + row + '</div>';
    }
    return rows;
  }

  function calHTML(st) {
    var cls = 'ds-datepicker' + (st.static ? ' ds-datepicker--static' : '');
    /* Двухмесячный вид (кадр 61306-79280, 625×337): две колонки по 312 и разделитель 1 */
    if (st.mode === 'day' && st.months === 2) {
      var second = new Date(st.view.getFullYear(), st.view.getMonth() + 1, 1);
      return '<div class="' + cls + ' ds-datepicker--dual">' +
        monthPanelHTML(st, st.view, 'left') +
        '<div class="ds-datepicker__vdivider"></div>' +
        monthPanelHTML(st, second, 'right') +
      '</div>';
    }
    /* Сетка годов/месяцев — в обёртке .ds-datepicker__days (пад 4/4), как в кадре Figma */
    if (st.mode === 'year') return '<div class="' + cls + '">' + headHTML(st, true, false) + '<div class="ds-datepicker__days">' + yearsHTML(st) + '</div></div>';
    if (st.mode === 'month') return '<div class="' + cls + '">' + headHTML(st, true, false) + '<div class="ds-datepicker__days">' + monthsHTML(st) + '</div></div>';
    var wd = '';
    for (var wi = 0; wi < 7; wi++) wd += '<span class="ds-datepicker__label">' + WDAYS[wi] + '</span>';
    return '<div class="' + cls + '">' +
      headHTML(st, false, true) +
      '<div class="ds-datepicker__elements">' + wd + '</div>' +
      '<div class="ds-datepicker__divider"></div>' +
      '<div class="ds-datepicker__days">' + dayRowsHTML(st) + '</div>' + '</div>';
  }

  /* Mount: один календарь в контейнере root. Возвращает мини-API.
     mode: 'day' (сетка дней) / 'year' / 'month' — старт задаётся opts.mode, дальше переключается пилюлей «месяц год ⌄».
     static: true — только вид (без кликов) — для статичных витрин вариантов стенда. */
  function mount(root, opts) {
    opts = opts || {};
    var st = {
      start: opts.start ? cut(opts.start) : null,
      end: opts.end ? cut(opts.end) : null,
      view: cut(opts.view || opts.start || new Date()),
      today: opts.today ? cut(opts.today) : null,   /* витрины: «сегодня» как в кадре Figma */
      decade: !!opts.decade,   /* вид года: блок 20 лет с заголовком «2020 - 2039» */
      pickFrom: null,
      mode: opts.mode || 'day',  /* начальный вид (карточки стенда: 'day' | 'year' | 'month') */
      months: opts.months || 1,  /* 2 — двухмесячный вид (кадр 61306-79280) */
      static: !!opts.static      /* витрина: без обработчика кликов */
    };

    function render() { root.innerHTML = calHTML(st); }

    function pick(ts) {
      var d = cut(new Date(ts));
      if (!st.pickFrom) {              /* 1-й клик — один день */
        st.start = d; st.end = d; st.pickFrom = d;
      } else {                          /* 2-й клик — диапазон (порядок кликов неважен) */
        st.start = d < st.pickFrom ? d : st.pickFrom;
        st.end = d < st.pickFrom ? st.pickFrom : d;
        st.pickFrom = null;
      }
      render();
      if (opts.onPick) opts.onPick(st.start, st.end);
    }

    function onClick(e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var step = t.closest('[data-cal-step]');
      if (step && root.contains(step)) {
        st.view = new Date(st.view.getFullYear(), st.view.getMonth() + parseInt(step.getAttribute('data-cal-step'), 10), 1);
        render();
        return;
      }
      var head = t.closest('[data-cal-head]');
      if (head && root.contains(head)) {          /* пилюля: день → год, год → день, месяц → год */
        st.mode = st.mode === 'day' ? 'year' : (st.mode === 'month' ? 'year' : 'day');
        render();
        return;
      }
      var yr = t.closest('[data-year]');
      if (yr && root.contains(yr)) {              /* выбран год → показываем месяцы этого года */
        st.view = new Date(parseInt(yr.getAttribute('data-year'), 10), st.view.getMonth(), 1);
        st.mode = 'month';
        render();
        return;
      }
      var mo = t.closest('[data-month]');
      if (mo && root.contains(mo)) {              /* выбран месяц → сетка дней */
        st.view = new Date(st.view.getFullYear(), parseInt(mo.getAttribute('data-month'), 10), 1);
        st.mode = 'day';
        render();
        return;
      }
      var day = t.closest('[data-day]');
      if (day && root.contains(day)) pick(parseInt(day.getAttribute('data-day'), 10));
    }

    if (!st.static) root.addEventListener('click', onClick);
    render();

    var api = {
      el: root,
      get: function () { return { start: st.start, end: st.end }; },
      /* показать месяц (и перерисовать); вид всегда возвращается к сетке дней */
      view: function (d) {
        st.mode = 'day';
        st.view = cut(d || st.start || new Date());
        render();
        return api;
      },
      /* задать выделение (или снять, если null) */
      set: function (s, e) {
        st.start = s ? cut(s) : null;
        st.end = e ? cut(e) : null;
        st.pickFrom = null;
        if (st.start) st.view = cut(st.start);
        st.mode = 'day';
        render();
        return api;
      },
      /* начать выбор заново: следующий клик — новый один день, вид — сетка дней */
      reset: function () { st.pickFrom = null; st.mode = 'day'; return api; }
    };
    return api;
  }

  /* ── Сборка «Input Datepicker» (поле даты + выпадающий календарь, узел 58548-4764) ──────
     Разметка — классы ДС: поле ds-input* (Form-Field-Input_DS/input.css, размер M),
     календарь ds-datepicker (mount выше). Дату можно набрать в поле или выбрать
     в календаре по иконке date_range справа.
     Float-модель лейбла — как в примерах Figma «Datepicker (Examples)» (58987-16573):
     в покое подпись стоит в строке ввода (в витрине Empty это сам формат «ДД.ММ.ГГГГ»),
     при фокусе/значении всплывает наверх (в фокусе — акцентный), а формат «ДД.ММ.ГГГГ»
     виден только при вводе. Витрина Populated (opts.populated) — подпись «Дата» вверху,
     строка ввода пустая, формат цветом плейсхолдера #D6D6D6 — как в кадре 58548-4764.
     Выпадашка и float-логика — ручной слой fixes.css (раздел «Input Datepicker»).
     opts: { label, ariaLabel, placeholder, value: Date, populated, open, static, onPick(s, e) }
     static: true — только поле, без выпадашки и слушателей (витрина вариантов стенда). */
  function mountInput(wrap, opts) {
    opts = opts || {};
    var label = opts.label || 'Дата';
    var ariaLabel = opts.ariaLabel || 'Дата';
    var state = opts.state || '';   /* витрина «Поведение»: '' | hover | focus | focus-value | selected */
    var isText = opts.text !== undefined;   /* вместо <input> — текст (статичная витрина состояний) */
    var forcePopulated = !!opts.populated || state === 'focus' || state === 'focus-value' || state === 'selected';
    var ph = opts.placeholder || 'ДД.ММ.ГГГГ';
    var isStatic = !!opts.static;
    var iconHTML = isStatic
      ? '<span class="ds-input__icon"><span class="ds-icon-size ds-icon-size--5x ds-icon-size--state"><span class="material-icons">date_range</span></span></span>'
      : '<span class="ds-input__icon" role="button" tabindex="0" aria-label="Открыть календарь" aria-expanded="false"><span class="ds-icon-size ds-icon-size--5x ds-icon-size--state"><span class="material-icons">date_range</span></span></span>';
    var ddHTML = isStatic ? '' : '<div class="ds-input-datepicker__dropdown" hidden><div class="ds-input-datepicker__calendar"></div></div>';
    wrap.classList.add('ds-input-datepicker');
    if (isStatic) wrap.classList.add('ds-input-datepicker--static');
    if (state) wrap.classList.add('dpb--' + state);
    var fieldHTML = isText
      ? '<span class="ds-input__field ds-input-datepicker__text">' + opts.text +
        (opts.caret ? '<span class="ds-input-datepicker__caret"></span>' : '') + '</span>'
      : '<input class="ds-input__field" type="text" placeholder="' + ph + '" autocomplete="off" aria-label="' + ariaLabel + '">';
    wrap.innerHTML =
      '<div class="ds-input ds-input--m">' +
        '<div class="ds-input__frame">' +
          '<div class="ds-input__content">' +
            '<span class="ds-input__label">' + label + '</span>' +
            fieldHTML +
          '</div>' +
          iconHTML +
        '</div>' +
      '</div>' + ddHTML;

    var field = wrap.querySelector('.ds-input__field');
    var icon = wrap.querySelector('.ds-input__icon');
    var dd = wrap.querySelector('.ds-input-datepicker__dropdown');
    var current = opts.value ? cut(opts.value) : null;
    var isOpen = false;
    var cal = null;

    if (!isStatic) {
      cal = mount(wrap.querySelector('.ds-input-datepicker__calendar'), {
        start: current, end: current,
        onPick: function (s) {               /* один день из календаря → в поле, выпадашка закрывается */
          setValue(s);
          close();
          if (opts.onPick) opts.onPick(s, s);
        }
      });
    }

    /* значение поля ↔ состояние обёртки: Empty (лейбл-подсказка «Выберите дату» в строке) /
       Populated (лейбл поднят), как в примерах Figma */
    function setValue(d) {
      current = d ? cut(d) : null;
      field.value = current ? fmtFull(current) : '';
      if (current && cal) cal.set(current, current);
      syncState();
    }
    function syncState() {
      var has = forcePopulated || !!field.value;      wrap.classList.toggle('ds-input-datepicker--populated', has);
      wrap.classList.toggle('ds-input-datepicker--empty', !has);
    }
    function open() {
      if (!dd || isOpen) return;
      isOpen = true;
      cal.reset();
      cal.view(current || new Date());       /* всегда открываемся на сетке дней актуального месяца */
      dd.hidden = false;
      icon.setAttribute('aria-expanded', 'true');
    }
    function close() {
      if (!dd) return;
      isOpen = false;
      dd.hidden = true;
      icon.setAttribute('aria-expanded', 'false');
    }

    if (!isStatic) {
      icon.addEventListener('click', function () { isOpen ? close() : open(); });
      icon.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); isOpen ? close() : open(); }
      });
      /* клик снаружи закрывает. Проверяем по composedPath: клик внутри календаря пересобирает
         разметку, и к этому слушателю event.target уже вне DOM — wrap.contains его не видит,
         из-за чего выпадашка ложно закрывалась при листании/переключении видов */
      document.addEventListener('click', function (e) {
        var path = e.composedPath ? e.composedPath() : [e.target];
        if (isOpen && path.indexOf(wrap) === -1) close();
      });
      document.addEventListener('keydown', function (e) { if (isOpen && e.key === 'Escape') close(); });
    }
    field.addEventListener('input', syncState);   /* набранный руками текст — тоже «заполнено» */

    if (!isText && current) setValue(current);
    syncState();
    if (opts.open) open();

    return {
      el: wrap,
      input: field,
      get: function () { return field.value; },
      set: function (d) { setValue(d); },
      open: open,
      close: close
    };
  }

  window.Datepicker = { mount: mount, mountInput: mountInput, fmtD: fmtD, fmtFull: fmtFull };
})();
