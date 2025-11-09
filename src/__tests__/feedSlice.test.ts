import { Action } from 'redux';
import reducer, { fetchFeed } from '../features/feed/feedSlice';
import type { TOrder } from '../utils/types';

describe('feed slice', () => {
  const initial = reducer(undefined, { type: '@@INIT' } as Action);

  afterEach(() => {
    (global as unknown as Record<string, unknown>).fetch = undefined;
    jest.restoreAllMocks();
  });

  it('инициализируется с корректным initial state', () => {
    expect(initial).toHaveProperty('orders');
    expect(initial.orders).toEqual([]);
    expect(initial).toHaveProperty('isLoading', false);
    expect(initial).toHaveProperty('error', null);
    expect(initial).toHaveProperty('total', 0);
    expect(initial).toHaveProperty('totalToday', 0);
  });

  it('fetchFeed.pending ставит isLoading = true и очищает error', () => {
    const pendingAction: ReturnType<typeof fetchFeed.pending> =
      fetchFeed.pending('req', undefined);
    const next = reducer(undefined, pendingAction as unknown as Action);
    expect(next.isLoading).toBe(true);
    expect(next.error).toBeNull();
  });

  it('fetchFeed.fulfilled сохраняет orders, total, totalToday и сбрасывает isLoading', () => {
    const payload: { orders: TOrder[]; total: number; totalToday: number } = {
      orders: [{ _id: 'o1' } as TOrder, { _id: 'o2' } as TOrder],
      total: 10,
      totalToday: 2
    };

    const fulfilledAction: ReturnType<typeof fetchFeed.fulfilled> =
      fetchFeed.fulfilled(payload, 'req', undefined);

    const next = reducer(undefined, fulfilledAction as unknown as Action);
    expect(next.isLoading).toBe(false);
    expect(next.orders).toEqual(payload.orders);
    expect(next.total).toBe(10);
    expect(next.totalToday).toBe(2);
  });

  it('fetchFeed.rejected записывает ошибку и сбрасывает isLoading', () => {
    const error = new Error('network');

    const rejectedAction: ReturnType<typeof fetchFeed.rejected> =
      fetchFeed.rejected(error, 'req', undefined);

    const next = reducer(undefined, rejectedAction as unknown as Action);
    expect(next.isLoading).toBe(false);
    expect(next.error).toBe('network');
  });
});
