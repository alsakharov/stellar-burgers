import React, { FC, memo } from 'react';
import { Link } from 'react-router-dom';
import styles from './burger-ingredient.module.css';

import {
  Counter,
  CurrencyIcon,
  AddButton
} from '@zlden/react-developer-burger-ui-components';

import { TBurgerIngredientUIProps } from './type';

export const BurgerIngredientUI: FC<TBurgerIngredientUIProps> = memo(
  ({ ingredient, count, handleAdd, locationState }) => {
    const { image, price, name, _id } = ingredient;

    const genUid = () =>
      `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const onDragStart = (e: React.DragEvent<HTMLDivElement>) => {
      try {
        const uid = genUid();
        const payload = { ...ingredient, __dragUid: uid };
        const json = JSON.stringify(payload);
        // основной payload
        e.dataTransfer.setData('application/json', json);
        // fallback и uid
        e.dataTransfer.setData('text/plain', json);
        e.dataTransfer.setData('text/uid', uid);
        e.dataTransfer.effectAllowed = 'copy';
      } catch {
        // noop
      }
    };

    const onAddClick = (e?: React.SyntheticEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      try {
        if (typeof handleAdd === 'function') {
          (handleAdd as unknown as () => void)();
        }
      } catch {
        // noop
      }
    };

    return (
      <div
        className={styles.container}
        draggable
        onDragStart={onDragStart}
        data-cy={`ingredient-item-${_id}`}
      >
        <Link
          className={styles.article}
          to={`/ingredients/${_id}`}
          state={locationState}
        >
          {count > 0 && <Counter count={count} />}
          <img className={styles.img} src={image} alt='картинка ингредиента.' />
          <div className={`${styles.cost} mt-2 mb-2`}>
            <p className='text text_type_digits-default mr-2'>{price}</p>
            <CurrencyIcon type='primary' />
          </div>
          <p className={`text text_type_main-default ${styles.text}`}>{name}</p>
        </Link>
        <AddButton
          text='Добавить'
          onClick={onAddClick}
          extraClass={`${styles.addButton} mt-8`}
          data-cy={`ingredient-add-${_id}`}
        />
      </div>
    );
  }
);
