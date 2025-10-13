import styles from './ingredients-category.module.css';
import { forwardRef } from 'react';
import { BurgerIngredient } from '@components';
import { TIngredient } from '@utils-types';

type IngredientsCategoryUIProps = {
  title: string;
  titleRef: React.RefObject<HTMLHeadingElement>;
  type: 'bun' | 'sauce' | 'main';
  ingredients: (TIngredient & { count?: number })[];
  onIngredientClick: (ingredient: TIngredient) => void;
};

export const IngredientsCategoryUI = forwardRef<
  HTMLUListElement,
  IngredientsCategoryUIProps
>(({ title, titleRef, ingredients, onIngredientClick }, ref) => (
  <>
    <h3 className='text text_type_main-medium mt-10 mb-6' ref={titleRef}>
      {title}
    </h3>
    <ul className={styles.items} ref={ref}>
      {ingredients.map((ingredient) => (
        <li className={styles.container} key={ingredient._id}>
          <BurgerIngredient
            ingredient={ingredient}
            count={ingredient.count || 0}
            onClick={() => onIngredientClick(ingredient)}
          />
        </li>
      ))}
    </ul>
  </>
));
