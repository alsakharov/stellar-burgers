import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type TIngredientInstance = {
  _id?: string;
  uniqueId?: string;
  _uid?: string;
  type?: string;
  price?: number;
  [key: string]: any;
};

type TConstructorState = {
  bun: TIngredientInstance | null;
  ingredients: Array<TIngredientInstance | undefined>;
  total: number;
};

const initialState: TConstructorState = {
  bun: null,
  ingredients: [],
  total: 0
};

type TRemovePayload = string | { uid?: string; index?: number } | number;
type TMovePayload = { fromIndex: number; toIndex: number };

const recalcTotal = (state: TConstructorState) => {
  state.total =
    (state.bun ? (state.bun.price || 0) * 2 : 0) +
    state.ingredients.reduce((s, v) => s + (v?.price || 0), 0);
};

const genUniqueId = (base?: string) =>
  `${base || 'item'}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const constructorItemsSlice = createSlice({
  name: 'constructorItems',
  initialState,
  reducers: {
    addIngredient(state, action: PayloadAction<TIngredientInstance>) {
      const item = action.payload;
      if (!item) return;

      if (item.type === 'bun') {
        state.bun = { ...item };
      } else {
        const instance: TIngredientInstance = { ...item };
        instance.uniqueId =
          instance.uniqueId || instance._uid || genUniqueId(instance._id);
        state.ingredients.push(instance);
      }
      recalcTotal(state);
    },

    removeIngredient(state, action: PayloadAction<TRemovePayload>) {
      const payload = action.payload;

      // helper to get any id candidates from an ingredient safely
      const getIds = (it: TIngredientInstance | undefined) =>
        [it?.uniqueId, it?._uid, it?.uid, it?._id].filter(Boolean) as string[];

      if (typeof payload === 'number') {
        const idx = payload;
        if (idx >= 0 && idx < state.ingredients.length) {
          state.ingredients.splice(idx, 1);
        }
      } else if (typeof payload === 'string') {
        const uid = payload;
        state.ingredients = state.ingredients.filter((it) => {
          const ids = getIds(it);
          return !ids.includes(uid);
        });
      } else if (typeof payload === 'object' && payload !== null) {
        const { index, uid } = payload as { index?: number; uid?: string };
        if (typeof index === 'number') {
          if (index >= 0 && index < state.ingredients.length) {
            state.ingredients.splice(index, 1);
          }
        } else if (uid) {
          state.ingredients = state.ingredients.filter((it) => {
            const ids = getIds(it);
            return !ids.includes(uid);
          });
        }
      }

      state.ingredients = state.ingredients.filter(
        (it) => typeof it !== 'undefined'
      );

      recalcTotal(state);
    },

    setBun(state, action: PayloadAction<TIngredientInstance | null>) {
      state.bun = action.payload ? { ...action.payload } : null;
      recalcTotal(state);
    },

    moveIngredient(state, action: PayloadAction<TMovePayload>) {
      const { fromIndex, toIndex } = action.payload;
      const len = state.ingredients.length;
      if (
        typeof fromIndex !== 'number' ||
        typeof toIndex !== 'number' ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= len ||
        toIndex >= len
      ) {
        return;
      }
      const [moved] = state.ingredients.splice(fromIndex, 1);
      state.ingredients.splice(toIndex, 0, moved);
      recalcTotal(state);
    },

    clearConstructor(state) {
      state.bun = null;
      state.ingredients = [];
      state.total = 0;
    }
  }
});

export const {
  addIngredient,
  removeIngredient,
  setBun,
  clearConstructor,
  moveIngredient
} = constructorItemsSlice.actions;
export default constructorItemsSlice.reducer;
