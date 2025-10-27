// Тесты для thunk fetchFeed — покрывают ветвления fetch.ok true/false

import { fetchFeed } from '../features/feed/feedSlice';

describe('fetchFeed thunk', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch as any;
    jest.restoreAllMocks();
  });

  it('rejected when fetch.ok is false', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({})
    } as any);

    // @ts-ignore
    const res = await fetchFeed()(jest.fn(), () => ({}), undefined);
    expect(res.type).toMatch(/\/rejected$/);
  });

  it('fulfilled when fetch.ok is true', async () => {
    const payload = { orders: [{ _id: 'o1' }], total: 1, totalToday: 0 };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => payload
    } as any);

    // @ts-ignore
    const res = await fetchFeed()(jest.fn(), () => ({}), undefined);
    expect(res.type).toMatch(/\/fulfilled$/);
    expect(res.payload).toEqual(payload);
  });
});
