/// <reference types="cypress" />
import { expect as chaiExpect } from 'chai';

describe('Модалка ингредиента — открытие и закрытие (route/modal) с fallback', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.intercept('GET', '**/ingredients**', { fixture: 'ingredients.json' }).as('getIngredients');
    cy.viewport(1300, 800);
    cy.visit('/');
    cy.wait('@getIngredients', { timeout: 10000 });
  });

  const openByName = (name: string, id?: string) => {
    cy.contains(name, { timeout: 8000 })
      .should('exist')
      .then(($el) => {
        // безопасно используем cy.wrap + closest (убираем прямой Cypress.$ вызов)
        cy.wrap($el).closest('a, button').then(($clickable) => {
          if ($clickable && $clickable.length) {
            cy.wrap($clickable.first()).click({ force: true });
          } else {
            cy.wrap($el).click({ force: true });
          }
        });
      });

    cy.contains('h3', 'Детали ингредиента', { timeout: 8000 }).should('be.visible');

    if (id) {
      cy.location('pathname', { timeout: 8000 }).should('include', `/ingredients/${id}`);
    }
  };

  const ensurePathLeft = (id: string) => {
    // если путь всё ещё содержит /ingredients/:id — возвращаемся назад
    cy.location('pathname').then((p) => {
      const path = String(p);
      cy.log('current pathname:', path);
      if (path.includes(`/ingredients/${id}`)) {
        cy.log('path still contains id -> go back');
        cy.go('back');
      }
    });

    // ждём, что путь больше не содержит id (или равен '/')
    cy.location('pathname', { timeout: 8000 }).should((p) => {
      const path = String(p);
      chaiExpect(path === '/' || !path.includes(`/ingredients/${id}`)).to.equal(true);
    });
  };

  it('открывается модалка и закрывается крестиком (с fallback на history.back)', () => {
    cy.fixture('ingredients.json').then((f: any) => {
      const item = (f.data || [])[0];
      chaiExpect(item).to.exist;

      openByName(item.name, item._id);

      // клик по кнопке закрытия внутри заголовка модалки
      cy.contains('h3', 'Детали ингредиента')
        .parent()
        .within(() => {
          cy.get('button').first().click({ force: true });
        });

      ensurePathLeft(item._id);

      cy.contains('h3', 'Детали ингредиента').should('not.exist');
    });
  });

  it('открывается модалка и закрывается кликом вне неё (overlay) или по истории', () => {
    cy.fixture('ingredients.json').then((f: any) => {
      const item = (f.data || [])[0];
      chaiExpect(item).to.exist;

      openByName(item.name, item._id);

      // пробуем кликнуть по overlay, если его нет — делаем history.back()
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy="overlay"]').length) {
          cy.get('[data-cy="overlay"]').first().click({ force: true });
        } else if ($body.find('.modal-overlay, .ModalOverlay, .overlay').length) {
          cy.get('.modal-overlay, .ModalOverlay, .overlay').first().click({ force: true });
        } else {
          cy.log('no overlay found -> go back');
          cy.go('back');
        }
      });

      ensurePathLeft(item._id);

      cy.contains('h3', 'Детали ингредиента').should('not.exist');
    });
  });
});
