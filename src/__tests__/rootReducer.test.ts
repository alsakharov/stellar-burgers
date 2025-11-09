import { Action } from 'redux';
import { rootReducer } from '../services/rootReducer';

describe('rootReducer', () => {
  it('инициализируется и содержит ключи слайсов', () => {
    expect(typeof rootReducer).toBe('function');
    const state = rootReducer(undefined, { type: '@@INIT' } as Action);
    expect(state).toBeDefined();
    expect(state).toHaveProperty('constructorItems');
    expect(state).toHaveProperty('ingredients');
  });
});
