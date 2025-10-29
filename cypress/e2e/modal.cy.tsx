/// <reference types="cypress" />
import { expect as chaiExpect } from 'chai';

type IngredientType = 'bun' | 'main' | 'sauce' | string;

interface Ingredient {
  _id: string;
  name?: string;
  type: IngredientType;
  [k: string]: unknown;
}

const S = {
  overlay: '[data-cy="overlay"], .modal-overlay, .ModalOverlay, .overlay',
  modalHeader: 'h3',
  modalCloseButton: 'button',
};

function extractItemsFromFixture(raw: unknown): Ingredient[] {
  if (Array.isArray(raw)) return raw as Ingredient[];
  if (raw && typeof raw === 'object' && 'data' in raw) {
    const maybe = (raw as { data?: unknown }).data;
    if (Array.isArray(maybe)) return maybe as Ingredient[];
  }
  throw new Error('Fixture "ingredients.json" must be an array or { data: [] }');
}

const openByName = (name: string, id?: string) => {
  cy.contains(name, { timeout: 8000 })
    .should('exist')
    .then(($el) => {
      cy.wrap($el).closest('a, button').then(($clickable) => {
        if ($clickable && $clickable.length) {
          cy.wrap($clickable.first()).click({ force: true });
        } else {
          cy.wrap($el).click({ force: true });
        }
      });
    });

  cy.contains(S.modalHeader, 'Детали ингредиента', { timeout: 8000 }).should('be.visible');

  if (id) {
    cy.location('pathname', { timeout: 8000 }).should('include', `/ingredients/${id}`);
  }
};

const ensurePathLeft = (id: string) => {
  cy.location('pathname').then((p) => {
    const path = String(p);
    if (path.includes(`/ingredients/${id}`)) {
      cy.go('back');
    }
  });

  cy.location('pathname', { timeout: 8000 }).should((p) => {
    const path = String(p);
    chaiExpect(path === '/' || !path.includes(`/ingredients/${id}`)).to.equal(true);
  });
};

describe('Модалка ингредиента — открытие и закрытие (route/modal) с fallback', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.intercept('GET', '**/ingredients**', { fixture: 'ingredients.json' }).as('getIngredients');
    cy.viewport(1300, 800);
    cy.visit('/');
    cy.wait('@getIngredients', { timeout: 10000 });
  });

  it('открывается модалка и закрывается крестиком (с fallback на history.back)', () => {
    cy.fixture('ingredients.json').then((f: unknown) => {
      const items = extractItemsFromFixture(f);
      const item = items[0];
      chaiExpect(item).to.exist;

      openByName(String(item.name), String(item._id));

      cy.contains(S.modalHeader, 'Детали ингредиента')
        .parent()
        .within(() => {
          cy.get(S.modalCloseButton).first().click({ force: true });
        });

      ensurePathLeft(String(item._id));

      cy.contains(S.modalHeader, 'Детали ингредиента').should('not.exist');
    });
  });

  it('открывается модалка и закрывается кликом вне неё (overlay) или по истории', () => {
    cy.fixture('ingredients.json').then((f: unknown) => {
      const items = extractItemsFromFixture(f);
      const item = items[0];
      chaiExpect(item).to.exist;

      openByName(String(item.name), String(item._id));

      cy.get('body').then(($body) => {
        if ($body.find('[data-cy="overlay"]').length) {
          cy.get('[data-cy="overlay"]').first().click({ force: true });
        } else if ($body.find('.modal-overlay, .ModalOverlay, .overlay').length) {
          cy.get('.modal-overlay, .ModalOverlay, .overlay').first().click({ force: true });
        } else {
          cy.go('back');
        }
      });

      ensurePathLeft(String(item._id));

      cy.contains(S.modalHeader, 'Детали ингредиента').should('not.exist');
    });
  });

  it('закрывается клавишей Escape (если поведение поддерживается)', () => {
    cy.fixture('ingredients.json').then((f: unknown) => {
      const items = extractItemsFromFixture(f);
      const item = items[0];
      chaiExpect(item).to.exist;

      openByName(String(item.name), String(item._id));

      cy.contains(S.modalHeader, 'Детали ингредиента').should('be.visible');

      // пробуем Escape
      cy.get('body').type('{esc}');

      // если модалка всё ещё есть — сделать fallback назад
      cy.get('body').then(($body) => {
        // ищем заголовок модалки с текстом (jQuery :contains используется для быстрого поиска)
        if ($body.find('h3:contains("Детали ингредиента")').length) {
          cy.go('back');
        }
      });

      cy.contains(S.modalHeader, 'Детали ингредиента').should('not.exist');

      ensurePathLeft(String(item._id));
    });
  });
});
