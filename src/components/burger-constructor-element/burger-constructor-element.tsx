import { FC, memo } from 'react';
import { useDispatch } from '../../services/store';
import {
  removeIngredient,
  moveIngredient
} from '../../features/constructorItems/constructorItemsSlice';
import { decreaseCount } from '../../features/ingredients/ingredientsSlice';
import { BurgerConstructorElementUI } from '@ui';
import { BurgerConstructorElementProps } from './type';

export const BurgerConstructorElement: FC<BurgerConstructorElementProps> = memo(
  ({ ingredient, index, totalItems }) => {
    const dispatch = useDispatch();

    const handleMoveUp = () => {
      if (index > 0) {
        dispatch(moveIngredient({ dragIndex: index, hoverIndex: index - 1 }));
      }
    };

    const handleMoveDown = () => {
      if (index < totalItems - 1) {
        dispatch(moveIngredient({ dragIndex: index, hoverIndex: index + 1 }));
      }
    };

    const handleClose = () => {
      if (ingredient.id) {
        dispatch(removeIngredient(ingredient.id));
        dispatch(decreaseCount({ id: ingredient._id, type: ingredient.type }));
      }
    };

    return (
      <BurgerConstructorElementUI
        ingredient={ingredient}
        index={index}
        totalItems={totalItems}
        handleMoveUp={handleMoveUp}
        handleMoveDown={handleMoveDown}
        handleClose={handleClose}
      />
    );
  }
);
