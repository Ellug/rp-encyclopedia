import React, { useState } from 'react';
import './App.css';
import { Route, HashRouter, Routes, Navigate } from 'react-router-dom';
import Main from './pages/main';
import History from './pages/History';
import Character from './pages/Character';
import Etc from './pages/ETC';
import Map from './pages/Map';
import Game from './pages/Game';
import Mafia from './pages/Mafia';
import NavBar from './components/NavBar';
import Family from './pages/Family';
import New from './pages/New'
import Auth from './Auth';

function App() {

  const [token, setToken] = useState(sessionStorage.getItem('token'));

  const requireAuth = (element) => {
    return token ? element : <Navigate to="/auth" />;
  };

  return (
    <HashRouter basename=''>
        <NavBar />
        <div className='routes-container'>
          <Routes>
            <Route path="/auth" element={<Auth setToken={setToken} />} />
            <Route path="/" element={requireAuth(<Main />)} />
            <Route path="/history" element={requireAuth(<History />)} />
            <Route path="/character" element={requireAuth(<Character />)} />
            <Route path="/family" element={requireAuth(<Family />)} />
            <Route path="/new" element={<New />} />
            <Route path="/etc" element={<Etc />} />
            <Route path="/map" element={<Map />} />
            <Route path="/mafia" element={<Mafia />} />
            <Route path="/game" element={<Game />} />
          </Routes>
        </div>
    </HashRouter>
  );
}

export default App;