// src/pages/Character.jsx
import React, { useState, useEffect } from 'react';
import app from '../firebaseConfig';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import '../styles/Character.css';

const Character = () => {
  const [characters, setCharacters] = useState([]);
  const [newCharacter, setNewCharacter] = useState({
    birth: '', name: '', family: '', gender: '', unit: '', party: '', detail: ''
  });
  const [editId, setEditId] = useState(null);
  const [editCharacter, setEditCharacter] = useState({});
  const db = getFirestore(app);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "char"), (snapshot) => {
      const characterList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => a.birth - b.birth); // birth 필드를 기준으로 오름차순 정렬
      setCharacters(characterList);
    });
    return () => unsubscribe();
  }, [db]);

  const handleNewCharacterChange = (e) => {
    setNewCharacter({ ...newCharacter, [e.target.name]: e.target.value });
  };

  const handleEditCharacterChange = (e) => {
    setEditCharacter({ ...editCharacter, [e.target.name]: e.target.value });
  };

  const addCharacter = async () => {
    if (newCharacter.name.trim() === '') return;
    try {
      await setDoc(doc(db, "char", newCharacter.name), newCharacter);
      setNewCharacter({ birth: '', name: '', family: '', gender: '', unit: '', party: '', detail: '' });
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const enableEdit = (character) => {
    setEditId(character.id);
    setEditCharacter({ ...character });
  };

  const saveEdit = async () => {
    try {
      await updateDoc(doc(db, "char", editId), editCharacter);
      setEditId(null);
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

  const ToggleDetail = ({ detail }) => {
    const [isOpen, setIsOpen] = useState(false);
  
    const toggleOpen = () => {
      setIsOpen(!isOpen);
    };
  
    return (
      <div onClick={toggleOpen} className="detail">
        {isOpen ? detail : `${detail.substring(0, 30)}...`}
      </div>
    );
  };

  return (
    <div className='char-comp'>
      {/* 입력 필드 추가 */}
      <div childrene='add-inputs'>
        <div className='add-profile'>
          <input type="text" name="birth" value={newCharacter.birth} onChange={handleNewCharacterChange } placeholder="Birth" />
          <input type="text" name="name" value={newCharacter.name} onChange={handleNewCharacterChange } placeholder="Name" />
          <input type="text" name="family" value={newCharacter.family} onChange={handleNewCharacterChange } placeholder="Family" />
          <input type="text" name="gender" value={newCharacter.gender} onChange={handleNewCharacterChange } placeholder="Gender" />
          <input type="text" name="unit" value={newCharacter.unit} onChange={handleNewCharacterChange } placeholder="Unit" />
          <input type="text" name="party" value={newCharacter.party} onChange={handleNewCharacterChange } placeholder="Party" />
        </div>
        <input className='add-detail' type="text" name="detail" value={newCharacter.detail} onChange={handleNewCharacterChange } placeholder="Detail" />
      </div>
      <button onClick={addCharacter}>추가</button>

      <div style={{ height: '700px', width: '1600px', overflowY: 'scroll', margin: '10px auto', padding: '10px', border: '1px solid white', position: 'relative' }}>
      {characters.map((character) => (
          <div className='indexs' key={character.id}>
            {editId === character.id ? (
              <div>
                {/* editCharacter의 각 필드에 대한 입력 필드 */}
                <input type="text" name="birth" value={editCharacter.birth} onChange={handleEditCharacterChange} />
                <input type="text" name="name" value={editCharacter.name} onChange={handleEditCharacterChange} />
                <input type="text" name="family" value={editCharacter.family} onChange={handleEditCharacterChange} />
                <input type="text" name="gender" value={editCharacter.gender} onChange={handleEditCharacterChange} />
                <input type="text" name="unit" value={editCharacter.unit} onChange={handleEditCharacterChange} />
                <input type="text" name="party" value={editCharacter.party} onChange={handleEditCharacterChange} />
                <input type="text" name="detail" value={editCharacter.detail} onChange={handleEditCharacterChange} />
                <button onClick={saveEdit}>저장</button>
              </div>
                ) : (
              <div className='infos'>
                <div className='profile'>
                  <div className='info birth'>{character.birth}</div>
                  <div className='info name'>{character.name}</div>
                  <div className='info fam'>{character.family}</div>
                  <div className='info gen'>{character.gender}</div>
                  <div className='info unit'>{character.unit}</div>
                  <div className='info party'>{character.party}</div>
                  <ToggleDetail detail={character.detail} />
                </div>
                <div className='btn-container'>
                  <button onClick={() => enableEdit(character)}>수정</button>
                  <button onClick={() => deleteCharacter(character.id)}>삭제</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Character;