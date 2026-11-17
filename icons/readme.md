# icons — иконки дизайн-системы

Иконки ДС из Figma «Icons (New)» в виде inline-SVG. Подключаются автоматически через `connect.js`,
раньше шрифта Google Material Icons. Шрифт Google остаётся **резервом**: им рисуется только то имя,
которого в ДС нет.

## Источник

Figma-файл **Icons (New)** — `https://www.figma.com/design/skjpVJUl8ir0JazrrPAMOW/Icons--New-`

| Страница | Что взято | Файл |
|---|---|---|
| `Icons` | 167 иконок (разделы Device, General, Arrows, Communication & File, E-commerce, Business, Multimedia, Transport, Map, People, Food, Places & things) | `sprite-material-1.js`, `sprite-material-2.js`, `sprite-material-3.js` |
| `Icons custom` | 14 иконок ДС (`*_custom`, `dark_mode`, `light_mode`, `stop*` и др.) | `sprite-custom.js` |
| `Logo` | 10 логотипов (facebook, xero, apple, app_gallery, google_play, rustore, telegram, vk, sberbank_black, max) | `sprite-logos.js` |

Итого 191 иконка. Все — 24×24 (`viewBox="0 0 24 24"`), как в Figma.

## Файлы

| Файл | Что внутри |
|---|---|
| `sprite-*.js` | `window.DS_ICONS['имя'] = '<path …/>'` — внутренность `<svg>`. Собирает карту иконок |
| `icons.js` | находит `.material-icons` / `.material-icons-outlined`, подменяет текст лигатуры на `<svg>`; следит за разметкой, которую добавляют скрипты (`MutationObserver`) |
| `icons.css` | размер и цвет svg: `1em` от `font-size` контейнера, `fill: currentColor` |

## Как пользуются страницы

Разметка не меняется — имена совпадают с лигатурами Material Icons:

```html
<span class="material-icons">search</span>
```

Скрипт подставляет svg ДС. Если имени в ДС нет (например `chevron_right`, `image`, `event`),
текст лигатуры остаётся — его отрисует шрифт Google. Ничего дополнительно подключать не нужно:
всё делает `connect.js` (спрайты → `icons.js` идут первыми в списке `JS`).

## Цвет и размер

- цвет — `currentColor`, то есть цвет текста контейнера (как у шрифта Google);
- размер — `1em` от `font-size` контейнера, поэтому правила ДС
  (`.ds-input__icon .material-icons{font-size:20px}` и т. п.) работают без правок;
- логотипы (`sprite-logos.js`) несут собственные цвета в атрибутах `path` — они не перекрашиваются.

## Как добавить иконку

1. В Figma «Icons (New)» выбрать компонент, скопировать SVG-разметку (`exportAsync({format:'SVG_STRING'})`).
2. Добавить строку в нужный спрайт: `window.DS_ICONS['имя_лигатуры'] = \`<path … fill='currentColor'/>\`;`
   Имя — ровно то, что пишется в HTML (лигатура Material Icons).
3. Больше ничего: подстановка и резерв работают сами.

Выгружать пачками: у `use_figma` лимит возврата 48 000 байт, поэтому иконки разложены на 3 части
(и длинную разметку скрипт выгрузки режет на куски по ≤1200 символов — при сборке файла куски
склеиваются в одну строку через `+`).

## Что не вошло

- `Sberbank_logo` — в Figma это 53 КБ с встроенной растровой картинкой; взят векторный
  `sberbank_logo_black`.
- Иконки, которых нет в Figma (в т. ч. `event`, `restore`, `chevron_left/right`, `expand_more/less`,
  `image`, `delivery_dining`, `place`) — их по-прежнему рисует шрифт Google.


---

## Плоский набор SVG (`icons/*.svg`)

Рядом со спрайтами лежит полный набор иконок отдельными файлами — перенесён из ветки автора.
Спрайты выше остаются основным способом подключения.

Плоская папка со **всеми** иконками из Figma, без разбивки на фреймы и категории.

- Источник: Figma `skjpVJUl8ir0JazrrPAMOW` («Icons (New)»), канвас `2:198`.
- Экспорт: 1151 SVG иконка, каждая 24×24, `fill="#616161"` (SVG чистый, без Figma-обёрток).
- Имена файлов = имена компонентов в Figma (`home.svg`, `arrow_back.svg`, …), пробелы → `_`.
- Одноимённые иконки из разных категорий получают суффикс: `crop.svg`, `crop-2.svg`, … `looks-5.svg`.
- `logo_iiko.svg` — логотип iiko (красный круг) для фавикона панели ревью: в наборе иконок его нет,
  поэтому лежит отдельным файлом. Остальные картинки «хрома» (`ds-review.js`) берутся из общих иконок.

## Правило

В компонентах, стендах и прототипах берём иконки **только отсюда**:
`<img src="…/icons/<имя>.svg" alt="">` или инлайном содержимое SVG.
Material Icons-шрифт для продуктовых иконок не используем.

Быстрый поиск нужной иконки:

```powershell
Get-ChildItem icons -Filter "*arrow*" | Select-Object -ExpandProperty BaseName
```
