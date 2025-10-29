import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type TIngredientInstance = {
  _id?: string;
  uniqueId?: string;
  _uid?: string;
  type?: string;
  price?: number;
  [key: string]: unknown;
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

/* --- helpers --- */
const toNumber = (v: unknown): number => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

const genUniqueId = (base?: string) =>
  `${base || 'item'}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/**
 * Безопасно собирает возможные id/uid-поля из TIngredientInstance
 */
const getIds = (it: TIngredientInstance | undefined): string[] => {
  if (!it) return [];
  const rec = it as Record<string, unknown>;
  const candidates: Array<string | undefined> = [];

  if (typeof it.uniqueId === 'string') candidates.push(it.uniqueId);
  if (typeof it._uid === 'string') candidates.push(it._uid);
  // поле 'uid' может быть неизвестно в типе, берём через индексную подпись и проверяем
  const extraUid = rec.uid;
  if (typeof extraUid === 'string') candidates.push(extraUid);
  if (typeof it._id === 'string') candidates.push(it._id);

  return candidates.filter(Boolean) as string[];
};

const recalcTotal = (state: TConstructorState) => {
  const bunPrice = state.bun ? toNumber(state.bun.price) : 0;
  const ingredientsSum = state.ingredients.reduce(
    (s, v) => s + toNumber(v?.price),
    0
  );
  state.total = bunPrice * 2 + ingredientsSum;
};

/* --- slice --- */
const constructorItemsSlice = createSlice({
  name: 'constructorItems',
  initialState,
  reducers: {
    addIngredient(state, action: PayloadAction<TIngredientInstance>) {
      const item = action.payload;
      if (!item) return;

      if (item.type === 'bun') {
        // клонируем объект (чтобы не хранить ссылку на payload)
        state.bun = { ...item };
      } else {
        const instance: TIngredientInstance = { ...item };
        // безопасно получить base для генерирования id
        const base =
          typeof instance._id === 'string' ? instance._id : undefined;
        // instance.uniqueId/_uid уже typed как string | undefined, поэтому можно использовать напрямую
        instance.uniqueId =
          (typeof instance.uniqueId === 'string' && instance.uniqueId) ||
          (typeof instance._uid === 'string' && instance._uid) ||
          genUniqueId(base);
        state.ingredients.push(instance);
      }
      recalcTotal(state);
    },

    removeIngredient(state, action: PayloadAction<TRemovePayload>) {
      const payload = action.payload;

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
        } else if (typeof uid === 'string') {
          state.ingredients = state.ingredients.filter((it) => {
            const ids = getIds(it);
            return !ids.includes(uid);
          });
        }
      }

      // убрать undefined элементы (если они были)
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
