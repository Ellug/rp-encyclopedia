// src/pages/Character.jsx
import React, { useState, useEffect } from 'react';
import app from '../firebaseConfig';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import '../styles/Character.css';
import DetailModal from '../components/DetailModal';

const Character = () => {
  const [characters, setCharacters] = useState([]);
  const [newCharacter, setNewCharacter] = useState({
    birth: '', name: '', family: '', title: '', gender: '', unit: '', party: '', personality: '', detail: '',
    weapon: '', hobby: '', talent: '', body: '', country: '',
  });
  const [editCharacter, setEditCharacter] = useState({});
  const db = getFirestore(app);
  const [showModal, setShowModal] = useState(false);
  const [currentYear, setCurrentYear] = useState('52');

  // 모달 열기
  const openModal = (character) => {
    setEditCharacter(character);
    setShowModal(true);
  };

  // 모달 닫기
  const closeModal = () => {
    setShowModal(false);
  };


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

  const addCharacter = async () => {
    if (newCharacter.name.trim() === '') return;
    const docId = `${newCharacter.name} ${newCharacter.family}`
    try {
      await setDoc(doc(db, "char", docId), newCharacter);
      setNewCharacter({ 
        birth: '', name: '', family: '', title: '', gender: '', unit: '', party: '', personality: '', detail: '',
        weapon: '', hobby: '', talent: '', body: '', country:'', });
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const deleteCharacter = async (id) => {
    try {
      await deleteDoc(doc(db, "char", id));
      closeModal()
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  const handleYearChange = (e) => {
    setCurrentYear(e.target.value);
  };

  // 나이 계산 함수
  const calculateAge = (birthYear) => {
    return currentYear - birthYear;
  };

  
  return (
    <div className='char-comp'>
      {/* 연도 입력 필드 */}
      <div>
        <input type="number" value={currentYear} onChange={handleYearChange} placeholder="현재 연도" />
      </div>

      <div style={{ height: '700px', width: '1750px', overflowY: 'scroll', margin: '10px auto', padding: '10px', border: '1px solid white', position: 'relative' }}>
      {characters.map((character) => (
          <div className='indexs' key={character.id}>
              <div className='infos'>
                <div className='profile'>
                  <div className='info birth'>{character.birth}</div>
                  <div className='info name'>{character.name}</div>
                  <div className='info fam'>{character.family}</div>
                  <div className='info title'>{character.title}</div>
                  <div className='info age'>{calculateAge(character.birth)}세</div>
                  <div className='info gen'>{character.gender}</div>
                  <div className='info unit'>{character.unit}</div>
                  <div className='info party'>{character.party}</div>
                  <div className='info personality'>{character.personality}</div>
                  <div className='info weapon'>{character.weapon}</div>
                  <div className='info hobby'>{character.hobby}</div>
                  <div className='info talent'>{character.talent}</div>
                  <div className='info body'>{character.body}</div>
                  <div className='info country'>{character.country}</div>
                </div>
                <div className='btn-container'>
                  <button onClick={() => openModal(character)}>상세 정보</button>
                </div>
              </div>
          </div>
        ))}
      </div>

       {/* 입력 필드 추가 */}
       <div className='add-inputs'>
        <div className='add-profile'>
          <input type="text" name="birth" value={newCharacter.birth} onChange={handleNewCharacterChange } placeholder="Birth" />
          <input type="text" name="name" value={newCharacter.name} onChange={handleNewCharacterChange } placeholder="Name" />
          <input type="text" name="family" value={newCharacter.family} onChange={handleNewCharacterChange } placeholder="Family" />
          <input type="text" name="title" value={newCharacter.title} onChange={handleNewCharacterChange } placeholder="title" />
          <input type="text" name="gender" value={newCharacter.gender} onChange={handleNewCharacterChange } placeholder="Gender" />
          <input type="text" name="unit" value={newCharacter.unit} onChange={handleNewCharacterChange } placeholder="Unit" />
          <input type="text" name="party" value={newCharacter.party} onChange={handleNewCharacterChange } placeholder="Party" />
          <input type="text" name="personality" value={newCharacter.personality} onChange={handleNewCharacterChange } placeholder="personality" />
          <input type="text" name="weapon" value={newCharacter.weapon} onChange={handleNewCharacterChange } placeholder="weapon" />
          <input type="text" name="hobby" value={newCharacter.hobby} onChange={handleNewCharacterChange } placeholder="hobby" />
          <input type="text" name="talent" value={newCharacter.talent} onChange={handleNewCharacterChange } placeholder="talent" />
          <input type="text" name="body" value={newCharacter.body} onChange={handleNewCharacterChange } placeholder="body" />
          <input type="text" name="country" value={newCharacter.country} onChange={handleNewCharacterChange } placeholder="country" />
        </div>
        <input className='add-detail' type="text" name="detail" value={newCharacter.detail} onChange={handleNewCharacterChange } placeholder="Detail" />
      </div>
      <button onClick={addCharacter}>추가</button>

       {/* 모달 */}
       {showModal && (
        <DetailModal
          character={editCharacter}
          onClose={closeModal}
          onDelete={deleteCharacter}
          nowYear={currentYear}
        />
      )}

    </div>
  );
};

export default Character;