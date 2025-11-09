// Тесты для thunk fetchFeed — покрывают ветвления fetch.ok true/false

import { fetchFeed } from '../features/feed/feedSlice';
import type { AppDispatch, RootState } from '../services/store';
import { makeThunkDispatchMock } from '../test-utils/makeThunkDispatchMock';

describe('fetchFeed thunk', () => {
  let originalFetch: unknown;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    // безопасно восстанавливаем оригинальную fetch (через приведение типа)
    global.fetch = originalFetch as typeof global.fetch;
    jest.restoreAllMocks();
  });

  it('rejected when fetch.ok is false', async () => {
    const mockResponse = {
      ok: false,
      json: async () => ({})
    } as unknown as Response;

    // безопасно ставим мок в глобальную fetch (в случае отсутствия)
    global.fetch = jest
      .fn()
      .mockResolvedValue(mockResponse) as unknown as typeof global.fetch;

    const dispatch = makeThunkDispatchMock<RootState>();
    const getState = jest.fn(() => ({}) as RootState);

    const res = await fetchFeed()(dispatch, getState, undefined);
    expect(res.type).toMatch(/\/rejected$/);
  });

  it('fulfilled when fetch.ok is true', async () => {
    const payload = { orders: [{ _id: 'o1' }], total: 1, totalToday: 0 };
    const mockResponse = {
      ok: true,
      json: async () => payload
    } as unknown as Response;

    global.fetch = jest
      .fn()
      .mockResolvedValue(mockResponse) as unknown as typeof global.fetch;

    const dispatch = makeThunkDispatchMock<RootState>();
    const getState = jest.fn(() => ({}) as RootState);

    const res = await fetchFeed()(dispatch, getState, undefined);
    expect(res.type).toMatch(/\/fulfilled$/);
    expect(res.payload).toEqual(payload);
  });
});
