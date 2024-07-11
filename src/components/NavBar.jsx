import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/NavBar.css';

const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isGameDropdownVisible, setIsGameDropdownVisible] = useState(false);
  const menuRef = useRef(null);
  const gameDropdownRef = useRef(null);
  const menuButtonRef = useRef(null);
  const gameButtonRef = useRef(null);

  const navigateTo = (path) => {
    navigate(path);
    setIsMenuVisible(false);
    setIsGameDropdownVisible(false);
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const toggleMenu = (event) => {
    event.stopPropagation();
    setIsMenuVisible(prevState => !prevState);
    if (isGameDropdownVisible) {
      setIsGameDropdownVisible(false);
    }
  };

  const toggleGameDropdown = (event) => {
    event.stopPropagation();
    setIsGameDropdownVisible(prevState => !prevState);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && menuButtonRef.current && !menuButtonRef.current.contains(event.target)) {
        setIsMenuVisible(false);
      }
      if (gameDropdownRef.current && !gameDropdownRef.current.contains(event.target) && gameButtonRef.current && !gameButtonRef.current.contains(event.target)) {
        setIsGameDropdownVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuRef, gameDropdownRef, menuButtonRef, gameButtonRef]);

  return (
    <div className='navbar'>
      <div className='navbar-left'>
        <div className='logo' onClick={() => navigateTo('/')}>
          <h1>PROJECT RP</h1>
        </div>
      </div>

      <div className='navbar-right'>
        <div ref={menuButtonRef} className={`menu-toggle ${isMenuVisible ? 'active' : ''}`} onClick={toggleMenu}>
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
        </div> 
        <div ref={menuRef} className={`menus ${isMenuVisible ? 'show' : ''}`}>
          <div className={`menu ${isActive('/new')}`} onClick={() => navigateTo('/new')}>CHARACTERS</div>
          <div className={`menu ${isActive('/family')}`} onClick={() => navigateTo('/family')}>Family&Skill</div>
          <div className={`menu ${isActive('/character')}`} onClick={() => navigateTo('/character')}>OLD CHARACTER</div>
          <div ref={gameButtonRef} className={`menu`} onClick={toggleGameDropdown}>
            GAME
            <div ref={gameDropdownRef} className={`dropdown ${isGameDropdownVisible ? 'show' : ''}`}>
              <div className={`dropdown-item ${isActive('/mafia')}`} onClick={() => navigateTo('/mafia')}>Mafia</div>
              <div className={`dropdown-item ${isActive('/moogoonghwa')}`} onClick={() => navigateTo('/moogoonghwa')}>MGH</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavBar;
