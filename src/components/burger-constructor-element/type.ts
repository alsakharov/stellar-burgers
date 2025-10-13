import { TIngredient } from '../../utils/types';

export type TConstructorIngredientWithId = TIngredient & { uniqueId: string };
export type BurgerConstructorElementProps = {
  ingredient: TConstructorIngredientWithId;
  index: number;
  totalItems: number;
};
