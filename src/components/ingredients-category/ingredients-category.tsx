import { forwardRef } from 'react';
import { IngredientsCategoryUI } from '../ui/ingredients-category/ingredients-category';
import { TIngredient } from '@utils-types';

type IngredientsCategoryProps = {
  title: string;
  titleRef: React.RefObject<HTMLHeadingElement>;
  type: 'bun' | 'sauce' | 'main';
  ingredients: (TIngredient & { count?: number })[];
  onIngredientClick: (ingredient: TIngredient) => void;
};

export const IngredientsCategory = forwardRef<
  HTMLUListElement,
  IngredientsCategoryProps
>((props, ref) => <IngredientsCategoryUI {...props} ref={ref} />);
