/// <reference types="cypress" />
import { expect as chaiExpect } from 'chai';

/*
  E2E: проверка добавления ингредиентов в конструктор
  - подменяем запрос ингредиентов через fixtures/ingredients.json
  - добавляем булку + одну начинку/соус (если есть)
  - проверяем наличие булок и что количество начинок в конструкторе >= добавленного
*/

describe('Burger constructor — добавление булки, начинки и соуса', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();

    // перехватываем запрос к ингредиентам и подставляем фикстуру
    cy.intercept('GET', '**/ingredients**', { fixture: 'ingredients.json' }).as('getIngredients');

    cy.viewport(1300, 800);
    cy.visit('/');
    cy.wait('@getIngredients', { timeout: 10000 });

    // убеждаемся, что конструктор видим
    cy.get('[data-cy="constructor"]', { timeout: 10000 }).should('be.visible');
  });

  it('добавляет булку, начинку и (если есть) соус через data-cy селекторы', () => {
    cy.fixture('ingredients.json').then((resp: any) => {
      const items: any[] = resp.data || resp;
      const bun = items.find((i) => i.type === 'bun');
      const main = items.find((i) => i.type === 'main');
      const sauce = items.find((i) => i.type === 'sauce');

      // проверяем, что в фикстуре есть необходимые элементы
      chaiExpect(bun).to.exist;
      chaiExpect(main || sauce).to.exist;

      // добавляем булку по data-cy селектору
      cy.get(`[data-cy="ingredient-item-${bun._id}"]`, { timeout: 10000 })
        .should('exist')
        .within(() => {
          cy.contains('button', /Добавить|Add/i, { timeout: 5000 }).click();
        });

      // считаем сколько начинок будем добавлять (без булки)
      let addedCount = 0;

      if (main) {
        cy.get(`[data-cy="ingredient-item-${main._id}"]`, { timeout: 10000 })
          .should('exist')
          .within(() => {
            cy.contains('button', /Добавить|Add/i, { timeout: 5000 }).click();
          });
        addedCount++;
      }

      if (sauce) {
        cy.get(`[data-cy="ingredient-item-${sauce._id}"]`, { timeout: 10000 })
          .should('exist')
          .within(() => {
            cy.contains('button', /Добавить|Add/i, { timeout: 5000 }).click();
          });
        addedCount++;
      }

      // проверки UI: булки сверху/снизу и список начинок
      cy.get('[data-cy="bun_1_constructor"], [data-cy="constructor_bun_top"]', { timeout: 8000 }).should('exist');
      cy.get('[data-cy="bun_2_constructor"], [data-cy="constructor_bun_bottom"]', { timeout: 8000 }).should('exist');

      // ожидаем что количество дочерних элементов конструктора >= добавленного количества начинок
      cy.get('[data-cy="ingredient_constructor"]', { timeout: 8000 })
        .should('exist')
        .children()
        .then(($children) => {
          const len = $children.length;
          chaiExpect(len).to.be.gte(addedCount);
        });
    });
  });
});
