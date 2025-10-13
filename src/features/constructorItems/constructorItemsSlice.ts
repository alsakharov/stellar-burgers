import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TIngredient } from '../../utils/types';
import { v4 as uuidv4 } from 'uuid';

// Тип ингредиента с уникальным id для конструктора
type TConstructorIngredientWithId = TIngredient & { uniqueId: string };

// Состояние конструктора
type TConstructorState = {
  bun: TIngredient | null;
  ingredients: TConstructorIngredientWithId[];
};

const initialState: TConstructorState = {
  bun: null,
  ingredients: []
};

const constructorItemsSlice = createSlice({
  name: 'constructorItems',
  initialState,
  reducers: {
    // Добавление ингредиента: булка кладётся в bun, остальные — в ingredients
    addIngredient: {
      reducer: (state, action: PayloadAction<TConstructorIngredientWithId>) => {
        if (action.payload.type === 'bun') {
          state.bun = action.payload;
        } else {
          state.ingredients.push(action.payload);
        }
      },
      prepare: (ingredient: TIngredient) => ({
        payload: { ...ingredient, uniqueId: uuidv4() }
      })
    },
    // Удаление ингредиента по уникальному uuid
    removeIngredient: (state, action: PayloadAction<string>) => {
      state.ingredients = state.ingredients.filter(
        (item) => item.uniqueId !== action.payload
      );
    },
    // Перемещение ингредиента (drag & drop)
    moveIngredient: (
      state,
      action: PayloadAction<{ fromIndex: number; toIndex: number }>
    ) => {
      const { fromIndex, toIndex } = action.payload;
      const items = state.ingredients;
      const [removed] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, removed);
    },
    // Очистка конструктора
    clearConstructor: (state) => {
      state.bun = null;
      state.ingredients = [];
    }
  }
});

export const {
  addIngredient,
  removeIngredient,
  moveIngredient,
  clearConstructor
} = constructorItemsSlice.actions;

export default constructorItemsSlice.reducer;
