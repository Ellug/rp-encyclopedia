import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import database from '../firebaseConfig.js';
import { getFirestore, collection, doc, setDoc, getDocs, getDoc } from 'firebase/firestore';
import '../styles/Characters.css';
import NewDetailModal from '../components/NewDetailModal.jsx'
import Spinner from '../components/Spinner.jsx'

const Character = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [characters, setCharacters] = useState([]);
  const [newCharacter, setNewCharacter] = useState({
    birth: '', name: '', family: '', title: '', gender: '', unit: '', party: '', personality: '', detail: '',
    weapon: '', skill: '', hobby: '', talent: '', body: '', country: '', familyRelation: '',
    marriage: '', brother: '', parent: '', child: '', Images: '', voice: '', series: '',
  });
  const db = getFirestore(database);
  const [showModal, setShowModal] = useState(false);
  const [currentYear, setCurrentYear] = useState('52');
  const [currentCharacter, setCurrentCharacter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  

  // 캐릭터 데이터 불러오기
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "characters"));
      const serverCharacterList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCharacters(serverCharacterList);
    } catch (error) {
      console.error("Error loading data: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortedCharacters = useMemo(() => {
    const sorted = [...characters];
    sorted.sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.birth - b.birth;
      } else {
        return b.birth - a.birth;
      }
    });
    return sorted;
  }, [characters, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc');
  };
    
  
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleNewCharacterChange = (e) => {
    setNewCharacter({ ...newCharacter, [e.target.name]: e.target.value });
  };

  const openModal = async (characterId) => {
    const docRef = doc(db, "character_details", characterId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setCurrentCharacter({ id: characterId, ...docSnap.data() });
      setShowModal(true);
    } else {
      console.error("No such character details!");
      alert('없는데 걔?')
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };


  
  // 캐릭터 추가
  const characterRefs = useRef({});
  const addCharacter = async () => {
    if (newCharacter.name.trim() === '') return;

    // 캐릭터 목록에서 동일한 이름과 가문을 가진 캐릭터 검사
    const isDuplicate = characters.some(character =>
      character.name === newCharacter.name && character.family === newCharacter.family);

    if (isDuplicate) {
      alert("동일한 이름과 가문을 가진 캐릭터가 이미 존재합니다.");
      // 해당 캐릭터 위치로 스크롤
      const duplicateCharacterRef = characterRefs.current[`${newCharacter.name}-${newCharacter.family}`];
      if (duplicateCharacterRef) {
        duplicateCharacterRef.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    const docId = `${newCharacter.name} ${newCharacter.family.trim() || 'Unknown'}`;
    const characterData = {
      birth: newCharacter.birth.trim() || '',
      name: newCharacter.name.trim(),
      family: newCharacter.family.trim() || '',
      title: newCharacter.title.trim() || '',
      gender: newCharacter.gender.trim() || '',
      unit: newCharacter.unit.trim() || '',
      party: newCharacter.party.trim() || '',
      skill: newCharacter.skill.trim() || '',
      body: newCharacter.body.trim() || '',
    };
    const detailData = {
      birth: newCharacter.birth.trim() || '',
      name: newCharacter.name.trim(),
      family: newCharacter.family.trim() || '',
      title: newCharacter.title.trim() || '',
      gender: newCharacter.gender.trim() || '',
      unit: newCharacter.unit.trim() || '',
      party: newCharacter.party.trim() || '',
      country: newCharacter.country.trim() || '',
      detail: newCharacter.detail.trim() || '',
      personality: newCharacter.personality.trim() || '',
      weapon: newCharacter.weapon.trim() || '',
      skill: newCharacter.skill.trim() || '',
      hobby: newCharacter.hobby.trim() || '',
      talent: newCharacter.talent.trim() || '',
      body: newCharacter.body.trim() || '',
      familyRelation: newCharacter.familyRelation.trim() || '',
      marriage: newCharacter.marriage.trim() || '',
      parent: newCharacter.parent.trim() || '',
      child: newCharacter.child.trim() || '',
      brother: newCharacter.brother.trim() || '',
      voice: newCharacter.voice.trim() || '',
      series: newCharacter.voice.trim() || '',
      Images: newCharacter.Images.trim() || '',
    };

    try {
      await setDoc(doc(db, "characters", docId), characterData);
      await setDoc(doc(db, "character_details", docId), detailData);
      setNewCharacter({
        birth: '', name: '', family: '', title: '', gender: '', unit: '', party: '', personality: '', detail: '',
        weapon: '', skill: '', hobby: '', talent: '', body: '', country: '', familyRelation: '',
        marriage: '', parent: '', child: '', brother: '', Images: '', voice: '', series: '',
      });
    } catch (error) {
      console.error("Error adding document: ", error);
    } finally {
      fetchData()
    }
  };

  // 연도 설정 나이 계산  
  const handleYearChange = (e) => {
    setCurrentYear(e.target.value);
  };
  const calculateAge = useCallback((birthYear) => {
  return currentYear - birthYear;
  }, [currentYear]);
  
  const DetailModalMemo = React.memo(NewDetailModal);

  const characterListTable = useMemo(() => (
    <table className='character-table'>
      <thead>
        <tr>
          <th>출생</th>
          <th>이름</th>
          <th>성(가문)</th>
          <th>칭호</th>
          <th>나이</th>
          <th>성별</th>
          <th>유닛</th>
          <th>소속</th>
          <th>스킬</th>
          <th>신체</th>
        </tr>
      </thead>
      <tbody>
        {sortedCharacters.map(character => (
          <tr key={character.id} className='tableline' onClick={() => openModal(character.id)}>
            <td>{character.birth}</td>
            <td>{character.name}</td>
            <td>{character.family}</td>
            <td>{character.title}</td>
            <td>{calculateAge(character.birth) + '세'}</td>
            <td>{character.gender}</td>
            <td>{character.unit}</td>
            <td>{character.party}</td>
            <td>{character.skill}</td>
            <td>{character.body}</td>
          </tr>
        ))}
      </tbody>
    </table>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [sortedCharacters, calculateAge]);
  
  return (
    <div className='characters'>
      {isLoading && <Spinner />}
      <div className='search'>
        <button onClick={toggleSortOrder}>
            {sortOrder.toUpperCase()}
        </button>
        현재 연도 설정: <input type="number" value={currentYear} onChange={handleYearChange} placeholder="현재 연도" />
        검색: <input type='text' placeholder='search' value={searchTerm} onChange={handleSearchChange} />
      </div>

      {isLoading ? <p>Loading characters...</p> : null}
      <div className='ListTable'>
        {characterListTable}
      </div>

       {/* 추가 입력 필드 */}
       <div className='add-inputs'>
        <input type="number" name="birth" value={newCharacter.birth} onChange={handleNewCharacterChange } placeholder="Birth" autoComplete='off'/>
        <input type="text" name="name" value={newCharacter.name} onChange={handleNewCharacterChange } placeholder="Name" autoComplete='off' />
        <input type="text" name="family" value={newCharacter.family} onChange={handleNewCharacterChange } placeholder="Family" autoComplete='off' />
        <input type="text" name="title" value={newCharacter.title} onChange={handleNewCharacterChange } placeholder="title" autoComplete='off' />
        <input type="text" name="gender" value={newCharacter.gender} onChange={handleNewCharacterChange } placeholder="Gender" autoComplete='off' />
        <input type="text" name="unit" value={newCharacter.unit} onChange={handleNewCharacterChange } placeholder="Unit" autoComplete='off' />
        <input type="text" name="party" value={newCharacter.party} onChange={handleNewCharacterChange } placeholder="Party" autoComplete='off' />
        <input type="text" name="skill" value={newCharacter.skill} onChange={handleNewCharacterChange } placeholder="skill" autoComplete='off' />
        <input type="text" name="body" value={newCharacter.body} onChange={handleNewCharacterChange } placeholder="body" autoComplete='off' />
      </div>
      <button className='comBTN' onClick={addCharacter} disabled={!newCharacter.name}>추가</button>

      {showModal ? (
        <DetailModalMemo
          onClose={closeModal}
          nowYear={currentYear}
          openModal={openModal}
          character={currentCharacter}
        />
      ) : null}

    </div>
  );
};

export default Character