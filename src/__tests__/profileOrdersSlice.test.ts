import { Action } from 'redux';
import reducer, {
  wsConnect,
  wsDisconnect,
  wsError,
  wsMessage,
  setSelectedOrder,
  clearSelectedOrder
} from '../features/profileOrders/profileOrdersSlice';
import type { TOrder } from '../utils/types';
import { createOrder as createOrderFixture } from '../test-utils/factories/createOrder';

describe('profileOrders slice', () => {
  const initial = reducer(undefined, { type: '@@INIT' } as Action);

  // минимальная корректная заглушка Order, теперь через фабрику
  const orderStub: TOrder = createOrderFixture({
    _id: 'o1',
    number: 1,
    name: 'Test Order'
  });

  it('init state', () => {
    expect(initial).toHaveProperty('orders');
    expect(initial).toHaveProperty('wsConnected', false);
  });

  it('wsConnect sets wsConnected true', () => {
    const next = reducer(initial, wsConnect('/ws'));
    expect(next.wsConnected).toBe(true);
    expect(next.error).toBeNull();
  });

  it('wsDisconnect sets wsConnected false and keeps orders', () => {
    const withOrders = { ...initial, orders: [orderStub] } as ReturnType<
      typeof reducer
    >;
    const next = reducer(withOrders, wsDisconnect());
    expect(next.wsConnected).toBe(false);
    expect(next.orders.length).toBe(1);
    expect(next.orders[0]._id).toBe(orderStub._id);
  });

  it('wsError sets error', () => {
    const next = reducer(initial, wsError('err'));
    expect(next.error).toBe('err');
  });

  it('wsMessage writes orders/total/totalToday', () => {
    const orderFromFixture = createOrderFixture({
      _id: 'x',
      number: 2,
      name: 'Another Order',
      status: 'pending'
    });

    const payload = {
      orders: [orderFromFixture],
      total: 9,
      totalToday: 1
    };

    const next = reducer(initial, wsMessage(payload));
    expect(next.orders).toEqual(payload.orders);
    expect(next.total).toBe(9);
    expect(next.totalToday).toBe(1);
  });

  it('selection actions work', () => {
    const sel = reducer(initial, setSelectedOrder('id1'));
    expect(sel.selectedOrderId).toBe('id1');
    const cleared = reducer(sel, clearSelectedOrder());
    expect(cleared.selectedOrderId).toBeNull();
  });
});
