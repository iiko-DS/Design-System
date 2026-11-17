/* icons.js — иконки дизайн-системы вместо шрифта Google Material Icons.

   КАК РАБОТАЕТ
     • Спрайты (sprite-material-*.js постранично из Figma «Icons (New)», sprite-custom.js,
       sprite-logos.js) кладут разметку в window.DS_ICONS: имя иконки → внутренность <svg>.
       Имена совпадают с лигатурами Material Icons, поэтому разметка страниц не меняется:
       <span class="material-icons">search</span> — как и было.
     • Этот файл находит все .material-icons / .material-icons-outlined и, если имя есть
       в ДС, подменяет текст лигатуры на inline-SVG (цвет наследуется — currentColor,
       размер — 1em от font-size контейнера).
     • Если имени в ДС нет — текст лигатуры остаётся на месте, и его рисует шрифт Google
       Material Icons (подключён в connect.js как резерв). Так и работает правило
       «сначала ДС, Google — только если в ДС иконки нет».

   СТРАНИЦАМ НИЧЕГО ПОДКЛЮЧАТЬ НЕ НУЖНО — всё делает connect.js.
   Ручной вызов (если разметка меняется скриптом без вставки в DOM): window.DSIcons.apply(root). */

(function () {
  'use strict';

  var ICONS = window.DS_ICONS;
  if (!ICONS) return;

  var SELECTOR = '.material-icons, .material-icons-outlined';

  /* Внутренность svg для имени; null — иконки нет в ДС.
     Запись в карте: строка (тогда viewBox 0 0 24 24) либо объект {vb:'0 0 W H', b:'<path…/>'}
     — для иконок с другим viewBox (логотипы, кастомные). */
  function markup(name) {
    var rec = ICONS[name];
    if (!rec) return null;
    var vb = '0 0 24 24';
    var body = rec;
    if (typeof rec === 'object') { vb = rec.vb || vb; body = rec.b || ''; }
    if (!body) return null;
    return '<svg class="ds-ic-svg" viewBox="' + vb + '" aria-hidden="true" focusable="false">' + body + '</svg>';
  }

  function applyOne(el) {
    if (el.getAttribute('data-ds-icon') === '1') return;   /* уже подставлено */
    if (el.firstElementChild && el.firstElementChild.tagName === 'svg') return;
    var name = (el.textContent || '').replace(/^\s+|\s+$/g, '');
    if (!name) return;
    var html = markup(name);
    if (!html) return;                                    /* нет в ДС → лигатура Google */
    el.innerHTML = html;
    el.setAttribute('data-ds-icon', '1');
  }

  /* Обход узла: сам узел (если он слот иконки) и все слоты внутри него. */
  function applyTo(node) {
    if (!node || node.nodeType !== 1) return;
    if (node.matches && node.matches(SELECTOR)) applyOne(node);
    if (!node.querySelectorAll) return;
    var list = node.querySelectorAll(SELECTOR);
    for (var i = 0; i < list.length; i++) applyOne(list[i]);
  }

  /* Публичный обход: root — любой DOM-узел (документ, элемент). */
  function apply(root) {
    var scope = root || document;
    if (scope.nodeType === 1) { applyTo(scope); return; }
    var list = scope.querySelectorAll(SELECTOR);
    for (var i = 0; i < list.length; i++) applyOne(list[i]);
  }

  /* ── Наблюдение за разметкой, которую страницы добавляют скриптом ──────────
     Обрабатываем сразу, без откладывания на requestAnimationFrame: в фоновой
     вкладке кадры не рисуются и отложенная подстановка не срабатывала бы вообще. */
  function observe() {
    if (!window.MutationObserver) return;
    var mo = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var added = muts[i].addedNodes;
        for (var j = 0; j < added.length; j++) applyTo(added[j]);
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  function run() {
    apply(document.documentElement);
    observe();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();

  window.DSIcons = {
    apply: apply,
    has: function (name) { return !!ICONS[name]; },
    count: function () { var n = 0; for (var k in ICONS) if (Object.prototype.hasOwnProperty.call(ICONS, k)) n++; return n; }
  };
})();
