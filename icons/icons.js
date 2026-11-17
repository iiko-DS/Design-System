/* icons.js — иконки берутся из библиотеки ДС (icons/svg/*.svg), шрифт Google — только резерв.
   Класс .material-icons с именем-лигатурой превращается в маску i-<имя> из icons.css;
   если правила для имени нет (в Figma такой иконки нет) — остаётся лигатура и её рисует шрифт.

   Страницам ничего подключать не нужно: и css, и этот файл тянет connect.js,
   а демо-стенды подключают их напрямую. */
(function () {
  'use strict';
  var SEL = '.material-icons, .material-icons-outlined';

  function applyOne(el) {
    if (el.getAttribute('data-ds-icon') === '1') return;
    var name = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (!name) return;
    var c = 'i-' + name.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
    el.classList.add(c);
    var cs = window.getComputedStyle(el);
    var mask = cs.maskImage || cs.webkitMaskImage || '';
    if (!mask || mask === 'none') { el.classList.remove(c); return; }   /* нет в ДС → лигатура Google */
    el.setAttribute('data-ds-icon', '1');
    el.setAttribute('aria-hidden', 'true');
    el.textContent = '';
  }

  function applyTo(node) {
    if (!node || node.nodeType !== 1) return;
    if (node.matches && node.matches(SEL)) applyOne(node);
    if (!node.querySelectorAll) return;
    var list = node.querySelectorAll(SEL);
    for (var i = 0; i < list.length; i++) applyOne(list[i]);
  }

  function apply(root) {
    var scope = root || document;
    if (scope.nodeType === 1) { applyTo(scope); return; }
    var list = scope.querySelectorAll(SEL);
    for (var i = 0; i < list.length; i++) applyOne(list[i]);
  }

  function run() { apply(document.documentElement); observe(); }

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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();

  window.DSIcons = { apply: apply, count: 1171 };
})();
