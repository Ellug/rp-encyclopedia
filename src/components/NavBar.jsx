import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/NavBar.css';

const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 메뉴 항목에 따라 이동할 경로를 지정
  const navigateTo = (path) => {
    navigate(path);
  };

  // 현재 경로에 따라 'active' 클래스를 할당
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <div className='navbar'>
      <div className='navbar-left'>
        <div className='logo' onClick={() => navigateTo('/')}>
          <h1>PROJECT RP</h1>
        </div>
        <div className='menus'>
          <div className={`menu ${isActive('/history')}`} onClick={() => navigateTo('/history')}>HISTORY</div>
          <div className={`menu ${isActive('/character')}`} onClick={() => navigateTo('/character')}>CHARACTER</div>
          <div className={`menu ${isActive('/family')}`} onClick={() => navigateTo('/family')}>Family</div>
          <div className={`menu ${isActive('/etc')}`} onClick={() => navigateTo('/etc')}>ETC</div>
          <div className={`menu ${isActive('/map')}`} onClick={() => navigateTo('/map')}>MAP</div>
          <div className={`menu ${isActive('/game')}`} onClick={() => navigateTo('/game')}>GAME</div>
        </div>
      </div>
      <div className='navbar-right'>
        LoginModule.yet
      </div>
    </div>
  );
};

export default NavBar;