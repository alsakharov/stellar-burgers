import React, { FC } from 'react';
import {
  Button,
  ConstructorElement,
  CurrencyIcon
} from '@zlden/react-developer-burger-ui-components';
import styles from './burger-constructor.module.css';
import { BurgerConstructorUIProps } from './type';
import { BurgerConstructorElement, Modal } from '@components';
import { Preloader } from '@ui';
import { TConstructorIngredientWithId } from '../../burger-constructor-element/type';

// UI-компонент для отображения конструктора бургера
export const BurgerConstructorUI: FC<BurgerConstructorUIProps> = ({
  constructorItems,
  orderRequest,
  price,
  onOrderClick,
  closeOrderModal
}) => (
  <section className={styles.burger_constructor} data-cy='constructor'>
    {/* Верхняя булка */}
    {constructorItems.bun ? (
      <div
        className={`${styles.element} mb-4 mr-4`}
        data-cy='bun_1_constructor'
      >
        <ConstructorElement
          type='top'
          isLocked
          text={`${constructorItems.bun.name} (верх)`}
          price={constructorItems.bun.price}
          thumbnail={constructorItems.bun.image}
        />
      </div>
    ) : (
      <div
        className={`${styles.noBuns} ${styles.noBunsTop} ml-8 mb-4 mr-5 text text_type_main-default`}
        data-cy='bun_1_constructor'
      >
        Выберите булки
      </div>
    )}

    {/* Начинки */}
    <ul className={styles.elements} data-cy='ingredient_constructor'>
      {constructorItems.ingredients.length > 0 ? (
        constructorItems.ingredients.map(
          (item: TConstructorIngredientWithId, index: number) => (
            <BurgerConstructorElement
              ingredient={item}
              index={index}
              totalItems={constructorItems.ingredients.length}
              key={item.uniqueId}
            />
          )
        )
      ) : (
        <div
          className={`${styles.noBuns} ml-8 mb-4 mr-5 text text_type_main-default`}
        >
          Выберите начинку
        </div>
      )}
    </ul>

    {/* Нижняя булка */}
    {constructorItems.bun ? (
      <div
        className={`${styles.element} mt-4 mr-4`}
        data-cy='bun_2_constructor'
      >
        <ConstructorElement
          type='bottom'
          isLocked
          text={`${constructorItems.bun.name} (низ)`}
          price={constructorItems.bun.price}
          thumbnail={constructorItems.bun.image}
        />
      </div>
    ) : (
      <div
        className={`${styles.noBuns} ${styles.noBunsBottom} ml-8 mb-4 mr-5 text text_type_main-default`}
        data-cy='bun_2_constructor'
      >
        Выберите булки
      </div>
    )}

    {/* Итоговая стоимость и кнопка заказа */}
    <div className={`${styles.total} mt-10 mr-4`} data-cy='order_button'>
      <div className={`${styles.cost} mr-10`}>
        <p className={`text ${styles.text} mr-2`}>{price}</p>
        <CurrencyIcon type='primary' />
      </div>
      <Button
        htmlType='button'
        type='primary'
        size='large'
        children='Оформить заказ'
        onClick={onOrderClick}
      />
    </div>

    {/* Модалка с лоадером при оформлении заказа */}
    {orderRequest && (
      <Modal onClose={closeOrderModal} title='Оформляем заказ...'>
        <Preloader />
      </Modal>
    )}
  </section>
);
