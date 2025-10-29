/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to drag and drop an element
     * @example cy.dragAndDrop('[data-testid="ingredient-item"]', '[data-testid="burger-constructor"]')
     */
    dragAndDrop(source: string, target: string): Chainable<Element>;
  }
}

Cypress.Commands.add('dragAndDrop', (source: string, target: string) => {
  const dataTransfer = new DataTransfer();
  // dragstart на источнике
  cy.get(source, { timeout: 10000 })
    .should('exist')
    .then(($el) => cy.wrap($el).trigger('dragstart', { dataTransfer, force: true }))
    // drop на цели
    .then(() => cy.get(target, { timeout: 10000 }).trigger('drop', { dataTransfer, force: true }))
    // dragend как финализация
    .then(() => cy.get(source).trigger('dragend', { force: true }));

  // возвращаем chainable для дальнейших вызовов
  // Приводим тип, чтобы удовлетворить сигнатуру CommandFn — безопасно на runtime,
  // т.к. cy.get возвращает Chainable<JQuery<HTMLElement>>, которое в рантайме ведёт себя как Chainable
  return cy.get(target) as unknown as Cypress.Chainable<Element>;
});
