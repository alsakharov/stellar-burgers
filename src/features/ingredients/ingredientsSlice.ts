import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getIngredientsApi } from '../../utils/burger-api';
import { TIngredient } from '../../utils/types';

interface IngredientsState {
  items: TIngredient[];
  isLoading: boolean;
  error: string | null;
  counts: Record<string, number>;
}

const initialState: IngredientsState = {
  items: [],
  isLoading: false,
  error: null,
  counts: {}
};

export const fetchIngredients = createAsyncThunk(
  'ingredients/fetchIngredients',
  async () => await getIngredientsApi()
);

const ingredientsSlice = createSlice({
  name: 'ingredients',
  initialState,
  reducers: {
    increaseCount(state, action: PayloadAction<{ id: string; type: string }>) {
      const { id, type } = action.payload;

      if (type === 'bun') {
        // Сбрасываем счётчики у других булок и ставим текущей булке 2
        Object.keys(state.counts).forEach((key) => {
          const item = state.items.find((it) => it._id === key);
          if (item?.type === 'bun') {
            delete state.counts[key];
          }
        });
        state.counts[id] = 2;
      } else {
        state.counts[id] = (state.counts[id] || 0) + 1;
      }
    },

    decreaseCount(state, action: PayloadAction<{ id: string; type: string }>) {
      const { id, type } = action.payload;

      if (type === 'bun') {
        // при удалении булки — сбрасываем её счётчик
        if (state.counts[id]) delete state.counts[id];
      } else {
        const current = state.counts[id] || 0;
        const updated = Math.max(current - 1, 0);
        if (updated === 0) {
          delete state.counts[id];
        } else {
          state.counts[id] = updated;
        }
      }
    },

    setCount(state, action: PayloadAction<{ id: string; count: number }>) {
      const { id, count } = action.payload;
      if (count <= 0) {
        delete state.counts[id];
      } else {
        state.counts[id] = count;
      }
    },

    resetCounts(state) {
      state.counts = {};
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIngredients.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchIngredients.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchIngredients.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Ошибка загрузки ингредиентов';
      });
  }
});

export const { increaseCount, decreaseCount, resetCounts, setCount } =
  ingredientsSlice.actions;
export default ingredientsSlice.reducer;
