jest.mock('../utils/burger-api', () => ({
  orderBurgerApi: jest.fn()
}));

import { orderBurgerApi } from '../utils/burger-api';
import { createOrder } from '../features/order/orderSlice';
import { makeThunkDispatchMock } from '../test-utils/makeThunkDispatchMock';
import type { RootState } from '../services/store';

describe('createOrder thunk — non-Error rejection payload', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns rejectWithValue for string error', async () => {
    (orderBurgerApi as jest.Mock).mockRejectedValue('boom'); // non-Error rejection

    const dispatch = makeThunkDispatchMock<RootState>();
    const res = await createOrder(['ing1'])(
      dispatch,
      () => ({}) as RootState,
      undefined
    );

    expect(res.type).toMatch(/\/rejected$/);
    // payload should be the stringified error
    expect(res.payload).toBe('boom');
  });
});
