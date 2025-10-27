import reducer, { fetchFeed } from '../features/feed/feedSlice';

describe('feed slice', () => {
  const initial = reducer(undefined, { type: '@@INIT' } as any);

  afterEach(() => {
    // сброс мока fetch
    (global as any).fetch = undefined;
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
    const action = fetchFeed.pending('req', undefined);
    const next = reducer(undefined, action);
    expect(next.isLoading).toBe(true);
    expect(next.error).toBeNull();
  });

  it('fetchFeed.fulfilled сохраняет orders, total, totalToday и сбрасывает isLoading', () => {
    const payload = {
      orders: [{ _id: 'o1' }, { _id: 'o2' }],
      total: 10,
      totalToday: 2
    } as any;
    const action = fetchFeed.fulfilled(payload, 'req', undefined);
    const next = reducer(undefined, action);
    expect(next.isLoading).toBe(false);
    expect(next.orders).toEqual(payload.orders);
    expect(next.total).toBe(10);
    expect(next.totalToday).toBe(2);
  });

  it('fetchFeed.rejected записывает ошибку и сбрасывает isLoading', () => {
    const action = {
      type: fetchFeed.rejected.type,
      error: { message: 'network' }
    } as any;
    const next = reducer(undefined, action);
    expect(next.isLoading).toBe(false);
    expect(next.error).toBe('network');
  });
});
