// mock api
jest.mock('../utils/burger-api', () => ({
  orderBurgerApi: jest.fn()
}));

import { orderBurgerApi } from '../utils/burger-api';
import { createOrder } from '../features/order/orderSlice';
import { clearConstructor } from '../features/constructorItems/constructorItemsSlice';
import { resetCounts } from '../features/ingredients/ingredientsSlice';
import type { RootState } from '../services/store';
import { makeThunkDispatchMock } from '../test-utils/makeThunkDispatchMock';

describe('createOrder thunk', () => {
  afterEach(() => jest.clearAllMocks());

  it('success', async () => {
    // arrange
    (orderBurgerApi as jest.Mock).mockResolvedValue({ order: { number: 5 } });

    // typed jest mock via helper
    const dispatch = makeThunkDispatchMock<RootState>();

    // act
    const res = await createOrder(['ing1'])(
      dispatch,
      () => ({}) as RootState,
      undefined
    );

    // assert
    expect(res.type).toMatch(/\/fulfilled$/);
    expect(res.payload).toBeDefined();

    const didCleanup = (dispatch as unknown as jest.Mock).mock.calls.some(
      (call: unknown[]) => {
        const maybeAction = call[0] as { type?: string } | undefined;
        if (!maybeAction || typeof maybeAction.type !== 'string') return false;
        return (
          maybeAction.type === clearConstructor().type ||
          maybeAction.type === resetCounts().type
        );
      }
    );

    expect(didCleanup).toBe(true);
  });

  it('error', async () => {
    // arrange
    (orderBurgerApi as jest.Mock).mockRejectedValue(new Error('boom'));

    const dispatch = makeThunkDispatchMock<RootState>();

    // act
    const res = await createOrder(['ing1'])(
      dispatch,
      () => ({}) as RootState,
      undefined
    );

    // assert
    expect(res.type).toMatch(/\/rejected$/);
    expect(res.payload).toBeDefined();

    const didCleanup = (dispatch as unknown as jest.Mock).mock.calls.some(
      (call: unknown[]) => {
        const maybeAction = call[0] as { type?: string } | undefined;
        if (!maybeAction || typeof maybeAction.type !== 'string') return false;
        return (
          maybeAction.type === clearConstructor().type ||
          maybeAction.type === resetCounts().type
        );
      }
    );

    expect(didCleanup).toBe(false);
  });
});
