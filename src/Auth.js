import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import app from './firebaseConfig';

const Auth = ({ setToken }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const auth = getAuth(app);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      sessionStorage.setItem('token', token);
      setToken(token);
      navigate('/');
    } catch (err) {
      setError('로그인 실패! 이메일 또는 비밀번호를 확인하세요.');
    }
  };

  return (
    <div className="flex items-center justify-center h-[70vh]">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-200 p-6 rounded-lg shadow-md w-full max-w-sm text-center"
      >
        <h2 className="text-2xl font-bold text-gray-700 mb-4">로그인</h2>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <div className="mb-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
            placeholder="이메일 입력"
          />
        </div>
        <div className="mb-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
            placeholder="비밀번호 입력"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-gray-400 text-white py-2 rounded-md hover:bg-yellow-500 transition-all"
        >
          로그인
        </button>
      </form>
    </div>
  );
};

export default Auth;