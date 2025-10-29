import { Action } from 'redux';
import reducer, {
  createOrder,
  closeOrderModal
} from '../features/order/orderSlice';
import type { TOrder } from '../utils/types';
import { createOrder as createOrderFixture } from '../test-utils/factories/createOrder';

describe('order slice', () => {
  it('инициализируется с корректным initial state', () => {
    const state = reducer(undefined, { type: '@@INIT' } as Action);
    expect(state).toHaveProperty('orderRequest', false);
    expect(state).toHaveProperty('orderModalData', null);
  });

  it('createOrder.pending ставит orderRequest = true и очищает modal', () => {
    const action = createOrder.pending('reqId', ['ing1']);
    const state = reducer(undefined, action);
    expect(state.orderRequest).toBe(true);
    expect(state.orderModalData).toBeNull();
  });

  it('createOrder.fulfilled сохраняет данные модалки и сбрасывает orderRequest', () => {
    // используем фабрику, чтобы получить валидный TOrder
    const fixtureOrder: TOrder = createOrderFixture({ number: 123 });
    const payload = { success: true, order: fixtureOrder };

    const action = createOrder.fulfilled(payload, 'reqId', ['ing1']);
    const state = reducer(undefined, action);
    expect(state.orderRequest).toBe(false);
    expect(state.orderModalData).toEqual(payload);
  });

  it('createOrder.rejected сохраняет ошибку в orderModalData и сбрасывает orderRequest', () => {
    const rejectedAction = {
      type: createOrder.rejected.type,
      payload: 'Ошибка заказа'
    } as ReturnType<typeof createOrder.rejected>;

    const state = reducer(undefined, rejectedAction);
    expect(state.orderRequest).toBe(false);
    expect(state.orderModalData).toEqual({ error: 'Ошибка заказа' });
  });

  it('closeOrderModal очищает orderModalData', () => {
    const fixtureOrder: TOrder = createOrderFixture({ number: 999 });
    const payload = { success: true, order: fixtureOrder };

    const filled = reducer(
      undefined,
      createOrder.fulfilled(payload, 'req', [])
    );
    expect(filled.orderModalData).toEqual(payload);
    const closed = reducer(filled, closeOrderModal());
    expect(closed.orderModalData).toBeNull();
  });
});
