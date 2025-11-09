import reducer, {
  addIngredient,
  removeIngredient,
  setBun,
  moveIngredient,
  clearConstructor
} from '../features/constructorItems/constructorItemsSlice';
import type { TIngredientInstance } from '../features/constructorItems/constructorItemsSlice';
import { createIngredient } from '../test-utils';
import type { TIngredient } from '../utils/types';

describe('constructorItems slice', () => {
  // helper: преобразуем TIngredient -> TIngredientInstance, добавляя uniqueId
  const makeInstanceFromIngredient = (
    it: TIngredient,
    uidSuffix = ''
  ): TIngredientInstance => ({
    ...it,
    uniqueId: `${it._id}${uidSuffix ? '-' + uidSuffix : ''}`
  });

  // фабричные фикстуры
  const fixtureBun = createIngredient({
    _id: 'bun-01',
    type: 'bun',
    price: 100
  });
  const fixtureMainA = createIngredient({
    _id: 'main-01',
    type: 'main',
    price: 50
  });
  const fixtureMainB = createIngredient({
    _id: 'main-02',
    type: 'main',
    price: 30
  });

  it('returns initial/cleared state', () => {
    const init = reducer(undefined, clearConstructor());
    expect(init).toHaveProperty('bun');
    expect(init).toHaveProperty('ingredients');
    expect(init.total).toBe(0);
    expect(init.bun).toBeNull();
    expect(Array.isArray(init.ingredients)).toBe(true);
  });

  it('setBun sets bun and recalc total (bun*2)', () => {
    let state = reducer(undefined, clearConstructor());
    const bunInst = makeInstanceFromIngredient(fixtureBun, 'x');
    state = reducer(state, setBun(bunInst));
    expect(state.bun?._id).toBe(fixtureBun._id);
    expect(state.total).toBe((Number(fixtureBun.price) || 0) * 2);
  });

  it('addIngredient: bun via addIngredient branch sets bun and handles string prices', () => {
    let state = reducer(undefined, clearConstructor());

    const bunPayload = {
      ...makeInstanceFromIngredient(fixtureBun, 'bun'),
      price: '20'
    } as unknown as TIngredientInstance;
    state = reducer(state, addIngredient(bunPayload));
    // bun set
    expect(state.bun?._id).toBe(fixtureBun._id);
    // string '20' should be parsed as 20 -> total = 40
    expect(state.total).toBe(40);

    // add ingredient with invalid price string -> treated as 0
    const badPrice = {
      ...makeInstanceFromIngredient(fixtureMainA, 'bad'),
      price: 'not-a-number'
    } as unknown as TIngredientInstance;
    state = reducer(state, addIngredient(badPrice));
    // total should remain 40 because bad price counts as 0
    expect(state.total).toBe(40);
  });

  it('addIngredient generates uniqueId when missing and preserves provided uniqueId/_uid/uid', () => {
    let state = reducer(undefined, clearConstructor());

    // no uniqueId/_uid/uid provided -> uniqueId should be generated
    const noUid = {
      _id: 'x1',
      type: 'main',
      price: 1
    } as unknown as TIngredientInstance;
    state = reducer(state, addIngredient(noUid));
    expect(state.ingredients.length).toBeGreaterThanOrEqual(1);
    const first = state.ingredients[0];
    expect(first).toBeDefined();
    expect(typeof first?.uniqueId).toBe('string');

    // provided uniqueId should be used unchanged
    const provided = {
      _id: 'x2',
      type: 'main',
      price: 2,
      uniqueId: 'EXISTING'
    } as unknown as TIngredientInstance;
    state = reducer(state, addIngredient(provided));
    const found = state.ingredients.find((i) => i?.uniqueId === 'EXISTING');
    expect(found).toBeDefined();

    // provided _uid should be used as uniqueId
    const with_uid = {
      _id: 'x3',
      _uid: 'MY_UID',
      type: 'main',
      price: 3
    } as unknown as TIngredientInstance;
    state = reducer(state, addIngredient(with_uid));
    const foundUid = state.ingredients.find(
      (i) => (i as TIngredientInstance | undefined)?._uid === 'MY_UID'
    );
    expect(foundUid).toBeDefined();
    expect(foundUid?.uniqueId).toBe('MY_UID');

    // arbitrary 'uid' field should be recognized by getIds and used for removal
    const with_arbitrary_uid: Partial<TIngredientInstance> & { uid: string } = {
      _id: 'x4',
      type: 'main',
      price: 4,
      uid: 'ARBIT'
    };
    state = reducer(
      state,
      addIngredient(with_arbitrary_uid as unknown as TIngredientInstance)
    );
    const added = state.ingredients.find(
      (i) => (i as TIngredientInstance | undefined)?._id === 'x4'
    );
    expect(added).toBeDefined();

    // now remove by that uid string
    state = reducer(state, removeIngredient('ARBIT'));
    expect(
      state.ingredients.some(
        (i) => (i as TIngredientInstance | undefined)?._id === 'x4'
      )
    ).toBe(false);
  });

  it('removeIngredient supports number index, object payload { index }, object payload { uid } and filters undefined', () => {
    let state = reducer(undefined, clearConstructor());

    // add three ingredients
    state = reducer(
      state,
      addIngredient(makeInstanceFromIngredient(fixtureMainA, '1'))
    );
    state = reducer(
      state,
      addIngredient(makeInstanceFromIngredient(fixtureMainB, '2'))
    );
    state = reducer(
      state,
      addIngredient(makeInstanceFromIngredient(fixtureMainA, '3'))
    );
    expect(state.ingredients.length).toBe(3);

    // remove by numeric index
    state = reducer(state, removeIngredient(1)); // removes second
    expect(state.ingredients.length).toBe(2);

    // add one item and remove by object { index }
    state = reducer(
      state,
      addIngredient(makeInstanceFromIngredient(fixtureMainB, '4'))
    );
    const lenBefore = state.ingredients.length;
    state = reducer(state, removeIngredient({ index: 0 }));
    expect(state.ingredients.length).toBe(lenBefore - 1);

    // add item with special uid and remove via object { uid }
    const special = {
      _id: 'spec',
      type: 'main',
      price: 5,
      uniqueId: 'SPECUID'
    } as unknown as TIngredientInstance;
    state = reducer(state, addIngredient(special));
    expect(
      state.ingredients.some(
        (i) => (i as TIngredientInstance | undefined)?.uniqueId === 'SPECUID'
      )
    ).toBe(true);
    state = reducer(state, removeIngredient({ uid: 'SPECUID' }));
    expect(
      state.ingredients.some(
        (i) => (i as TIngredientInstance | undefined)?.uniqueId === 'SPECUID'
      )
    ).toBe(false);

    // simulate undefined entries and ensure they are filtered out
    type ConstructorState = ReturnType<typeof reducer>;
    const badState: ConstructorState = {
      bun: null,
      ingredients: [
        undefined,
        { _id: 'x', type: 'main', price: 1 } as unknown as TIngredientInstance
      ],
      total: 1
    };
    const cleaned = reducer(
      badState as unknown as ConstructorState,
      removeIngredient(999)
    ); // no-op, but reducer filters undefined
    expect(cleaned.ingredients.every((it) => typeof it !== 'undefined')).toBe(
      true
    );
  });

  it('moveIngredient performs valid moves and ignores invalid indices (no-op)', () => {
    let state = reducer(undefined, clearConstructor());
    state = reducer(
      state,
      addIngredient(makeInstanceFromIngredient(fixtureMainA, 'a'))
    );
    state = reducer(
      state,
      addIngredient(makeInstanceFromIngredient(fixtureMainB, 'b'))
    );
    state = reducer(
      state,
      addIngredient(makeInstanceFromIngredient(fixtureMainA, 'c'))
    );

    const beforeOrder = state.ingredients.map((i) => i?._id ?? null);
    // valid move: 0 -> 2
    state = reducer(state, moveIngredient({ fromIndex: 0, toIndex: 2 }));
    const afterOrder = state.ingredients.map((i) => i?._id ?? null);
    expect(afterOrder.length).toBe(beforeOrder.length);
    expect(afterOrder).not.toEqual(beforeOrder);

    // invalid moves should not throw and should be no-ops
    const snapshot = state.ingredients.map((i) => i?._id ?? null);
    state = reducer(state, moveIngredient({ fromIndex: -1, toIndex: 1 }));
    state = reducer(state, moveIngredient({ fromIndex: 0, toIndex: 999 }));
    expect(state.ingredients.map((i) => i?._id ?? null)).toEqual(snapshot);
  });

  it('clearConstructor resets bun, ingredients and total', () => {
    let state = reducer(undefined, clearConstructor());
    state = reducer(
      state,
      addIngredient(makeInstanceFromIngredient(fixtureMainA, 'z'))
    );
    state = reducer(state, setBun(makeInstanceFromIngredient(fixtureBun, 'z')));
    expect(state.ingredients.length).toBeGreaterThan(0);
    expect(state.bun).not.toBeNull();

    state = reducer(state, clearConstructor());
    expect(state).toEqual({ bun: null, ingredients: [], total: 0 });
  });
});
