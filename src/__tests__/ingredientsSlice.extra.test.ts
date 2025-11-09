import { Action } from 'redux';
import reducer, {
  increaseCount,
  decreaseCount
} from '../features/ingredients/ingredientsSlice';
import { createIngredient } from '../test-utils';

describe('ingredients slice — bun decreaseCount edge', () => {
  it('decreaseCount for bun removes its count', () => {
    const bun = createIngredient({ _id: 'bun-test', type: 'bun', price: 10 });
    // initial: set count for bun via increaseCount
    let state = reducer(undefined, { type: '@@INIT' } as Action);
    state = reducer(state, increaseCount({ id: bun._id, type: 'bun' }));
    expect(state.counts[bun._id]).toBe(2);
    // now decreaseCount should remove bun count
    state = reducer(state, decreaseCount({ id: bun._id, type: 'bun' }));
    expect(state.counts[bun._id]).toBeUndefined();
  });
});
