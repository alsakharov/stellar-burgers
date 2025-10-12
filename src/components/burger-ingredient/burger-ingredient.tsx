import React, { FC, memo } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch } from '../../services/store';
import { addIngredient } from '../../features/constructorItems/constructorItemsSlice';
import { increaseCount } from '../../features/ingredients/ingredientsSlice';
import { BurgerIngredientUI } from '../ui/burger-ingredient/burger-ingredient';
import { TBurgerIngredientProps } from './type';

export const BurgerIngredient: FC<TBurgerIngredientProps> = memo(
  ({ ingredient, count }) => {
    const location = useLocation();
    const dispatch = useDispatch();

    const handleAdd = () => {
      if (ingredient.type === 'bun') {
        // Булка — только поля TIngredient (без id)
        dispatch(addIngredient({ ...ingredient }));
        dispatch(increaseCount({ id: ingredient._id, type: ingredient.type }));
      } else {
        // Начинка — с уникальным id
        dispatch(
          addIngredient({
            ...ingredient,
            id: String(Date.now() + Math.random())
          })
        );
        dispatch(increaseCount({ id: ingredient._id, type: ingredient.type }));
      }
    };

    return (
      <BurgerIngredientUI
        ingredient={ingredient}
        count={count}
        locationState={{ background: location }}
        handleAdd={handleAdd}
      />
    );
  }
);
