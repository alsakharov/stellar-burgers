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

import '../../index.css';
import styles from './app.module.css';

/* helper — перейти на background (path+search+state) */
const navigateToBackground = (
  navigate: ReturnType<typeof useNavigate>,
  bg: any,
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

/* Страница ингредиента (полный экран) */
const IngredientPage: React.FC = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const ingredients = useSelector((s: any) => s.ingredients.items || []);
  const isLoading = useSelector((s: any) => s.ingredients.isLoading);

  useEffect(() => {
    if (!ingredients.length) dispatch(fetchIngredients());
  }, [dispatch, ingredients.length]);

  const ingredient = ingredients.find((it: any) => it._id === id);

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
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const ingredients = useSelector((s: any) => s.ingredients.items || []);
  const ingredient = ingredients.find((it: any) => it._id === id);

  if (!ingredient) return null;

  const handleClose = () => {
    const state = (location && (location as any).state) || {};
    const bg = state.background;
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

  const navState = (location && (location as any).state) || {};
  const navOrder = navState.order;
  const navOrderIsObject =
    navOrder &&
    typeof navOrder === 'object' &&
    ('number' in navOrder || 'id' in navOrder || '_id' in navOrder);
  const orderFromNav = navOrderIsObject ? navOrder : null;

  const profileOrders = useSelector((s: any) => s.profileOrders.orders || []);
  const feedOrders = useSelector((s: any) => s.feed?.orders || []);
  const orderModalData = useSelector((s: any) => s.order?.orderModalData);
  const orderFromStore = orderModalData?.order ?? null;

  const paramNumber = params.number ?? null;

  const orderFromProfile =
    profileOrders.find(
      (o: any) =>
        String(o.number) === String(paramNumber) ||
        String(o._id) === String(paramNumber) ||
        (orderFromNav &&
          (String(o._id) === String(orderFromNav._id) ||
            String(o.number) === String(orderFromNav.number)))
    ) ?? null;

  const order = orderFromNav ?? orderFromProfile ?? orderFromStore ?? null;

  if (!order) return null;

  const ingredients: any[] = useSelector((s: any) => s.ingredients.items || []);

  type TIngredientsWithCount = { [key: string]: any & { count: number } };

  const ingredientsInfo = (order.ingredients || []).reduce(
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
    (acc: number, item: any) => acc + (item.price || 0) * item.count,
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
    const state = (location && (location as any).state) || {};
    const bg = state.background;

    if (bg) {
      navigateToBackground(navigate, bg, true);
      return;
    }

    if (profileOrders && profileOrders.length > 0) {
      navigate('/profile/orders', { replace: true });
      return;
    }

    if (feedOrders && feedOrders.length > 0) {
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
  const profileOrders = useSelector((s: any) => s.profileOrders.orders || []);
  const ingredients: any[] = useSelector((s: any) => s.ingredients.items || []);

  const raw = params.number ?? null;
  if (!raw) return <NotFound404 />;

  const order =
    profileOrders.find(
      (o: any) =>
        String(o.number) === String(raw) || String(o._id) === String(raw)
    ) ?? null;

  if (!order) return <Preloader />;

  type TIngredientsWithCount = { [key: string]: any & { count: number } };
  const ingredientsInfo = (order.ingredients || []).reduce(
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
    (acc: number, item: any) => acc + (item.price || 0) * item.count,
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
  // background если открыт overlay
  // @ts-ignore
  const background = location.state && (location.state as any).background;

  return (
    <>
      <Routes location={background || location}>
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

      {background && (
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
  const isUserLoaded = useSelector((s: any) => s.user.isUserLoaded);

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
