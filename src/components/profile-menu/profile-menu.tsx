import { FC } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ProfileMenuUI } from '@ui';
import { useDispatch } from '../../services/store';
import { logout } from '../../features/user/userSlice';

export const ProfileMenu: FC<{
  handleLogout?: () => void;
}> = ({ handleLogout }) => {
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Если handleLogout не передан как проп, используем дефолтный обработчик
  const onLogout = handleLogout
    ? handleLogout
    : () => {
        dispatch(logout());
        navigate('/login');
      };

  return <ProfileMenuUI handleLogout={onLogout} pathname={pathname} />;
};
