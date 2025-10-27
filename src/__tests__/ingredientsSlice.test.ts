import reducer, {
  fetchIngredients,
  increaseCount,
  decreaseCount,
  setCount,
  resetCounts
} from '../features/ingredients/ingredientsSlice';

describe('ingredients slice', () => {
  const sampleItems = [
    { _id: 'bun-1', type: 'bun', name: 'Bun 1' } as any,
    { _id: 'bun-2', type: 'bun', name: 'Bun 2' } as any,
    { _id: 'ing-1', type: 'main', name: 'Main 1' } as any
  ];

  it('init state содержит items, isLoading, error и counts', () => {
    const state = reducer(undefined, { type: '@@INIT' } as any);
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
    const action = fetchIngredients.fulfilled(
      sampleItems as any,
      'req',
      undefined
    );
    const state = reducer(undefined, action);
    expect(Array.isArray(state.items)).toBe(true);
    expect(state.items.length).toBe(sampleItems.length);
    expect(state.isLoading).toBe(false);
  });

  it('fetchIngredients.rejected записывает ошибку и сбрасывает isLoading', () => {
    const action = {
      type: fetchIngredients.rejected.type,
      error: { message: 'fail' }
    } as any;
    const state = reducer(undefined, action);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('fail');
  });

  it('increaseCount/decreaseCount корректно изменяют counts для обычных ингредиентов', () => {
    // добавляем items в state
    let state = reducer(
      undefined,
      fetchIngredients.fulfilled(sampleItems as any, 'req', undefined)
    );
    // увеличить count для ing-1 два раза
    state = reducer(state, increaseCount({ id: 'ing-1', type: 'main' }));
    state = reducer(state, increaseCount({ id: 'ing-1', type: 'main' }));
    expect(state.counts['ing-1']).toBe(2);

    // уменьшить один раз
    state = reducer(state, decreaseCount({ id: 'ing-1', type: 'main' }));
    expect(state.counts['ing-1']).toBe(1);

    // уменьшить до 0 -> удаляется
    state = reducer(state, decreaseCount({ id: 'ing-1', type: 'main' }));
    expect(state.counts['ing-1']).toBeUndefined();
  });

  it('increaseCount для bun сбрасывает другие булки и ставит 2', () => {
    let state = reducer(
      undefined,
      fetchIngredients.fulfilled(sampleItems as any, 'req', undefined)
    );
    // установим bun-1 ранее выбранной
    state = reducer(state, setCount({ id: 'bun-1', count: 2 }));
    expect(state.counts['bun-1']).toBe(2);

    // теперь выбираем bun-2 через increaseCount
    state = reducer(state, increaseCount({ id: 'bun-2', type: 'bun' }));
    expect(state.counts['bun-1']).toBeUndefined();
    expect(state.counts['bun-2']).toBe(2);
  });

  it('setCount устанавливает и удаляет счётчики по нулю', () => {
    let state = reducer(
      undefined,
      fetchIngredients.fulfilled(sampleItems as any, 'req', undefined)
    );
    state = reducer(state, setCount({ id: 'ing-1', count: 3 }));
    expect(state.counts['ing-1']).toBe(3);

    state = reducer(state, setCount({ id: 'ing-1', count: 0 }));
    expect(state.counts['ing-1']).toBeUndefined();
  });

  it('resetCounts очищает все счётчики', () => {
    let state = reducer(
      undefined,
      fetchIngredients.fulfilled(sampleItems as any, 'req', undefined)
    );
    state = reducer(state, setCount({ id: 'ing-1', count: 2 }));
    state = reducer(state, resetCounts());
    expect(Object.keys(state.counts).length).toBe(0);
  });
});
