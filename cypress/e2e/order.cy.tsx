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

describe('E2E: оформление заказа — по ТЗ (моки, проверка номера, закрытие модалки, очистка)', () => {
  const S = {
    constructorList:
      '[data-cy="ingredient_constructor"], [data-cy="ingredients_list"], [data-cy="constructor_ingredients"]',
    orderButton: '[data-cy=order_button]',
    modalCloseSelectors: '[data-cy="modal-close"], button[aria-label="close"], .modal__close, .close-button',
    modalRoot: 'div[role="dialog"], [data-cy="modal"], .modal, .Modal',
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

  const closeIngredientDetailsIfOpen = () =>
    cy.get('body').then(($b) => {
      if ($b.find(S.modalCloseSelectors).length) {
        cy.get(S.modalCloseSelectors).first().click({ force: true });
      } else {
        cy.get('body').type('{esc}');
      }
      cy.contains(ingredientDetailsTitleRx, { timeout: 3000 }).should('not.exist');
    });

  const addIngredientFromFixture = (name: string) =>
    cy.contains(name, { timeout: 10000 }).then(($el) => {
      cy.wrap($el)
        .closest('div, li, a, .ingredient-card, .card')
        .then(($card) => {
          const $btn = $card.find('button').filter(':visible').first();
          if ($btn && $btn.length) {
            cy.wrap($btn).click({ force: true });
            closeIngredientDetailsIfOpen();
          } else {
            cy.wrap($el).click({ force: true });
            cy.contains(/Добавить|Add/i, { timeout: 5000 }).click({ force: true });
            closeIngredientDetailsIfOpen();
          }
        });
    });

  it('создание заказа: мок, проверка номера, закрытие модалки и очистка конструктора', () => {
    cy.fixture<IngredientsFixture>('ingredients.json').then((fx) => {
      const items = fx?.data ?? [];
      const bun = items.find((it) => it.type === 'bun');
      const filling = items.find((it) => it.type === 'main' || it.type === 'sauce');
      chaiExpect(bun).to.exist;

      addIngredientFromFixture(bun!.name);
      if (filling) addIngredientFromFixture(filling.name);
    });

    cy.get(S.constructorList, { timeout: 10000 }).children().its('length').should('be.gte', 1);
    cy.contains(ingredientDetailsTitleRx).should('not.exist');

    cy.get(S.orderButton, { timeout: 10000 }).contains(/Оформить заказ|Place order/i).click({ force: true });

    cy.wait('@createOrder').then((interception) => {
      const status = interception.response?.statusCode;
      chaiExpect(status).to.be.oneOf([200, 201]);

      const orderNum =
        interception.response?.body?.order?.number ||
        interception.response?.body?.orderNumber ||
        interception.response?.body?.number ||
        null;

      if (orderNum) {
        cy.contains(String(orderNum), { timeout: 10000 }).should('be.visible');
      } else {
        cy.contains(/Ваш заказ начали готовить|Order started/i, { timeout: 10000 }).should('be.visible');
      }

      cy.get('body').then(($b) => {
        if ($b.find(S.modalCloseSelectors).length) {
          cy.get(S.modalCloseSelectors).first().click({ force: true });
        } else {
          cy.get('body').type('{esc}');
        }
      });
      cy.get(S.modalRoot, { timeout: 10000 }).should('not.exist');

      // даём немного времени на обработку стора/рендера
      cy.wait(200);

      // проверка очистки конструктора: сначала через window.__STORE__, иначе UI (ждём до 20s)
      cy.window({ timeout: 10000 }).then((win) => {
        const appWin = win as unknown as AppWindow;
        const store = appWin.__STORE__;
        if (store && typeof store.getState === 'function') {
          const state = store.getState() as unknown as AppState;
          chaiExpect(state).to.have.property('constructorItems');
          // безопасно читаем поля через AppState
          chaiExpect(state.constructorItems?.ingredients).to.be.an('array').and.have.length(0);
          chaiExpect(state.constructorItems?.bun === null || state.constructorItems?.bun === undefined).to.be.true;
          return;
        }

        // UI fallback
        cy.log('Fallback: ждём очистки UI конструктора (до 20s)');
        cy.get(S.constructorList, { timeout: 20000 }).children().then(($children) => {
          const len = $children.length;
          chaiExpect(len === 0 || len === 1).to.equal(true);
        });
      });
    });
  });
});
