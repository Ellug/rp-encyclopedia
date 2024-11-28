import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Auth({ setToken }) {
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    if (password === "sksmsQkrQkrdlek") {
      sessionStorage.setItem('token', 'your_token');
      setToken('your_token');
      navigate('/');
    } else {
      alert('잘못된 비밀번호입니다!');
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '70vh',
      fontFamily: 'Arial, sans-serif',
    }}>
      <form onSubmit={handleSubmit} style={{
        backgroundColor: '#ffffff',
        padding: '40px 30px',
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        maxWidth: '300px',
        width: '100%',
        textAlign: 'center',
      }}>
        <h2 style={{
          color: '#333',
          marginBottom: '20px',
          fontSize: '24px',
          fontWeight: 'bold',
        }}>비밀번호를 입력하거라</h2>
        <label style={{ display: 'block', marginBottom: '15px', color: '#555' }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '90%',
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ddd',
              fontSize: '16px',
            }}
            placeholder="탈모탈모빔"
          />
        </label>
        <button type="submit" style={{
          backgroundColor: '#4CAF50',
          color: '#fff',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '16px',
          cursor: 'pointer',
          width: '100%',
        }}>로그인</button>
      </form>
    </div>
  );
}

export default Auth;
