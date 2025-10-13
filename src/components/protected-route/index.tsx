import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from '../../services/store';
import { Preloader } from '../ui/preloader';

interface ProtectedRouteProps {
  element: JSX.Element;
  onlyUnAuth?: boolean;
}

export const ProtectedRoute = ({
  element,
  onlyUnAuth = false
}: ProtectedRouteProps) => {
  const user = useSelector((state: any) => state.user.user);
  const isUserLoaded = useSelector((state: any) => state.user.isUserLoaded);
  const location = useLocation();

  // Пока не знаем, авторизован ли пользователь — показываем прелоадер
  if (!isUserLoaded) {
    return <Preloader />;
  }

  // Если страница только для неавторизованных, а пользователь авторизован — редирект на главную
  if (onlyUnAuth && user) {
    return <Navigate to='/' replace />;
  }

  // Если страница защищённая, а пользователь не авторизован — редирект на /login
  if (!onlyUnAuth && !user) {
    return <Navigate to='/login' state={{ from: location }} replace />;
  }

  // Всё ок — рендерим страницу
  return element;
};
