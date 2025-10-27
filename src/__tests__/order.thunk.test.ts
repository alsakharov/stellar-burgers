// mock api
jest.mock('../utils/burger-api', () => ({
  orderBurgerApi: jest.fn()
}));

import { orderBurgerApi } from '../utils/burger-api';
import { createOrder } from '../features/order/orderSlice';
import { clearConstructor } from '../features/constructorItems/constructorItemsSlice';
import { resetCounts } from '../features/ingredients/ingredientsSlice';

describe('createOrder thunk', () => {
  afterEach(() => jest.clearAllMocks());

  it('success', async () => {
    // arrange
    (orderBurgerApi as jest.Mock).mockResolvedValue({ order: { number: 5 } });
    const dispatchMock = jest.fn();

    // act
    // @ts-ignore
    const res = await createOrder(['ing1'] as any)(
      dispatchMock,
      () => ({}),
      undefined
    );

    // assert
    expect(res.type).toMatch(/\/fulfilled$/);
    expect(res.payload).toBeDefined();
    const didCleanup = dispatchMock.mock.calls.some(
      (c) =>
        c[0] &&
        (c[0].type === clearConstructor().type ||
          c[0].type === resetCounts().type)
    );
    expect(didCleanup).toBe(true);
  });

  it('error', async () => {
    // arrange
    (orderBurgerApi as jest.Mock).mockRejectedValue(new Error('boom'));
    const dispatchMock = jest.fn();

    // act
    // @ts-ignore
    const res = await createOrder(['ing1'] as any)(
      dispatchMock,
      () => ({}),
      undefined
    );

    // assert
    expect(res.type).toMatch(/\/rejected$/);
    expect(res.payload).toBeDefined();
    const didCleanup = dispatchMock.mock.calls.some(
      (c) =>
        c[0] &&
        (c[0].type === clearConstructor().type ||
          c[0].type === resetCounts().type)
    );
    expect(didCleanup).toBe(false);
  });
});
