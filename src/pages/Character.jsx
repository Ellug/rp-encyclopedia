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
    weapon: '', hobby: '', talent: '', body: '', country: '', familyRelation: '', goodship: '', badship: ''
  });
  const [editCharacter, setEditCharacter] = useState({});
  const db = getFirestore(app);
  const [showModal, setShowModal] = useState(false);
  const [currentYear, setCurrentYear] = useState('52');

  const [selectedFamily, setSelectedFamily] = useState('');
  const [selectedParty, setSelectedParty] = useState('');

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
      let characterList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (selectedFamily || selectedParty) {
        characterList = characterList.sort((a, b) => {
          if (selectedFamily && (a.family === selectedFamily && b.family !== selectedFamily)) {
            return -1;
          }
          if (selectedFamily && (a.family !== selectedFamily && b.family === selectedFamily)) {
            return 1;
          }
          if (selectedParty && (a.party === selectedParty && b.party !== selectedParty)) {
            return -1;
          }
          if (selectedParty && (a.party !== selectedParty && b.party === selectedParty)) {
            return 1;
          }
          return a.birth - b.birth; // Default sorting by birth
        });
      } else {
        characterList = characterList.sort((a, b) => a.birth - b.birth); // Default sorting by birth
      }
      setCharacters(characterList);
    });
    return () => unsubscribe();
  }, [db, selectedFamily, selectedParty]);

  const handleFamilyClick = (familyName) => {
    setSelectedFamily(familyName);
  };
  const handlePartyClick = (partyName) => {
    setSelectedParty(partyName);
  };


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
        weapon: '', hobby: '', talent: '', body: '', country:'', familyRelation: '', goodship: '', badship: '' });
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
        현재 연도 설정: <input type="number" value={currentYear} onChange={handleYearChange} placeholder="현재 연도" />
      </div>

      <div style={{ height: '700px', width: '1800px', overflowY: 'scroll', margin: '10px auto', padding: '10px', border: '1px solid white', position: 'relative' }}>
      {characters.map((character) => (
          <div className='indexs' key={character.id}>
              <div className='infos'>
                <div className='profile'>
                  <div className='info birth'>
                    {character.birth}</div>
                    <div className='info name' onClick={() => openModal(character)}>
                      {character.name?.substring(0, 6)}{character.name?.length > 6 ? '...' : ''}
                    </div>
                    <div className='info fam' onClick={() => handleFamilyClick(character.family)}>
                      {character.family?.substring(0, 7)}{character.family?.length > 7 ? '...' : ''}
                    </div>
                    <div className='info title'>
                      {character.title?.substring(0, 9)}{character.title?.length > 9 ? '...' : ''}
                    </div>
                  <div className='info age'>
                    {calculateAge(character.birth)}세</div>
                  <div className='info gen'>
                    {character.gender}</div>
                  <div className='info unit'>
                    {character.unit?.substring(0, 5)}{character.unit?.length > 5 ? '...' : ''}
                    </div>
                  <div className='info party' onClick={() => handlePartyClick(character.party)}>
                    {character.party?.substring(0, 10)}{character.party?.length > 10 ? '...' : ''}
                  </div>
                  <div className='info personality'>
                    {character.personality}</div>
                  <div className='info weapon'>
                    {character.weapon?.substring(0, 11)}{character.weapon?.length > 11 ? '...' : ''}
                  </div>
                  <div className='info hobby'>
                    {character.hobby?.substring(0, 6)}{character.hobby?.length > 6 ? '...' : ''}
                  </div>
                  <div className='info talent'>
                    {character.talent?.substring(0, 6)}{character.talent?.length > 6 ? '...' : ''}
                  </div>
                  <div className='info body'>
                    {character.body?.substring(0, 14)}{character.body?.length > 14 ? '...' : ''}
                  </div>
                  <div className='info country'>
                    {character.country?.substring(0, 8)}{character.country?.length > 8 ? '...' : ''}
                  </div>
                </div>
              </div>
          </div>
        ))}
      </div>

       {/* 입력 필드 추가 */}
       <div className='add-inputs'>
        <div className='add-profile'>
          <input type="number" name="birth" value={newCharacter.birth} onChange={handleNewCharacterChange } placeholder="Birth" autoComplete='off'/>
          <input type="text" name="name" value={newCharacter.name} onChange={handleNewCharacterChange } placeholder="Name" autoComplete='off' />
          <input type="text" name="family" value={newCharacter.family} onChange={handleNewCharacterChange } placeholder="Family" autoComplete='off' />
          <input type="text" name="title" value={newCharacter.title} onChange={handleNewCharacterChange } placeholder="title" autoComplete='off' />
          <input type="text" name="gender" value={newCharacter.gender} onChange={handleNewCharacterChange } placeholder="Gender" autoComplete='off' />
          <input type="text" name="unit" value={newCharacter.unit} onChange={handleNewCharacterChange } placeholder="Unit" autoComplete='off' />
          <input type="text" name="party" value={newCharacter.party} onChange={handleNewCharacterChange } placeholder="Party" autoComplete='off' />
          <input type="text" name="personality" value={newCharacter.personality} onChange={handleNewCharacterChange } placeholder="personality" autoComplete='off' />
          <input type="text" name="weapon" value={newCharacter.weapon} onChange={handleNewCharacterChange } placeholder="weapon" autoComplete='off' />
          <input type="text" name="hobby" value={newCharacter.hobby} onChange={handleNewCharacterChange } placeholder="hobby" autoComplete='off' />
          <input type="text" name="talent" value={newCharacter.talent} onChange={handleNewCharacterChange } placeholder="talent" autoComplete='off' />
          <input type="text" name="body" value={newCharacter.body} onChange={handleNewCharacterChange } placeholder="body" autoComplete='off' />
          <input type="text" name="country" value={newCharacter.country} onChange={handleNewCharacterChange } placeholder="country" autoComplete='off' />
        </div>
        <textarea className='add-detail' type="text" name="detail" value={newCharacter.detail} onChange={handleNewCharacterChange } placeholder="Detail" />
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