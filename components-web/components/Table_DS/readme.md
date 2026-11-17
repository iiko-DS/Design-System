# Table — компоненты ДС

## 🔗 Живой стенд: [открыть интерфейс в браузере](https://iiko-ds.github.io/Design-System/components-web/components/Table_DS/demo.html)

Прямая ссылка (можно отправлять коллегам — открывается как страница, репозиторий скачивать не нужно):

<https://iiko-ds.github.io/Design-System/components-web/components/Table_DS/demo.html>

Стенд «Таблица — примеры поведения»: анатомия (Input cell / Select cell / Chips input cell →
Form field cell → Table content cell → Table content row) и живые примеры (сортировка, фильтрация,
управление столбцами, выбор и перетаскивание строк, иерархия, итоги, правка прямо в ячейке).

## Файлы в папке

| Файл | Что это |
|---|---|
| demo.html | демо-стенд (ручной): анатомия таблицы + примеры поведения, все состояния заморожены классами ДС |
| input-cell.css, select-cell.css, chips-input-cell.css | атомы-поля внутри ячейки: состояния Default / Hover / Focus / Error / Disable |
| element-form-field.css, orm-field-cell.css | обёртка поля в ячейке (паддинги держит только Form field cell) |
| 	able-content-cell.css, 	able-header-cell.css | ячейки строки и шапки: ховер только у действенных, у шапки ховера нет |
| 	able-content-row.css, 	able-header-row.css, 	able-footer.css | полосы строк (в т.ч. --zebra, --selected, --disabled, --footer) |
| element-cell.css, elementare-cell.css, 	able-chips-input.css, 	able-2-lvl (в UI-Components_DS) | прочие виды ячеек и двухуровневая шапка |
| layouts.js | раскладка стенда: ширины колонок, закрепление, перетаскивание |
| 	able-jira-tasks.md | перенос макета таблицы в задачи Jira |

## Где правила

Компонентные правила — в этих файлах; правила уровня страниц и обвязки — в components-web/fixes.css
(номера пробелов — в ixes.md), правила для прототипов — в AGENTS.md (раздел про таблицу).