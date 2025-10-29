import React, { FC, memo, useEffect } from 'react';

import styles from './modal.module.css';

import { CloseIcon } from '@zlden/react-developer-burger-ui-components';
import { TModalUIProps } from './type';
import { ModalOverlayUI } from '@ui';

/**
 * Универсальная модалка: рендерит контент + оверлей и закрытие по:
 * - кнопке закрытия
 * - клику по оверлею
 * - нажатию клавиши Escape
 */
export const ModalUI: FC<TModalUIProps> = memo(
  ({ title, onClose, children }) => {
    useEffect(() => {
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' || e.key === 'Esc') {
          onClose();
        }
      };
      document.addEventListener('keydown', onKeyDown);
      return () => {
        document.removeEventListener('keydown', onKeyDown);
      };
    }, [onClose]);

    return (
      <>
        <div className={styles.modal} role='dialog' aria-modal='true'>
          <div className={styles.header}>
            <h3 className={`${styles.title} text text_type_main-large`}>
              {title}
            </h3>

            <button
              className={styles.button}
              type='button'
              aria-label='close'
              data-cy='modal-close'
              onClick={onClose}
            >
              <CloseIcon type='primary' />
            </button>
          </div>

          <div className={styles.content}>{children}</div>
        </div>

        <ModalOverlayUI onClick={onClose} />
      </>
    );
  }
);
