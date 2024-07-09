import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/NavBar.css';

const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const menuRef = useRef(null);

  const navigateTo = (path) => {
    navigate(path);
    setIsMenuVisible(false);
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const toggleMenu = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuRef]);

  return (
    <div className='navbar'>
      <div className='navbar-left'>
        <div className='logo' onClick={() => navigateTo('/')}>
          <h1>PROJECT RP</h1>
        </div>
      </div>

      <div className='navbar-right'>
        <div className="menu-toggle" onClick={toggleMenu}>
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
        </div> 
        <div ref={menuRef} className={`menus ${isMenuVisible ? 'show' : ''}`}>
          <div className={`menu ${isActive('/history')}`} onClick={() => navigateTo('/history')}>HISTORY</div>
          <div className={`menu ${isActive('/new')}`} onClick={() => navigateTo('/new')}>CHARACTERS</div>
          <div className={`menu ${isActive('/family')}`} onClick={() => navigateTo('/family')}>Family&Skill</div>
          <div className={`menu ${isActive('/mafia')}`} onClick={() => navigateTo('/mafia')}>Mafia</div>
          <div className={`menu ${isActive('/etc')}`} onClick={() => navigateTo('/etc')}>ETC</div>
          <div className={`menu ${isActive('/map')}`} onClick={() => navigateTo('/map')}>MAP</div>
          <div className={`menu ${isActive('/game')}`} onClick={() => navigateTo('/game')}>GAME</div>
          <div className={`menu ${isActive('/character')}`} onClick={() => navigateTo('/character')}>OLD CHARACTER</div>
        </div>
      </div>
    </div>
  );
};

export default NavBar;
