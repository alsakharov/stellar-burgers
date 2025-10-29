/// <reference types="cypress" />
import { expect as chaiExpect } from 'chai';

type IngredientType = 'bun' | 'main' | 'sauce' | string;

interface Ingredient {
  _id?: string;
  id?: string;
  name: string;
  type: IngredientType;
  [key: string]: unknown;
}

interface IngredientsFixture {
  data: Ingredient[];
}

/** Минимальная форма ожидаемого состояния приложения, достаточная для теста */
interface AppState {
  constructorItems?: {
    ingredients?: unknown[];
    bun?: unknown | null;
  };
  [k: string]: unknown;
}

/** Интерфейс окна приложения  */
interface AppWindow {
  __STORE__?: {
    getState?: () => unknown;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

/** Безопасно извлекаем номер заказа из тела ответа */
function getOrderNumberFromBody(body: unknown): string | number | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const maybeOrder = b.order;
  if (maybeOrder && typeof maybeOrder === 'object') {
    const ord = maybeOrder as Record<string, unknown>;
    const num = ord.number ?? ord.orderNumber;
    if (typeof num === 'number' || typeof num === 'string') return num;
  }
  const topNum = b.orderNumber ?? b.number;
  if (typeof topNum === 'number' || typeof topNum === 'string') return topNum;
  return null;
}

describe('E2E: оформление заказа — по ТЗ (моки, проверка номера, закрытие модалки, очистка)', () => {
  const S = {
    constructorList:
      '[data-cy="ingredient_constructor"], [data-cy="ingredients_list"], [data-cy="constructor_ingredients"]',
    orderButton: '[data-cy=order_button]',
    modalCloseSelectors: '[data-cy="modal-close"], button[aria-label="close"], .modal__close, .close-button',
    modalRoot: 'div[role="dialog"], [data-cy="modal"], .modal, .Modal'
  };

  const ingredientDetailsTitleRx = /Детали ингредиента|Ingredient details/i;

  before(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.setCookie('accessToken', 'test-access-token');
    cy.window().then((w) => w.localStorage.setItem('refreshToken', 'test-refresh-token'));

    cy.intercept('GET', '**/ingredients**', { fixture: 'ingredients.json' }).as('getIngredients');
    cy.intercept('GET', '**/auth/user**', { fixture: 'user.json' }).as('getUser');
    cy.intercept('POST', '**/orders**', { fixture: 'order.json' }).as('createOrder');

    cy.viewport(1300, 800);
    cy.visit('/');
    cy.wait('@getIngredients');
    cy.wait('@getUser');
  });

  /**
   * Закрыть открытые детали ингредиента, если они есть.
   * Возвращаем void — Cypress-команды планируются внутри.
   */
  const closeIngredientDetailsIfOpen = (): void => {
    cy.get('body').then(($body) => {
      const closeSel = S.modalCloseSelectors;
      if ($body.find(closeSel).length) {
        // клик по крестикам
        cy.get(closeSel).first().click({ force: true });
      } else {
        // fallback: Escape
        cy.get('body').type('{esc}');
      }
      // убеждаемся, что окно деталей закрыто
      cy.contains(ingredientDetailsTitleRx, { timeout: 3000 }).should('not.exist');
    });
  };

  /**
   * Добавить ингредиент по имени из фикстуры.
   * Возвращаем void; внутри используем cy-команды.
   */
  const addIngredientFromFixture = (name: string): void => {
    cy.contains(name, { timeout: 10000 }).then((subject) => {
      // subject должен быть jQuery-объект; строго приводим и проверяем
      const $el = (subject as unknown) as JQuery<HTMLElement>;
      if (!$el || !$el.length) {
        // если вдруг нет элемента — выбросим, чтобы тест упал корректно
        throw new Error(`Ingredient with name "${name}" not found in DOM`);
      }

      const $card = $el.closest('div, li, a, .ingredient-card, .card');
      const $btn = $card.find('button').filter(':visible').first();

      if ($btn && $btn.length) {
        // есть видимая кнопка — нажмём
        cy.wrap($btn).click({ force: true });
        closeIngredientDetailsIfOpen();
      } else {
        // откроем детали и нажмём "Добавить"
        cy.wrap($el).click({ force: true });
        cy.contains(/Добавить|Add/i, { timeout: 5000 }).click({ force: true });
        closeIngredientDetailsIfOpen();
      }
    });
  };

  it('создание заказа: мок, проверка номера, закрытие модалки и очистка конструктора', () => {
    // подготовка: добавляем булку и начинку из фикстуры
    cy.fixture<IngredientsFixture>('ingredients.json').then((fx) => {
      const items = fx?.data ?? [];
      const bun = items.find((it) => it.type === 'bun');
      const filling = items.find((it) => it.type === 'main' || it.type === 'sauce');
      chaiExpect(bun).to.exist;

      // выполняем добавления
      addIngredientFromFixture(bun!.name);
      if (filling) addIngredientFromFixture(filling.name);
    });

    // конструктор должен иметь элементы
    cy.get(S.constructorList, { timeout: 10000 }).children().its('length').should('be.gte', 1);
    cy.contains(ingredientDetailsTitleRx).should('not.exist');

    // явная проверка: кнопка видима и активна перед отправкой
    cy.get(S.orderButton, { timeout: 10000 })
      .should('be.visible')
      .then(($btn) => {
        const nativeDisabled = $btn.is(':disabled');
        const ariaDisabled = $btn.attr('aria-disabled') === 'true';
        chaiExpect(nativeDisabled || ariaDisabled).to.equal(false);
      });

    // нажимаем "Оформить заказ"
    cy.get(S.orderButton, { timeout: 10000 }).contains(/Оформить заказ|Place order/i).click({ force: true });

    // ждём мок запроса и проверяем его тело/номер
    cy.wait('@createOrder').then((interception) => {
      const status = interception.response?.statusCode;
      chaiExpect(status).to.be.oneOf([200, 201]);

      const orderNum = getOrderNumberFromBody(interception.response?.body);

      if (orderNum) {
        cy.contains(String(orderNum), { timeout: 10000 }).should('be.visible');
      } else {
        cy.contains(/Ваш заказ начали готовить|Order started/i, { timeout: 10000 }).should('be.visible');
      }

      // закрываем модалку (крестик или Escape)
      cy.get('body').then(($b) => {
        if ($b.find(S.modalCloseSelectors).length) {
          cy.get(S.modalCloseSelectors).first().click({ force: true });
        } else {
          cy.get('body').type('{esc}');
        }
      });
      cy.get(S.modalRoot, { timeout: 10000 }).should('not.exist');

      // небольшой таймаут для стора/рендера
      cy.wait(200);

      // проверка очистки конструктора: сначала через window.__STORE__, иначе fallback UI
      cy.window({ timeout: 10000 }).then((win) => {
        const appWin = win as unknown as AppWindow;
        const store = appWin.__STORE__;
        if (store && typeof store.getState === 'function') {
          const state = store.getState() as unknown as AppState;
          chaiExpect(state).to.have.property('constructorItems');
          // безопасно читаем поля через AppState
          chaiExpect(state.constructorItems?.ingredients).to.be.an('array').and.have.length(0);
          chaiExpect(state.constructorItems?.bun === null || state.constructorItems?.bun === undefined).to.be.true;

          // опционально: проверить состояние кнопки после очистки (если нужно)
          cy.get(S.orderButton, { timeout: 10000 }).should('be.visible');

          return;
        }

        // UI fallback: ждём очистки визуального конструктора
        cy.log('Fallback: ждём очистки UI конструктора (до 20s)');
        cy.get(S.constructorList, { timeout: 20000 })
          .children()
          .then(($children) => {
            const len = $children.length;
            chaiExpect(len === 0 || len === 1).to.equal(true);
          });
      });
    });
  });
});
