import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Auth({ setToken }) {
  const [password, setPassword] = useState('');
  const navigate = useNavigate()

  const handleSubmit = (event) => {
    event.preventDefault();
    if (password === "sksmsQkrQkrdlek") {
      sessionStorage.setItem('token', 'your_token');
      setToken('your_token');
      navigate('/')
    } else {
      alert('잘못된 비밀번호입니다!');
    }
  };

  return (
    <div style={{ textAlign: 'center', paddingTop: 40 }}>
      <form onSubmit={handleSubmit}>
        <label>
          비밀번호 입력:
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button type="submit">로그인</button>
      </form>
    </div>
  );
}

export default Auth;
