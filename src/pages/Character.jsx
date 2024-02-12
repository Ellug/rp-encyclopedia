// src/pages/Character.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import app from '../firebaseConfig';
import { getFirestore, collection, doc, setDoc, deleteDoc, getDoc, getDocs } from 'firebase/firestore';
import '../styles/Character.css';
import DetailModal from '../components/DetailModal.jsx';
import Spinner from '../components/Spinner.jsx'

const Character = () => {
  const [characters, setCharacters] = useState([]);
  const [newCharacter, setNewCharacter] = useState({
    birth: '', name: '', family: '', title: '', gender: '', unit: '', party: '', personality: '', detail: '',
    weapon: '', skill: '', hobby: '', talent: '', body: '', country: '', familyRelation: '', goodship: '', badship: '',
    marriage: '', brother: '', parent: '', child: '', Images: '',
  });
  const [editCharacter, setEditCharacter] = useState({});
  const db = getFirestore(app);
  const [showModal, setShowModal] = useState(false);
  const [currentYear, setCurrentYear] = useState('52');

  const [selectedFamily, setSelectedFamily] = useState('');
  const [selectedParty, setSelectedParty] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // 모달 열기
  const openModal = useCallback(async (character) => {
    // 서버에서 캐릭터 데이터 가져오기
    const docRef = doc(db, "char", character.id);
    const docSnap = await getDoc(docRef);
  
    if (docSnap.exists()) {
      const serverCharacterData = { id: character.id, ...docSnap.data() };
      setEditCharacter(serverCharacterData);
      setShowModal(true);
    }
  }, [db]);
  
  // 모달 닫기
  const closeModal = () => {
    setShowModal(false);
  };
  

  const [isLoading, setIsLoading] = useState(false);
  
  const fetchData = async () => {
    if (isLoading) return;
    setIsLoading(true);
    console.log('on load')

    try {
      const querySnapshot = await getDocs(collection(db, "char"));
      const serverCharacterList = querySnapshot.docs.map(doc => {
        const { detail, images, ...data } = doc.data();
        return { id: doc.id, ...data };
      });

      localStorage.setItem('characters', JSON.stringify(serverCharacterList));
    } catch (error) {
      console.error("Error loading data: ", error);
    } finally {
      setIsLoading(false);
      console.log('off load')
    }
  };

  useEffect(() => {  
    fetchData();
  }, []);

  useEffect(() => {
    const applyFiltersAndSorting = (characterList) => {
      // 검색어에 따른 필터링
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
    };
  
    const cachedData = localStorage.getItem('characters');
    if (cachedData) {
      const characterList = JSON.parse(cachedData);
      applyFiltersAndSorting(characterList);
    }
  }, [searchTerm, selectedFamily, selectedParty]); // 의존성 배열에 필터링 및 정렬 관련 변수들 포함
  

  const handleFamilyClick = useCallback((familyName) => {
    setSelectedFamily(familyName);
  }, []);
  
  const handlePartyClick = useCallback((partyName) => {
    setSelectedParty(partyName);
  }, []);
  
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  // 하이라이트 처리 함수
  const highlightText = useCallback((text, highlight) => {
    if (!highlight.trim() || !text) {
      return text;
    }
    const regex = new RegExp(`(${highlight})`, 'gi');
    return text.replace(regex, '<span style="color: rgb(230, 230, 88);">$1</span>');
  }, []);


  const handleNewCharacterChange = (e) => {
    setNewCharacter({ ...newCharacter, [e.target.name]: e.target.value });
  };

  const characterRefs = useRef({});
  // 캐릭터 추가
  const addCharacter = async () => {
    if (newCharacter.name.trim() === '') return;

    // 캐릭터 목록에서 동일한 name과 family를 가진 캐릭터 검사
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
    
    const docId = `${newCharacter.name} ${newCharacter.family}`
    try {
      await setDoc(doc(db, "char", docId), newCharacter);
      setNewCharacter({ 
        birth: '', name: '', family: '', title: '', gender: '', unit: '', party: '', personality: '', detail: '',
        weapon: '', skill: '', hobby: '', talent: '', body: '', country:'', familyRelation: '', goodship: '', badship: '',
        marriage: '', parent: '', child: '', brother: '', Images: '' });
    } catch (error) {
      console.error("Error adding document: ", error);
    } finally {
      fetchData()
    }
  };

  const deleteCharacter = async (id) => {
    if (!id) {
      console.error("Invalid or missing document ID");
      return;
    }
  
    try {
      await deleteDoc(doc(db, "char", id));
    } catch (error) {
      console.error("Error deleting document: ", error);
    } finally {
      closeModal();
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
  

  const DetailModalMemo = React.memo(DetailModal);
  // 관계 업데이트 후 상태를 업데이트하는 함수
  const updateCharactersState = (updatedCharacter) => {
    setCharacters(prevCharacters => 
      prevCharacters.map(character => 
        character.id === updatedCharacter.id ? updatedCharacter : character
      )
    );
  };

  const characterListUI = useMemo(() => 
    characters.map((character) => (
      <div className='indexs' key={character.id}
      ref={el => characterRefs.current[`${character.name}-${character.family}`] = el}>
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
    )),
    [characters, searchTerm, openModal, highlightText, calculateAge, handleFamilyClick, handlePartyClick]
  );

  
  return (
    <div className='char-comp'>
      {isLoading && <Spinner />}
      <div className='search'>
        현재 연도 설정: <input type="number" value={currentYear} onChange={handleYearChange} placeholder="현재 연도" />
        검색: <input type='text' placeholder='search' value={searchTerm} onChange={handleSearchChange} />
      </div>

        <div className='index-fixed'>
          <div className='indexs'>
            <div className='infos'>
              <div className='profile'>
                <div className='info birth'>출생</div>
                <div className='info name'>이름</div>
                <div className='info fam'>성(가문)</div>
                <div className='info title'>칭호</div>
                <div className='info age'>나이</div>
                <div className='info gen'>성</div>
                <div className='info unit'>유닛</div>
                <div className='info party'>소속</div>
                <div className='info personality'>성향</div>
                <div className='info weapon'>무기</div>
                <div className='info skill'>기술</div>
                <div className='info hobby'>취미</div>
                <div className='info talent'>특기</div>
                <div className='info body'>신체</div>
                <div className='info country'>출신</div>
              </div>
            </div>
          </div>
        </div>
        {isLoading ? <p>Loading characters... 너무 오래 걸리면 새로고침</p> : null}
      <div style={{ height: '600px', width: '1800px', overflowY: 'scroll', margin: '10px auto', padding: '10px', border: '1px solid white', position: 'relative' }}>
        {characterListUI}
      </div>

       {/* 추가 입력 필드 */}
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
      {showModal ? (
        <DetailModalMemo
          character={editCharacter}
          onClose={closeModal}
          onDelete={deleteCharacter}
          nowYear={currentYear}
          openModal={openModal}
          characters={characters}
          onUpdate={updateCharactersState}
        />
      ) : null}

    </div>
  );
};

export default Character