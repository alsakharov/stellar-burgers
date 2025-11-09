import { Action } from 'redux';
import reducer, {
  fetchIngredients,
  increaseCount,
  decreaseCount,
  setCount,
  resetCounts
} from '../features/ingredients/ingredientsSlice';
import type { TIngredient } from '../utils/types';
import { createIngredient } from '../test-utils';

describe('ingredients slice', () => {
  // создаём стабильный набор: 2 булки + 1 обычный ингредиент
  const bun1: TIngredient = createIngredient({
    _id: 'bun-01',
    type: 'bun',
    price: 125
  });
  const bun2: TIngredient = createIngredient({
    _id: 'bun-02',
    type: 'bun',
    price: 300
  });
  const main1: TIngredient = createIngredient({
    _id: 'ing-01',
    type: 'main',
    price: 50
  });

  const sampleItems: TIngredient[] = [bun1, bun2, main1];

  it('init state содержит items, isLoading, error и counts', () => {
    const state = reducer(undefined, { type: '@@INIT' } as Action);
    expect(state).toHaveProperty('items');
    expect(state).toHaveProperty('isLoading');
    expect(state).toHaveProperty('error');
    expect(state).toHaveProperty('counts');
  });

  it('fetchIngredients.pending ставит isLoading = true и очищает ошибку', () => {
    const action = fetchIngredients.pending('req', undefined);
    const state = reducer(undefined, action);
    expect(state.isLoading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('fetchIngredients.fulfilled сохраняет items и сбрасывает isLoading', () => {
    const action = fetchIngredients.fulfilled(sampleItems, 'req', undefined);
    const state = reducer(undefined, action);
    expect(Array.isArray(state.items)).toBe(true);
    expect(state.items.length).toBe(sampleItems.length);
    expect(state.isLoading).toBe(false);
  });

  it('fetchIngredients.rejected записывает ошибку и сбрасывает isLoading', () => {
    const action = fetchIngredients.rejected(
      new Error('fail'),
      'req',
      undefined
    );
    const state = reducer(undefined, action);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('fail');
  });

  it('increaseCount/decreaseCount корректно изменяют counts для обычных ингредиентов', () => {
    let state = reducer(
      undefined,
      fetchIngredients.fulfilled(sampleItems, 'req', undefined)
    );
    const ingId = main1._id;
    state = reducer(state, increaseCount({ id: ingId, type: main1.type }));
    state = reducer(state, increaseCount({ id: ingId, type: main1.type }));
    expect(state.counts[ingId]).toBe(2);

    state = reducer(state, decreaseCount({ id: ingId, type: main1.type }));
    expect(state.counts[ingId]).toBe(1);

    state = reducer(state, decreaseCount({ id: ingId, type: main1.type }));
    expect(state.counts[ingId]).toBeUndefined();
  });

  it('increaseCount для bun сбрасывает другие булки и ставит 2', () => {
    let state = reducer(
      undefined,
      fetchIngredients.fulfilled(sampleItems, 'req', undefined)
    );
    // установим bun1
    state = reducer(state, setCount({ id: bun1._id, count: 2 }));
    expect(state.counts[bun1._id]).toBe(2);

    // выбираем bun2
    state = reducer(state, increaseCount({ id: bun2._id, type: 'bun' }));
    expect(state.counts[bun1._id]).toBeUndefined();
    expect(state.counts[bun2._id]).toBe(2);
  });

  it('setCount устанавливает и удаляет счётчики по нулю', () => {
    let state = reducer(
      undefined,
      fetchIngredients.fulfilled(sampleItems, 'req', undefined)
    );
    const ingId = main1._id;
    state = reducer(state, setCount({ id: ingId, count: 3 }));
    expect(state.counts[ingId]).toBe(3);

    state = reducer(state, setCount({ id: ingId, count: 0 }));
    expect(state.counts[ingId]).toBeUndefined();
  });

  it('resetCounts очищает все счётчики', () => {
    let state = reducer(
      undefined,
      fetchIngredients.fulfilled(sampleItems, 'req', undefined)
    );
    const ingId = main1._id;
    state = reducer(state, setCount({ id: ingId, count: 2 }));
    state = reducer(state, resetCounts());
    expect(Object.keys(state.counts).length).toBe(0);
  });
});
