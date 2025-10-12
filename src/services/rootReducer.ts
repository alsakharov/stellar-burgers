import { combineReducers } from '@reduxjs/toolkit';
import ingredientsReducer from '../features/ingredients/ingredientsSlice';
import userReducer from '../features/user/userSlice';
import feedReducer from '../features/feed/feedSlice';
import profileOrdersReducer from '../features/profileOrders/profileOrdersSlice';
import constructorItemsReducer from '../features/constructorItems/constructorItemsSlice';
import orderReducer from '../features/order/orderSlice';

export const rootReducer = combineReducers({
  ingredients: ingredientsReducer,
  user: userReducer,
  feed: feedReducer,
  profileOrders: profileOrdersReducer,
  constructorItems: constructorItemsReducer,
  order: orderReducer
});
