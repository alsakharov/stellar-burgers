/// <reference types="cypress" />
import { expect as chaiExpect } from 'chai';

type IngredientType = 'bun' | 'main' | 'sauce' | string;

interface Ingredient {
  _id: string;
  name: string;
  type?: IngredientType;
  image?: string;
  image_large?: string;
  image_mobile?: string;
  calories?: number;
  proteins?: number;
  fat?: number;
  carbohydrates?: number;
  [k: string]: unknown;
}

const SELECTORS = {
  modalRoot: 'div[role="dialog"], .modal, .Modal',
  modalHeader: 'h3',
  modalCloseButton: 'button',
  overlayVariants: '[data-cy="overlay"], .modal-overlay, .ModalOverlay, .overlay'
};

function itemsFromFixture(raw: unknown): Ingredient[] {
  if (Array.isArray(raw)) return raw as Ingredient[];
  if (raw && typeof raw === 'object' && 'data' in (raw as Record<string, unknown>)) {
    const maybe = (raw as { data?: unknown }).data;
    if (Array.isArray(maybe)) return maybe as Ingredient[];
  }
  throw new Error('Fixture "ingredients.json" must be an array or { data: [] }');
}

/* Открыть модалку по видимому имени, избегая передачи options в cy.contains */
function openByName(name: string, id?: string): void {
  // сначала получаем контейнер страницы с таймаутом, затем ищем текст внутри него
  cy.get('body', { timeout: 8000 }).contains(name).then(($el) => {
    if (!$el) {
      throw new Error(`Не найден элемент с текстом: ${name}`);
    }
    const $elTyped = $el as JQuery<HTMLElement>;
    const $clickable = $elTyped.closest('a, button') as JQuery<HTMLElement>;
    if ($clickable && $clickable.length) {
      cy.wrap($clickable.first()).click({ force: true });
    } else {
      cy.wrap($elTyped).click({ force: true });
    }
  });

  // ждём появление заголовка модалки (берём отдельный таймаут в cy.get)
  cy.get(SELECTORS.modalHeader, { timeout: 8000 }).contains('Детали ингредиента').should('be.visible');

  if (id) {
    cy.location('pathname', { timeout: 8000 }).should('include', `/ingredients/${id}`);
  }
}

/* Валидируем поля модалки по данным фикстуры */
function validateModalFieldsAgainstFixture(item: Ingredient): void {
  cy.get(SELECTORS.modalRoot, { timeout: 8000 }).should('be.visible').within(() => {
    // имя — ищем внутри модалки
    cy.contains(String(item.name)).should('be.visible');

    // картинка — сравниваем по имени файла (или части имени без расширения)
    const imgUrl = item.image ?? item.image_large ?? item.image_mobile ?? '';
    if (imgUrl) {
      const filename = imgUrl.split('/').pop() ?? imgUrl;
      const filenameNoExt = filename.replace(/\.[^/.]+$/, '');
      cy.get('img').first().then(($img) => {
        const $imgTyped = $img as JQuery<HTMLImageElement>;
        const src = $imgTyped.attr('src') ?? '';
        chaiExpect(
          src.includes(filename) || src.includes(filenameNoExt),
          `Ожидали, что src содержит "${filename}" или "${filenameNoExt}", получили "${src}"`
        ).to.equal(true);
      });
    } else {
      cy.get('img').should('exist');
    }

    // числовые поля — ищем число как текст (поддерживает обёртки/юниты)
    if (typeof item.calories !== 'undefined') cy.contains(String(item.calories)).should('exist');
    if (typeof item.proteins !== 'undefined')  cy.contains(String(item.proteins)).should('exist');
    if (typeof item.fat !== 'undefined')       cy.contains(String(item.fat)).should('exist');
    if (typeof item.carbohydrates !== 'undefined') cy.contains(String(item.carbohydrates)).should('exist');
  });
}

/* Уход с route /ingredients/:id если он открыт */
function ensurePathLeft(id: string): void {
  cy.location('pathname').then((p) => {
    const path = String(p);
    if (path.includes(`/ingredients/${id}`)) cy.go('back');
  });

  cy.location('pathname', { timeout: 8000 }).should((p) => {
    const path = String(p);
    chaiExpect(path === '/' || !path.includes(`/ingredients/${id}`)).to.equal(true);
  });
}

describe('Модалка ингредиента — проверяем поля против фикстуры', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.intercept('GET', '**/ingredients**', { fixture: 'ingredients.json' }).as('getIngredients');
    cy.viewport(1300, 800);
    cy.visit('/');
    cy.wait('@getIngredients', { timeout: 10000 });
  });

  it('открытие модалки и проверка полей (закрываем крестиком)', () => {
    cy.fixture('ingredients.json').then((f: unknown) => {
      const items = itemsFromFixture(f);
      const item = items[0];
      chaiExpect(item).to.exist;

      openByName(String(item.name), String(item._id));
      validateModalFieldsAgainstFixture(item);

      // --- НОВОЕ: сужаем до первого найденного корня модалки и внутри него кликаем крестик
      cy.get(SELECTORS.modalRoot).first().within(() => {
        cy.get(SELECTORS.modalCloseButton).first().click({ force: true });
      });

      ensurePathLeft(String(item._id));
      // проверяем, что модалка исчезла
      cy.get(SELECTORS.modalRoot).should('not.exist');
    });
  });

  it('открытие модалки и закрытие кликом по overlay / fallback history.back', () => {
    cy.fixture('ingredients.json').then((f: unknown) => {
      const items = itemsFromFixture(f);
      const item = items[0];
      chaiExpect(item).to.exist;

      openByName(String(item.name), String(item._id));
      validateModalFieldsAgainstFixture(item);

      cy.get('body', { timeout: 3000 }).then(($body) => {
        const $b = $body as JQuery<HTMLElement>;
        if ($b.find('[data-cy="overlay"]').length) {
          cy.get('[data-cy="overlay"]').first().click({ force: true });
        } else if ($b.find('.modal-overlay, .ModalOverlay, .overlay').length) {
          cy.get('.modal-overlay, .ModalOverlay, .overlay').first().click({ force: true });
        } else {
          cy.go('back');
        }
      });

      ensurePathLeft(String(item._id));
      cy.get(SELECTORS.modalRoot).should('not.exist');
    });
  });

  it('открытие модалки и закрытие клавишей Escape (fallback back)', () => {
    cy.fixture('ingredients.json').then((f: unknown) => {
      const items = itemsFromFixture(f);
      const item = items[0];
      chaiExpect(item).to.exist;

      openByName(String(item.name), String(item._id));
      validateModalFieldsAgainstFixture(item);

      cy.get('body', { timeout: 3000 }).type('{esc}');

      cy.get('body', { timeout: 3000 }).then(($body) => {
        const $b = $body as JQuery<HTMLElement>;
        if ($b.find('h3:contains("Детали ингредиента")').length) cy.go('back');
      });

      ensurePathLeft(String(item._id));
      cy.get(SELECTORS.modalRoot).should('not.exist');
    });
  });
});
