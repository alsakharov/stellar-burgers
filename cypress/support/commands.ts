/// <reference types="cypress" />

/**
 * Расширяем глобальные типы Cypress, объявляя нашу команду dragAndDrop.
 * Важно: параметр типа Subject должен совпадать с декларацией Cypress (обычно = any),
 * иначе TypeScript выдаст TS2428 ("All 'Chainable' declarations must have identical type parameters").
 */
declare global {
  namespace Cypress {
    interface Chainable<Subject = any> {
      /**
       * Перетащить элемент из source в target.
       * @param source селектор источника
       * @param target селектор цели
       * @returns Chainable с целью (JQuery<HTMLElement>)
       */
      dragAndDrop(source: string, target: string): Chainable<JQuery<HTMLElement>>;
    }
  }
}

/**
 * Реализация кастомной команды dragAndDrop.
 * - Создаём DataTransfer
 * - Триггерим dragstart на source, затем drop на target и dragend на source
 * - Возвращаем cy.get(target) для продолжения цепочки
 */
Cypress.Commands.add('dragAndDrop', (source: string, target: string) => {
  const dataTransfer = new DataTransfer();

  return cy
    .get(source, { timeout: 10000 })
    .should('exist')
    .then(($el) => {
      const $elTyped = $el as JQuery<HTMLElement>;
      return cy.wrap($elTyped).trigger('dragstart', { dataTransfer, force: true });
    })
    .then(() => cy.get(target, { timeout: 10000 }).trigger('drop', { dataTransfer, force: true }))
    .then(() => cy.get(source).trigger('dragend', { force: true }))
    .then(() => cy.get(target));
});

// Сделать файл модулем, чтобы декларация global применялась корректно
export {};
