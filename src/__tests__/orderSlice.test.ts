import reducer, {
  createOrder,
  closeOrderModal
} from '../features/order/orderSlice';

describe('order slice', () => {
  it('инициализируется с корректным initial state', () => {
    const state = reducer(undefined, { type: '@@INIT' } as any);
    expect(state).toHaveProperty('orderRequest', false);
    expect(state).toHaveProperty('orderModalData', null);
  });

  it('createOrder.pending ставит orderRequest = true и очищает modal', () => {
    const action = createOrder.pending('reqId', ['ing1'] as any);
    const state = reducer(undefined, action);
    expect(state.orderRequest).toBe(true);
    expect(state.orderModalData).toBeNull();
  });

  it('createOrder.fulfilled сохраняет данные модалки и сбрасывает orderRequest', () => {
    const payload = { order: { number: 123 } };
    const action = createOrder.fulfilled(payload as any, 'reqId', [
      'ing1'
    ] as any);
    const state = reducer(undefined, action);
    expect(state.orderRequest).toBe(false);
    expect(state.orderModalData).toEqual(payload);
  });

  it('createOrder.rejected сохраняет ошибку в orderModalData и сбрасывает orderRequest', () => {
    const action = {
      type: createOrder.rejected.type,
      payload: 'Ошибка заказа'
    } as any;
    const state = reducer(undefined, action);
    expect(state.orderRequest).toBe(false);
    expect(state.orderModalData).toEqual({ error: 'Ошибка заказа' });
  });

  it('closeOrderModal очищает orderModalData', () => {
    const payload = { order: { number: 999 } };
    const filled = reducer(
      undefined,
      createOrder.fulfilled(payload as any, 'req', [] as any)
    );
    expect(filled.orderModalData).toEqual(payload);
    const closed = reducer(filled, closeOrderModal());
    expect(closed.orderModalData).toBeNull();
  });
});
