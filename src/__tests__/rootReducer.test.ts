import { rootReducer } from '../services/rootReducer';

describe('rootReducer', () => {
  it('инициализируется и содержит ключи слайсов', () => {
    expect(typeof rootReducer).toBe('function');
    const state = (rootReducer as any)(undefined, { type: '@@INIT' });
    expect(state).toBeDefined();
    expect(state).toHaveProperty('constructorItems');
    expect(state).toHaveProperty('ingredients');
  });
});
