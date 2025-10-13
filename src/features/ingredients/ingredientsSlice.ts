import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getIngredientsApi } from '../../utils/burger-api';
import { TIngredient } from '../../utils/types';

interface IngredientsState {
  items: TIngredient[];
  isLoading: boolean;
  error: string | null;
  counts: { [id: string]: number };
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
        // Для булки всегда 2, остальные булки сбрасываем
        Object.keys(state.counts).forEach((key) => {
          if (state.items.find((item) => item._id === key)?.type === 'bun') {
            state.counts[key] = 0;
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
        state.counts[id] = 0;
      } else {
        state.counts[id] = Math.max((state.counts[id] || 1) - 1, 0);
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

export const { increaseCount, decreaseCount, resetCounts } =
  ingredientsSlice.actions;
export default ingredientsSlice.reducer;
