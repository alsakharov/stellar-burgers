import type { TOrder } from '../../utils/types';
import { createIngredient } from './createIngredient';

let orderCounter = 1000;

export const createOrder = (overrides: Partial<TOrder> = {}): TOrder => {
  const number = overrides.number ?? orderCounter++;
  return {
    _id: overrides._id ?? `order-${number}`,
    status: overrides.status ?? 'done',
    name: overrides.name ?? `Order ${number}`,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    updatedAt: overrides.updatedAt ?? new Date().toISOString(),
    number,
    ingredients: overrides.ingredients ?? [createIngredient()._id],
    ...overrides
  };
};
