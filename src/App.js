import React, { useState, useEffect } from 'react';
import './App.css'
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
import New from './pages/New';
import Auth from './Auth';
import MoogoonghwaGame from './pages/MoogoonghwaGame';
import Gallery from './pages/Gallery';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import app from './firebaseConfig';
import AudioLink from './pages/AudioLink';

function App() {
  const [token, setToken] = useState(sessionStorage.getItem('token'));
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        user.getIdToken().then((token) => {
          setToken(token);
          sessionStorage.setItem('token', token);
        });
      } else {
        setToken(null);
        sessionStorage.removeItem('token');
      }
    });
    return () => unsubscribe();
  }, [auth]);

  const requireAuth = (element) => {
    return token ? element : <Navigate to="/auth" />;
  };

  return (
    <HashRouter>
      <NavBar />
      <div className="routes-container">
        <Routes>
          <Route path="/auth" element={<Auth setToken={setToken} />} />
          <Route path="/" element={requireAuth(<Main />)} />
          <Route path="/history" element={requireAuth(<History />)} />
          <Route path="/character" element={requireAuth(<Character />)} />
          <Route path="/gallery" element={requireAuth(<Gallery />)} />
          <Route path="/family" element={requireAuth(<Family />)} />
          <Route path="/new" element={requireAuth(<New />)} />
          <Route path="/audiolink" element={requireAuth(<AudioLink />)} />
          <Route path="/etc" element={requireAuth(<Etc />)} />
          <Route path="/map" element={<Map />} />
          <Route path="/game" element={requireAuth(<Game />)} />
          <Route path="/mafia" element={requireAuth(<Mafia />)} />
          <Route path="/moogoonghwa" element={requireAuth(<MoogoonghwaGame />)} />
        </Routes>
      </div>
    </HashRouter>
  );
}

export default App;
