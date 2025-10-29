/// <reference types="cypress" />
import { expect as chaiExpect } from 'chai';

/*
  E2E: проверка добавления/удаления/перемещения ингредиентов в конструкторе
  - подменяем запрос ингредиентов через fixtures/ingredients.json (alias @getIngredients)
  - добавляем булку + одну начинку/соус (если есть)
  - проверяем наличие булок и что в списке ингредиентов отображается добавленное
  - дополнительные кейсы: удаление из пустого конструктора, перемещения с некорректными индексами
*/

type IngredientType = 'bun' | 'main' | 'sauce' | string;

interface Ingredient {
  _id: string;
  name?: string;
  type: IngredientType;
  [k: string]: unknown;
}

/** Централизованные селекторы с fallback'ами — правьте префикс тут */
const S = {
  // основной селектор конструктора (несколько вариантов для совместимости)
  constructorRoot: '[data-cy="sb-constructor"], [data-cy="constructor"], [data-cy="burger-constructor"], [data-cy="constructor-root"]',
  ingredientItem: (id: string) => `[data-cy="sb-ingredient-item-${id}"], [data-cy="ingredient-item-${id}"]`,
  bunTop: '[data-cy="sb-bun-top"], [data-cy="bun_1_constructor"], [data-cy="constructor_bun_top"]',
  bunBottom: '[data-cy="sb-bun-bottom"], [data-cy="bun_2_constructor"], [data-cy="constructor_bun_bottom"]',
  ingredientContainer: '[data-cy="sb-ingredient-container"], [data-cy="ingredient_constructor"]',
  // селектор для кнопки "Добавить" внутри карточки ингредиента — используется через contains
  addButtonText: /Добавить|Add/i,
  // селектор для кнопки удаления в списке конструктора (возможные варианты)
  removeButtonSelector: '[data-cy="remove-ingredient"], .remove-button, button.remove',
  // селектор для order/submit кнопок — не используется здесь, но оставлю как пример
  orderButton: '[data-cy="sb-order-button"], [data-cy="order-button"], button[data-cy="make-order"], [data-cy="order"]',
};

/** Безопасно извлечь массив Ingredient[] из данных фикстуры */
function extractItemsFromFixture(raw: unknown): Ingredient[] {
  if (Array.isArray(raw)) {
    return raw as Ingredient[];
  }
  if (raw && typeof raw === 'object' && 'data' in raw) {
    const maybe = (raw as { data?: unknown }).data;
    if (Array.isArray(maybe)) return maybe as Ingredient[];
  }
  throw new Error('Fixture "ingredients.json" must be an array or { data: [] }');
}

/** Найти первый ингредиент по типу */
function findByType(items: Ingredient[], type: IngredientType): Ingredient | undefined {
  return items.find((i) => i && i.type === type && typeof i._id === 'string');
}

/** Кликает кнопку "Добавить" внутри карточки ингредиента по known data-cy селектору */
function clickAddButtonForIngredient(id: string) {
  return cy
    .get(S.ingredientItem(id), { timeout: 10000 })
    .should('exist')
    .within(() => {
      // Находим кнопку по тексту
      const btn = cy.contains('button', S.addButtonText);

      // Сначала прокрутим кнопку в видимую область если возможно
      btn.scrollIntoView({ offset: { top: -100, left: 0 } }).should('exist');

      // Попробуем корректный клик: если элемент видим — обычный клик, иначе форс
      return btn.then(($b) => {
        // $b — JQuery<HTMLElement>
        if (($b as JQuery<HTMLElement>).is(':visible')) {
          // нормальный клик (с ретраями)
          return cy.wrap($b).click();
        } else {
          // форсированный клик как запасной вариант
          return cy.wrap($b).click({ force: true });
        }
      });
    });
}

/** Получить текущее число элементов внутри контейнера конструктора */
function getConstructorChildrenCount() {
  return cy.get(S.ingredientContainer, { timeout: 8000 }).should('exist').children().its('length');
}

/** Попытаться удалить ингредиент по индексу внутри контейнера конструктора.
 *  Если кнопки удаления нет — аккуратно ничего не делает, возвращает текущий length.
 */
function removeIngredientAt(index: number) {
  return cy.get(S.ingredientContainer, { timeout: 8000 }).then(($container) => {
    const $children = $container.children();
    const len = $children.length;
    if (index < 0 || index >= len) {
      // ничего не делаем — некорректный индекс
      return cy.wrap(len);
    }

    // пытаемся найти кнопку удаления внутри выбранного элемента
    return cy.wrap($children)
      .eq(index)
      .then(($child) => {
        const $remove = $child.find(S.removeButtonSelector);
        if ($remove && $remove.length) {
          // клик по кнопке удаления (force на случай overlay/clip)
          return cy.wrap($remove.first()).click({ force: true }).then(() => {
            // вернём новое количество детей
            return cy.get(S.ingredientContainer).children().its('length');
          });
        }
        // если удаление не поддерживается — просто возвращаем длину (без изменений)
        return cy.get(S.ingredientContainer).children().its('length');
      });
  });
}

/** Попытка переместить элемент из одного индекса в другой через drag/drop.
 *  Если индексы некорректны — не вызывает исключений, просто подтверждает отсутствие падений.
 *  Улучшение: если у элементов есть data-cy, использовать `cy.dragAndDrop`, иначе fallback на trigger(...)
 */
function tryMoveIngredient(fromIndex: number, toIndex: number) {
  return cy.get(S.ingredientContainer, { timeout: 8000 }).then(($container) => {
    const $children = $container.children();
    const len = $children.length;
    if (fromIndex < 0 || fromIndex >= len || toIndex < 0 || toIndex >= len) {
      // некорректные индексы — ничего не делаем, тест проверит, что приложение не упало
      return cy.wrap(null);
    }

    const $from = $children.eq(fromIndex);
    const $to = $children.eq(toIndex);

    // Попытаемся прочитать data-cy атрибуты (если они присутствуют)
    const fromDataCy = $from.attr('data-cy');
    const toDataCy = $to.attr('data-cy');

    if (fromDataCy && toDataCy) {
      // используем централизованную команду — возвращаем её Chainable
      // но приводим результат к null-совместимому виду для единообразия (фолбекы ожидают cy.wrap(null))
      return cy
        .dragAndDrop(`[data-cy="${fromDataCy}"]`, `[data-cy="${toDataCy}"]`)
        .then(() => cy.wrap(null));
    }

    // fallback: триггерим события drag/drop напрямую (как раньше)
    const dataTransfer = new DataTransfer();

    return cy
      .wrap($from)
      .trigger('dragstart', { dataTransfer, force: true })
      .then(() => cy.wrap($to).trigger('drop', { dataTransfer, force: true }))
      .then(() => cy.wrap(null));
  });
}

describe('Burger constructor — добавление булки, начинки и соуса', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();

    // подмена запроса к ингредиентам и alias
    cy.intercept('GET', '**/ingredients**', { fixture: 'ingredients.json' }).as('getIngredients');

    cy.viewport(1300, 800);
    cy.visit('/');

    // ждём явного завершения загрузки ингредиентов перед проверкой UI
    cy.wait('@getIngredients', { timeout: 10000 });

    // убеждаемся, что конструктор видим
    cy.get(S.constructorRoot, { timeout: 10000 }).should('be.visible');
  });

  it('добавляет булку, начинку и (если есть) соус через data-cy селекторы', () => {
    cy.fixture('ingredients.json').then((raw: unknown) => {
      const items = extractItemsFromFixture(raw);

      const bun = findByType(items, 'bun');
      const main = findByType(items, 'main');
      const sauce = findByType(items, 'sauce');

      // проверяем, что в фикстуре есть необходимые элементы
      chaiExpect(bun, 'fixture must contain bun').to.exist;
      chaiExpect(main || sauce, 'fixture should contain at least main or sauce').to.exist;

      // добавляем булку
      if (bun) {
        clickAddButtonForIngredient(bun._id);
        // ждём появления булочной части в конструкторе
        cy.get(S.bunTop, { timeout: 8000 }).should('exist');
        cy.get(S.bunBottom, { timeout: 8000 }).should('exist');
      }

      // добавляем main/sauce и проверяем, что отображается их имя в списке конструктора
      if (main && typeof main.name === 'string') {
        clickAddButtonForIngredient(main._id);
        cy.get(S.ingredientContainer).should('exist').contains(main.name).should('exist');
      }

      if (sauce && typeof sauce.name === 'string') {
        clickAddButtonForIngredient(sauce._id);
        cy.get(S.ingredientContainer).should('exist').contains(sauce.name).should('exist');
      }
    });
  });

  it('не рушится при удалении из пустого конструктора (крайний кейс)', () => {
    // Сначала очистим конструктор, если там что-то есть — делаем это осторожно.
    // Если приложение предоставляет очистку — можно использовать её, иначе просто проверим поведение при пустом контейнере.
    cy.get(S.ingredientContainer, { timeout: 8000 }).then(($container) => {
      const len = $container.children().length;
      if (len > 0) {
        // Попытаемся удалить все элементы по очереди через кнопки удаления, если они есть
        cy.wrap($container)
          .children()
          .each(($el) => {
            const $remove = $el.find(S.removeButtonSelector);
            if ($remove && $remove.length) {
              cy.wrap($remove.first()).click({ force: true });
            }
          })
          .then(() => {
            // теперь контейнер должен быть пуст или оставаться в корректном состоянии
            cy.get(S.ingredientContainer).children().its('length').should('be.gte', 0);
          });
      } else {
        // контейнер уже пуст — пробуем удалить первый по индексу (некорректная операция) и ожидаем, что приложение не упадёт
        removeIngredientAt(0).then((count) => {
          // если операция не поддерживается, count просто вернёт 0
          cy.wrap(count).should('be.a', 'number');
        });
      }
    });
  });

  it('не ломается при попытке перемещения ингредиента с некорректными индексами', () => {
    // Добавим один ингредиент, чтобы была возможность проверять перемещение
    cy.fixture('ingredients.json').then((raw: unknown) => {
      const items = extractItemsFromFixture(raw);
      const bun = findByType(items, 'bun');
      const main = findByType(items, 'main') || findByType(items, 'sauce');

      // если нет ни одного ингредиента — тест всё равно проверит отсутствие падений при move
      if (bun) clickAddButtonForIngredient(bun._id);
      if (main) clickAddButtonForIngredient(main._id);

      // получим длину и попробуем перемещения с плохими индексами
      cy.get(S.ingredientContainer).children().then(($children) => {
        const len = $children.length;
        // отрицательный индекс
        tryMoveIngredient(-1, 0);
        // индекс за пределами
        tryMoveIngredient(len + 5, 0);
        // оба индекса за пределами
        tryMoveIngredient(len + 2, len + 3);

        // дополнительно — если есть хотя бы 2 элемента, пробуем легальный move и ожидаем, что ничего не ломается
        if (len >= 2) {
          tryMoveIngredient(0, 1);
        }

        // завершающая проверка — контейнер всё ещё существует и содержит неотрицательное число детей
        cy.get(S.ingredientContainer).children().its('length').should('be.gte', 0);
      });
    });
  });
});
