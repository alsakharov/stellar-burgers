import type { TIngredient } from '../../utils/types';

let ingCounter = 1;

/**
 * createIngredient - фабрика для тестов, возвращает валидный TIngredient.
 * Параметр overrides позволяет переопределять отдельные поля.
 */
export const createIngredient = (
  overrides: Partial<TIngredient> = {}
): TIngredient => {
  const id = overrides._id ?? `ing-${ingCounter++}`;
  return {
    _id: id,
    name: overrides.name ?? `Ingredient ${id}`,
    type: overrides.type ?? 'main',
    proteins: overrides.proteins ?? 0,
    fat: overrides.fat ?? 0,
    carbohydrates: overrides.carbohydrates ?? 0,
    calories: overrides.calories ?? 0,
    price: overrides.price ?? 10,
    image: overrides.image ?? '',
    image_large: overrides.image_large ?? '',
    image_mobile: overrides.image_mobile ?? '',
    ...overrides
  };
};
