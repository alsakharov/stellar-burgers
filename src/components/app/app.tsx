import React, { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
  useParams
} from 'react-router-dom';

import { useSelector, useDispatch } from '../../services/store';
import type { RootState } from '../../services/store';

import { ConstructorPage } from '../../pages/constructor-page';
import { Feed } from '../../pages/feed';
import { Login } from '../../pages/login';
import { Register } from '../../pages/register';
import { ForgotPassword } from '../../pages/forgot-password';
import { ResetPassword } from '../../pages/reset-password';
import { Profile } from '../../pages/profile';
import { ProfileOrders } from '../../pages/profile-orders';
import { NotFound404 } from '../../pages/not-fount-404';

import { fetchUser } from '../../features/user/userSlice';
import { fetchIngredients } from '../../features/ingredients/ingredientsSlice';

import { AppHeader } from '../app-header';
import { ProtectedRoute } from '../protected-route';

import { Preloader } from '../ui/preloader';
import { ModalUI } from '../ui/modal/modal';
import { IngredientDetailsUI } from '../ui/ingredient-details';
import { OrderInfoUI } from '../ui/order-info/order-info';

import type { TIngredient, TOrder } from '@utils-types';

import '../../index.css';
import styles from './app.module.css';

/* helper — перейти на background (path+search+state) */
const navigateToBackground = (
  navigate: ReturnType<typeof useNavigate>,
  bg: { pathname?: string; search?: string; state?: unknown } | undefined,
  replace = true
) => {
  if (!bg) {
    navigate('/', { replace });
    return;
  }
  const pathname = bg.pathname || '/';
  const search = bg.search || '';
  const state = bg.state || undefined;
  navigate(pathname + search, { replace, state });
};

/* Помощь: безопасно извлечь background из location.state */
function getBackgroundFromLocationState(
  locState: unknown
): { pathname?: string; search?: string; state?: unknown } | undefined {
  if (locState && typeof locState === 'object') {
    const record = locState as Record<string, unknown>;
    const b = record.background;
    if (b && typeof b === 'object') {
      return b as { pathname?: string; search?: string; state?: unknown };
    }
  }
  return undefined;
}

/* Страница ингредиента (полный экран) */
const IngredientPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const dispatch = useDispatch();
  const ingredients = useSelector(
    (state: RootState) => state.ingredients.items ?? ([] as TIngredient[])
  );
  const isLoading = useSelector(
    (state: RootState) => state.ingredients.isLoading ?? false
  );

  useEffect(() => {
    if (!ingredients.length) dispatch(fetchIngredients());
  }, [dispatch, ingredients.length]);

  const ingredient = ingredients.find((it) => it._id === id);

  if (isLoading || !ingredients.length) return <Preloader />;
  if (!ingredient)
    return (
      <div className='text text_type_main-medium mt-10 mb-10'>
        Ингредиент не найден
      </div>
    );

  return (
    <div className='pt-30 pb-30'>
      <IngredientDetailsUI ingredientData={ingredient} />
    </div>
  );
};

/* Модалка ингредиента (overlay) */
const IngredientModal: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const ingredients = useSelector(
    (state: RootState) => state.ingredients.items ?? ([] as TIngredient[])
  );
  const ingredient = ingredients.find((it) => it._id === id);

  if (!ingredient) return null;

  const handleClose = () => {
    const locState = location.state as unknown;
    const bg = getBackgroundFromLocationState(locState);
    if (bg) {
      navigateToBackground(navigate, bg, true);
      return;
    }
    navigate('/', { replace: true });
  };

  return (
    <ModalUI title='Детали ингредиента' onClose={handleClose}>
      <IngredientDetailsUI ingredientData={ingredient} />
    </ModalUI>
  );
};

/* Модалка заказа (overlay) — источник: state | профиль | стор */
const OrderInfoModal: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ number?: string }>();

  const navState = location.state as unknown;
  const navOrderCandidate = (
    navState && typeof navState === 'object'
      ? (navState as Record<string, unknown>).order
      : undefined
  ) as unknown;
  const navOrderIsObject =
    navOrderCandidate &&
    typeof navOrderCandidate === 'object' &&
    ('number' in (navOrderCandidate as Record<string, unknown>) ||
      'id' in (navOrderCandidate as Record<string, unknown>) ||
      '_id' in (navOrderCandidate as Record<string, unknown>));
  const orderFromNav = navOrderIsObject ? (navOrderCandidate as TOrder) : null;

  const profileOrders = useSelector(
    (state: RootState) => state.profileOrders.orders ?? ([] as TOrder[])
  );
  const feedOrders = useSelector(
    (state: RootState) => state.feed?.orders ?? ([] as TOrder[])
  );
  const orderModalData = useSelector(
    (state: RootState) => state.order?.orderModalData
  ) as { order?: TOrder } | undefined;
  const orderFromStore = orderModalData?.order ?? null;

  const paramNumber = params.number ?? null;

  const orderFromProfile =
    profileOrders.find((o) => {
      if (!o) return false;
      const oNumber = o.number ?? o._id;
      if (!paramNumber) return false;
      if (oNumber !== undefined && String(oNumber) === String(paramNumber))
        return true;
      if (
        orderFromNav &&
        ((o._id && String(o._id) === String(orderFromNav._id)) ||
          (o.number && String(o.number) === String(orderFromNav.number)))
      )
        return true;
      return false;
    }) ?? null;

  const order = orderFromNav ?? orderFromProfile ?? orderFromStore ?? null;

  if (!order) return null;

  const ingredients = useSelector(
    (state: RootState) => state.ingredients.items ?? ([] as TIngredient[])
  );

  type TIngredientsWithCount = {
    [key: string]: TIngredient & { count: number };
  };

  const ingredientsInfo = (order.ingredients ?? []).reduce(
    (acc: TIngredientsWithCount, id: string) => {
      if (!acc[id]) {
        const ingredient = ingredients.find((ing) => ing._id === id);
        if (ingredient) acc[id] = { ...ingredient, count: 1 };
      } else {
        acc[id].count++;
      }
      return acc;
    },
    {} as TIngredientsWithCount
  );

  const total = Object.values(ingredientsInfo).reduce(
    (acc: number, item: TIngredient & { count: number }) =>
      acc + (item.price ?? 0) * item.count,
    0
  );

  const date = order.createdAt ? new Date(order.createdAt) : new Date();

  const orderInfo = {
    ...order,
    ingredientsInfo,
    date,
    total
  };

  const handleClose = () => {
    const locState = location.state as unknown;
    const bg = getBackgroundFromLocationState(locState);
    if (bg) {
      navigateToBackground(navigate, bg, true);
      return;
    }

    if (profileOrders.length > 0) {
      navigate('/profile/orders', { replace: true });
      return;
    }

    if (feedOrders.length > 0) {
      navigate('/feed', { replace: true });
      return;
    }

    navigate('/', { replace: true });
  };

  return (
    <ModalUI title={`Заказ #${order.number}`} onClose={handleClose}>
      <OrderInfoUI orderInfo={orderInfo} />
    </ModalUI>
  );
};

/* Прямая страница заказа /feed/:number */
const OrderInfoUIWrapper: React.FC = () => {
  const params = useParams<{ number?: string }>();
  const profileOrders = useSelector(
    (state: RootState) => state.profileOrders.orders ?? ([] as TOrder[])
  );
  const ingredients = useSelector(
    (state: RootState) => state.ingredients.items ?? ([] as TIngredient[])
  );

  const raw = params.number ?? null;
  if (!raw) return <NotFound404 />;

  const order =
    profileOrders.find((o) => {
      if (!o) return false;
      return String(o.number) === String(raw) || String(o._id) === String(raw);
    }) ?? null;

  if (!order) return <Preloader />;

  type TIngredientsWithCount = {
    [key: string]: TIngredient & { count: number };
  };
  const ingredientsInfo = (order.ingredients ?? []).reduce(
    (acc: TIngredientsWithCount, id: string) => {
      if (!acc[id]) {
        const ingredient = ingredients.find((ing) => ing._id === id);
        if (ingredient) acc[id] = { ...ingredient, count: 1 };
      } else {
        acc[id].count++;
      }
      return acc;
    },
    {} as TIngredientsWithCount
  );

  const total = Object.values(ingredientsInfo).reduce(
    (acc: number, item: TIngredient & { count: number }) =>
      acc + (item.price ?? 0) * item.count,
    0
  );

  const date = order.createdAt ? new Date(order.createdAt) : new Date();

  const orderInfo = {
    ...order,
    ingredientsInfo,
    date,
    total
  };

  return (
    <div className='pt-30 pb-30'>
      <OrderInfoUI orderInfo={orderInfo} />
    </div>
  );
};

/* Роуты + overlays */
const AppRoutes: React.FC = () => {
  const location = useLocation();
  const bg = getBackgroundFromLocationState(location.state as unknown);

  return (
    <>
      <Routes location={bg ?? location}>
        <Route path='/' element={<ConstructorPage />} />
        <Route path='/feed' element={<Feed />} />
        <Route
          path='/login'
          element={<ProtectedRoute onlyUnAuth element={<Login />} />}
        />
        <Route
          path='/register'
          element={<ProtectedRoute onlyUnAuth element={<Register />} />}
        />
        <Route
          path='/forgot-password'
          element={<ProtectedRoute onlyUnAuth element={<ForgotPassword />} />}
        />
        <Route
          path='/reset-password'
          element={<ProtectedRoute onlyUnAuth element={<ResetPassword />} />}
        />
        <Route
          path='/profile'
          element={<ProtectedRoute element={<Profile />} />}
        />
        <Route
          path='/profile/orders'
          element={<ProtectedRoute element={<ProfileOrders />} />}
        />
        <Route path='/ingredients/:id' element={<IngredientPage />} />
        <Route path='/feed/:number' element={<OrderInfoUIWrapper />} />
        <Route path='*' element={<NotFound404 />} />
      </Routes>

      {bg && (
        <Routes>
          <Route path='/ingredients/:id' element={<IngredientModal />} />
          <Route path='/feed/:number' element={<OrderInfoModal />} />
          <Route
            path='/profile/orders/:number'
            element={<ProtectedRoute element={<OrderInfoModal />} />}
          />
        </Routes>
      )}
    </>
  );
};

/* Корневой компонент */
const App: React.FC = () => {
  const dispatch = useDispatch();
  const isUserLoaded = useSelector(
    (state: RootState) => state.user.isUserLoaded ?? false
  );

  useEffect(() => {
    if (!isUserLoaded) dispatch(fetchUser());
  }, [dispatch, isUserLoaded]);

  useEffect(() => {
    dispatch(fetchIngredients());
  }, [dispatch]);

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <div className={styles.app}>
        <AppHeader />
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
};

export default App;
