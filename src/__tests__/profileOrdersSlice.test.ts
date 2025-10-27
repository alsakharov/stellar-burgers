import reducer, {
  wsConnect,
  wsDisconnect,
  wsError,
  wsMessage,
  setSelectedOrder,
  clearSelectedOrder
} from '../features/profileOrders/profileOrdersSlice';

describe('profileOrders slice', () => {
  const initial = reducer(undefined, { type: '@@INIT' } as any);

  // минимальная корректная заглушка Order
  const orderStub = {
    _id: 'o1',
    number: 1,
    name: 'Test Order',
    status: 'done',
    ingredients: ['ing1', 'ing2'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

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
    const withOrders = { ...initial, orders: [orderStub] };
    const next = reducer(withOrders as any, wsDisconnect());
    expect(next.wsConnected).toBe(false);
    expect(next.orders.length).toBe(1);
    expect(next.orders[0]._id).toBe(orderStub._id);
  });

  it('wsError sets error', () => {
    const next = reducer(initial, wsError('err'));
    expect(next.error).toBe('err');
  });

  it('wsMessage writes orders/total/totalToday', () => {
    const payload = {
      orders: [
        {
          _id: 'x',
          number: 2,
          name: 'Another Order',
          status: 'pending',
          ingredients: ['ingA'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
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
