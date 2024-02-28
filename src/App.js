import React from 'react';
import './App.css';
import { Route, HashRouter, Routes } from 'react-router-dom';
import Main from './pages/main';
import History from './pages/History';
import Character from './pages/Character';
import Etc from './pages/ETC';
import Map from './pages/Map';
import Game from './pages/Game';
import NavBar from './components/NavBar';
import Family from './pages/Family';
import New from './pages/New'

function App() {
  return (
    <HashRouter basename=''>
        <NavBar />
        <div className='routes-container'>
          <Routes>
            <Route path="/" element={<Main />} />
            <Route path="/history" element={<History />} />
            <Route path="/character" element={<Character />} />
            <Route path="/family" element={<Family />} />
            <Route path="/new" element={<New />} />
            <Route path="/etc" element={<Etc />} />
            <Route path="/map" element={<Map />} />
            <Route path="/game" element={<Game />} />
          </Routes>
        </div>
    </HashRouter>
  );
}

export default App;