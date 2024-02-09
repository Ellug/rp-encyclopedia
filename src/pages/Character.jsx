// src/pages/Character.jsx
import React, { useState, useEffect } from 'react';
import app from '../firebaseConfig';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, getDoc } from 'firebase/firestore';
import '../styles/Character.css';
import DetailModal from '../components/DetailModal.jsx';

const Character = () => {
  const [characters, setCharacters] = useState([]);
  const [newCharacter, setNewCharacter] = useState({
    birth: '', name: '', family: '', title: '', gender: '', unit: '', party: '', personality: '', detail: '',
    weapon: '', skill: '', hobby: '', talent: '', body: '', country: '', familyRelation: '', goodship: '', badship: '',
    marriage: '', brother: '', parent: '', child: '', 
  });
  const [editCharacter, setEditCharacter] = useState({});
  const db = getFirestore(app);
  const [showModal, setShowModal] = useState(false);
  const [currentYear, setCurrentYear] = useState('52');

  const [selectedFamily, setSelectedFamily] = useState('');
  const [selectedParty, setSelectedParty] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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
  
      // 검색어에 따른 필터링 (detail, badship, body 필드 제외)
      if (searchTerm) {
        characterList = characterList.filter(character =>
          Object.entries(character).some(([key, value]) =>
            !['detail', 'badship', 'body'].includes(key) && 
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
      }
  
      // 선택된 가족 또는 파티에 따른 정렬
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
        return a.birth - b.birth; // 기본 정렬은 생년월일에 따라
      });
  
      setCharacters(characterList);
    });
    return () => unsubscribe();
  }, [db, searchTerm, selectedFamily, selectedParty]);
  


  const handleFamilyClick = (familyName) => {
    setSelectedFamily(familyName);
  };
  const handlePartyClick = (partyName) => {
    setSelectedParty(partyName);
  };
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  // 하이라이트 처리 함수
  const highlightText = (text, highlight) => {
    if (!highlight.trim() || !text) {
      return text;
    }
    const regex = new RegExp(`(${highlight})`, 'gi');
    return text.replace(regex, '<span style="color: rgb(230, 230, 88);">$1</span>');
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
        weapon: '', skill: '', hobby: '', talent: '', body: '', country:'', familyRelation: '', goodship: '', badship: '',
        marriage: '', parent: '', child: '', brother: '', });
    } catch (error) {
      console.error("Error adding document: ", error);
    }
    // 관계 업데이트 호출
    await updateCharacterRelations(newCharacter, 'familyRelation');
    await updateCharacterRelations(newCharacter, 'marriage');
    await updateCharacterRelations(newCharacter, 'brother');
    await updateCharacterRelations(newCharacter, 'goodship');
    await updateCharacterRelations(newCharacter, 'badship');
  };

  const deleteCharacter = async (id) => {
    await removeCharacterFromRelations(id);
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


  // 캐릭터 관계 업데이트 함수
  const updateCharacterRelations = async (character, relationField, isRemoval = false) => {
    const relatedCharacters = character[relationField].split(',').map(name => name.trim());

    for (const relatedName of relatedCharacters) {
      const [firstName, lastName] = relatedName.split(' ');
      const relatedDocId = `${firstName} ${lastName}`;
      const relatedDocRef = doc(db, "char", relatedDocId);

      const relatedDoc = await getDoc(relatedDocRef);
      if (relatedDoc.exists()) {
        const relatedData = relatedDoc.data();
        let updatedRelation;
        if (isRemoval) {
          // 캐릭터 제거 시
          updatedRelation = relatedData[relationField].split(',').filter(name => name.trim() !== `${character.name} ${character.family}`).join(', ');
        } else {
          // 캐릭터 추가 시
          const existingRelations = relatedData[relationField] ? relatedData[relationField].split(',').map(name => name.trim()) : [];
          if (!existingRelations.includes(`${character.name} ${character.family}`)) {
            existingRelations.push(`${character.name} ${character.family}`);
          } else if (!existingRelations.includes(`${character.name}`)) {
            existingRelations.push(`${character.name}`)
          }
          updatedRelation = existingRelations.join(', ');
        }
        await setDoc(relatedDocRef, { ...relatedData, [relationField]: updatedRelation });
      }
    }
  };
   // 캐릭터 삭제 시 관계 제거 함수
   const removeCharacterFromRelations = async (characterId) => {
    const characterRef = doc(db, "char", characterId);
    const characterDoc = await getDoc(characterRef);
    if (characterDoc.exists()) {
      const characterData = characterDoc.data();

      await updateCharacterRelations(characterData, 'familyRelation', true);
      await updateCharacterRelations(characterData, 'marriage', true);
      await updateCharacterRelations(characterData, 'brother', true);
      await updateCharacterRelations(characterData, 'goodship', true);
      await updateCharacterRelations(characterData, 'badship', true);
    }
  };



  // 나이 계산 함수
  const calculateAge = (birthYear) => {
    return currentYear - birthYear;
  };
  
  return (
    <div className='char-comp'>
      <div className='search'>
        현재 연도 설정: <input type="number" value={currentYear} onChange={handleYearChange} placeholder="현재 연도" />
        검색: <input type='text' placeholder='search' value={searchTerm} onChange={handleSearchChange} />
      </div>

      <div style={{ height: '700px', width: '1800px', overflowY: 'scroll', margin: '10px auto', padding: '10px', border: '1px solid white', position: 'relative' }}>
        {characters.map((character) => (
          <div className='indexs' key={character.id}>
            <div className='infos'>
              <div className='profile'>
                {/* birth 필드 */}
                <div className='info birth'>
                  <span dangerouslySetInnerHTML={{ __html: highlightText(character.birth, searchTerm) }}></span>
                </div>
                {/* name 필드 */}
                <div className='info name' onClick={() => openModal(character)}>
                  <span dangerouslySetInnerHTML={{ __html: highlightText(character.name?.substring(0, 6), searchTerm) }}></span>{character.name?.length > 6 ? '...' : ''}
                </div>
                {/* family 필드 */}
                <div className='info fam' onClick={() => handleFamilyClick(character.family)}>
                  <span dangerouslySetInnerHTML={{ __html: highlightText(character.family?.substring(0, 7), searchTerm) }}></span>{character.family?.length > 7 ? '...' : ''}
                </div>
                {/* title 필드 */}
                <div className='info title'>
                  <span dangerouslySetInnerHTML={{ __html: highlightText(character.title?.substring(0, 10), searchTerm) }}></span>{character.title?.length > 10 ? '...' : ''}
                </div>
                {/* age 필드 */}
                <div className='info age'>
                  <span dangerouslySetInnerHTML={{ __html: highlightText(String(calculateAge(character.birth)) + '세', searchTerm) }}></span>
                </div>
                {/* gender 필드 */}
                <div className='info gen'>
                  <span dangerouslySetInnerHTML={{ __html: highlightText(character.gender, searchTerm) }}></span>
                </div>
                {/* unit 필드 */}
                <div className='info unit'>
                  <span dangerouslySetInnerHTML={{ __html: highlightText(character.unit?.substring(0, 5), searchTerm) }}></span>{character.unit?.length > 5 ? '...' : ''}
                </div>
                {/* party 필드 */}
                <div className='info party' onClick={() => handlePartyClick(character.party)}>
                  <span dangerouslySetInnerHTML={{ __html: highlightText(character.party?.substring(0, 10), searchTerm) }}></span>{character.party?.length > 10 ? '...' : ''}
                </div>
                {/* personality 필드 */}
                <div className='info personality'>
                  <span dangerouslySetInnerHTML={{ __html: highlightText(character.personality, searchTerm) }}></span>
                </div>
                {/* weapon 필드 */}
                <div className='info weapon'>
                  <span dangerouslySetInnerHTML={{ __html: highlightText(character.weapon?.substring(0, 11), searchTerm) }}></span>{character.weapon?.length > 11 ? '...' : ''}
                </div>
                {/* skill 필드 */}
                <div className='info skill'>
                  <span dangerouslySetInnerHTML={{ __html: highlightText(character.skill?.substring(0, 11), searchTerm) }}></span>{character.skill?.length > 11 ? '...' : ''}
                </div>
                {/* hobby 필드 */}
                <div className='info hobby'>
                  <span dangerouslySetInnerHTML={{ __html: highlightText(character.hobby?.substring(0, 6), searchTerm) }}></span>{character.hobby?.length > 6 ? '...' : ''}
                </div>
                {/* talent 필드 */}
                <div className='info talent'>
                  <span dangerouslySetInnerHTML={{ __html: highlightText(character.talent?.substring(0, 6), searchTerm) }}></span>{character.talent?.length > 6 ? '...' : ''}
                </div>
                {/* body 필드 */}
                <div className='info body'>
                  {character.body?.substring(0, 14)}{character.body?.length > 14 ? '...' : ''}
                </div>
                {/* country 필드 */}
                <div className='info country'>
                  <span dangerouslySetInnerHTML={{ __html: highlightText(character.country?.substring(0, 8), searchTerm) }}></span>{character.country?.length > 8 ? '...' : ''}
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
          <input type="text" name="skill" value={newCharacter.skill} onChange={handleNewCharacterChange } placeholder="skill" autoComplete='off' />
          <input type="text" name="hobby" value={newCharacter.hobby} onChange={handleNewCharacterChange } placeholder="hobby" autoComplete='off' />
          <input type="text" name="talent" value={newCharacter.talent} onChange={handleNewCharacterChange } placeholder="talent" autoComplete='off' />
          <input type="text" name="body" value={newCharacter.body} onChange={handleNewCharacterChange } placeholder="body" autoComplete='off' />
          <input type="text" name="country" value={newCharacter.country} onChange={handleNewCharacterChange } placeholder="country" autoComplete='off' />
        </div>
        <textarea className='add-detail' type="text" name="detail" value={newCharacter.detail} onChange={handleNewCharacterChange } placeholder="Detail" />
      </div>
      <button onClick={addCharacter} disabled={!newCharacter.name}>추가</button>

       {/* 모달 */}
       {showModal && (
        <DetailModal
          character={editCharacter}
          onClose={closeModal}
          onDelete={deleteCharacter}
          nowYear={currentYear}
          openModal={openModal}
          characters={characters}
        />
      )}

    </div>
  );
};

export default Character