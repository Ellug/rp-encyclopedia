// src/pages/Character.jsx
import React, { useState, useEffect } from 'react';
import app from '../firebaseConfig'; // Firebase 앱 인스턴스를 가져옵니다.
import { getFirestore, collection, setDoc, doc, deleteDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import '../styles/Character.css';

const Character = () => {
  const [characters, setCharacters] = useState([]);
  const [newCharacterTitle, setNewCharacterTitle] = useState('');
  const [edit, setEdit] = useState(null); // 현재 편집중인 캐릭터 ID
  const [editTitle, setEditTitle] = useState(''); // 편집중인 캐릭터의 새로운 이름
  const db = getFirestore(app);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "char"), (snapshot) => {
      const characterList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCharacters(characterList);
    });

    return () => unsubscribe();
  }, [db]);

  const addCharacter = async () => {
    if (newCharacterTitle.trim() === '') return;
    try {
      await setDoc(doc(db, "char", newCharacterTitle), { title: newCharacterTitle });
      setNewCharacterTitle('');
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const enableEdit = (character) => {
    setEdit(character.id);
    setEditTitle(character.title);
  };

  const saveEdit = async (id) => {
    if (editTitle.trim() === '') return;
    try {
      await updateDoc(doc(db, "char", id), { title: editTitle });
      setEdit(null);
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  const deleteCharacter = async (id) => {
    try {
      await deleteDoc(doc(db, "char", id));
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  return (
    <div className='char-comp'>
      <input
        type="text"
        value={newCharacterTitle}
        onChange={(e) => setNewCharacterTitle(e.target.value)}
        placeholder="캐릭터 이름 입력"
      />
      <button onClick={addCharacter}>추가</button>
      <div style={{ height: '700px', width: '1600px', overflowY: 'scroll', margin: '10px auto', padding: '10px', border: '1px solid white', position: 'relative' }}>
        {characters.map((character) => (
          <div className='indexs' key={character.id}>
            {edit === character.id ? (
              <>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
                <button onClick={() => saveEdit(character.id)}>저장</button>
              </>
            ) : (
              <>
                {character.title}
                <div className='btn-container'>
                  <button onClick={() => enableEdit(character)}>수정</button>
                  <button onClick={() => deleteCharacter(character.id)}>삭제</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Character;
