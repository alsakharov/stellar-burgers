import type { ThunkDispatch } from 'redux-thunk';
import type { Action } from 'redux';

/**
 * Возвращает jest-мок, приведённый к ThunkDispatch<TState, TExtra, TAction>.
 * Использование в тестах: const dispatch = makeThunkDispatchMock<RootState>();
 */
export const makeThunkDispatchMock = <
  TState = unknown,
  TExtra = unknown,
  TAction extends Action = Action
>(): ThunkDispatch<TState, TExtra, TAction> =>
  jest.fn() as unknown as ThunkDispatch<TState, TExtra, TAction>;
