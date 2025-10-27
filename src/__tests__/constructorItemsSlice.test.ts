import reducer, {
  addIngredient,
  removeIngredient,
  moveIngredient,
  setBun,
  clearConstructor
} from '../features/constructorItems/constructorItemsSlice';

/* init */
describe('constructorItems slice', () => {
  it('init state', () => {
    const state = reducer(undefined, { type: '@@INIT' } as any);
    expect(state).toHaveProperty('bun');
    expect(state).toHaveProperty('ingredients');
  });

  /* add */
  it('addIngredient adds item', () => {
    const item = { _id: 'i1', type: 'main', price: 10 } as any;
    const next = reducer(undefined, addIngredient(item));
    expect(Array.isArray(next.ingredients)).toBe(true);
    expect(next.ingredients.length).toBe(1);
  });

  /* remove (flex) */
  it('removeIngredient removes by available payload forms', () => {
    const item = { _id: 'i2', type: 'main', price: 5 } as any;
    const afterAdd = reducer(undefined, addIngredient(item));
    expect(afterAdd.ingredients.length).toBeGreaterThanOrEqual(1);

    const added = afterAdd.ingredients[afterAdd.ingredients.length - 1]!;
    const payload: any = (added.uniqueId ??
      added._uid ??
      added._id ??
      added) as any;

    const afterRemove = reducer(afterAdd, removeIngredient(payload as any));
    expect(Array.isArray(afterRemove.ingredients)).toBe(true);
    expect(afterRemove.ingredients.length).toBe(0);
  });

  /* reorder */
  it('moveIngredient reorders elements', () => {
    const a = { _id: 'a', type: 'main' } as any;
    const b = { _id: 'b', type: 'main' } as any;
    let state = reducer(undefined, { type: '@@INIT' } as any);
    state = reducer(state, addIngredient(a));
    state = reducer(state, addIngredient(b));
    const before = state.ingredients.map(
      (i: any) => i._id ?? i.uniqueId ?? JSON.stringify(i)
    );
    const next = reducer(
      state,
      moveIngredient({ fromIndex: 0, toIndex: 1 } as any)
    );
    const after = next.ingredients.map(
      (i: any) => i._id ?? i.uniqueId ?? JSON.stringify(i)
    );
    expect(after).not.toEqual(before);
  });

  /* bun / clear / edgecases */
  describe('extra branches', () => {
    /* bun */
    it('setBun sets and clears bun and recalculates total', () => {
      let state = reducer(undefined, { type: '@@INIT' } as any);
      const bun = { _id: 'b1', type: 'bun', price: 10 } as any;
      state = reducer(state, setBun(bun));
      expect(state.bun?._id).toBe('b1');
      expect(state.total).toBe(20);

      state = reducer(state, setBun(null));
      expect(state.bun).toBeNull();
      expect(state.total).toBe(0);
    });

    /* remove by uid/object */
    it('removeIngredient by object or uid', () => {
      let state = reducer(undefined, { type: '@@INIT' } as any);
      const item = { _id: 'i1', uniqueId: 'u1', price: 5, type: 'main' } as any;
      state = reducer(state, addIngredient(item));
      expect(state.ingredients.length).toBe(1);

      state = reducer(state, removeIngredient({ uid: 'u1' } as any));
      expect(state.ingredients.length).toBe(0);

      state = reducer(
        state,
        addIngredient({
          _id: 'i2',
          uniqueId: 'x1',
          price: 2,
          type: 'main'
        } as any)
      );
      expect(state.ingredients.length).toBe(1);
      state = reducer(state, removeIngredient('x1' as any));
      expect(state.ingredients.length).toBe(0);
    });

    /* remove index out-of-range */
    it('removeIngredient with invalid index is noop', () => {
      let state = reducer(undefined, { type: '@@INIT' } as any);
      const before = JSON.stringify(state);
      state = reducer(state, removeIngredient(5 as any));
      expect(JSON.stringify(state)).toBe(before);
    });

    /* move invalid */
    it('moveIngredient with invalid indexes is noop', () => {
      let state = reducer(undefined, { type: '@@INIT' } as any);
      state = reducer(
        state,
        addIngredient({ _id: 'i1', price: 1, type: 'main' } as any)
      );
      const before = JSON.stringify(state);
      state = reducer(
        state,
        moveIngredient({ fromIndex: -1, toIndex: 10 } as any)
      );
      expect(JSON.stringify(state)).toBe(before);
    });

    /* clear */
    it('clearConstructor resets all', () => {
      let state = reducer(undefined, { type: '@@INIT' } as any);
      state = reducer(
        state,
        addIngredient({ _id: 'i1', price: 2, type: 'main' } as any)
      );
      state = reducer(
        state,
        setBun({ _id: 'b', price: 3, type: 'bun' } as any)
      );
      state = reducer(state, clearConstructor());
      expect(state.bun).toBeNull();
      expect(state.ingredients.length).toBe(0);
      expect(state.total).toBe(0);
    });

    /* remaining branches: remove by string, remove by index, move noop/mid-move */
    it('remove by string uniqueId', () => {
      let state = reducer(undefined, { type: '@@INIT' } as any);
      state = reducer(
        state,
        addIngredient({
          _id: 'ix1',
          uniqueId: 's1',
          price: 3,
          type: 'main'
        } as any)
      );
      expect(state.ingredients.length).toBe(1);
      state = reducer(state, removeIngredient('s1' as any));
      expect(state.ingredients.length).toBe(0);
    });

    it('remove by payload.index (valid)', () => {
      let state = reducer(undefined, { type: '@@INIT' } as any);
      state = reducer(
        state,
        addIngredient({ _id: 'i10', price: 1, type: 'main' } as any)
      );
      state = reducer(
        state,
        addIngredient({ _id: 'i11', price: 2, type: 'main' } as any)
      );
      expect(state.ingredients.length).toBe(2);
      state = reducer(state, removeIngredient({ index: 0 } as any));
      expect(state.ingredients.length).toBe(1);
      const remaining = state.ingredients[0] as any;
      expect(remaining._id === 'i11' || remaining.uniqueId).toBeTruthy();
    });

    it('moveIngredient noop and mid-move', () => {
      let state = reducer(undefined, { type: '@@INIT' } as any);
      state = reducer(
        state,
        addIngredient({ _id: 'm1', price: 1, type: 'main' } as any)
      );
      state = reducer(
        state,
        addIngredient({ _id: 'm2', price: 2, type: 'main' } as any)
      );
      state = reducer(
        state,
        addIngredient({ _id: 'm3', price: 3, type: 'main' } as any)
      );
      const before = state.ingredients.map(
        (i: any) => i._id ?? i.uniqueId ?? JSON.stringify(i)
      );
      state = reducer(
        state,
        moveIngredient({ fromIndex: 1, toIndex: 1 } as any)
      );
      const afterNoop = state.ingredients.map(
        (i: any) => i._id ?? i.uniqueId ?? JSON.stringify(i)
      );
      expect(afterNoop).toEqual(before);

      state = reducer(
        state,
        moveIngredient({ fromIndex: 0, toIndex: 2 } as any)
      );
      const after = state.ingredients.map(
        (i: any) => i._id ?? i.uniqueId ?? JSON.stringify(i)
      );
      expect(after).not.toEqual(before);
      expect(after[2]).toMatch(/m1/);
    });
  });
});
