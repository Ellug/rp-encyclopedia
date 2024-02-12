// src/components/DetailModal.jsx
import React, { useState, useEffect } from 'react';
import { deleteDoc, setDoc, doc, getDoc, /* getDocs, query, where, collection */ } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import '../styles/DetailModal.css';
import FamilyMapModal from './FamilyMapModal';
import ImageUpload from './ImageUpload';

const DetailModal = ({ character, onClose, onDelete, nowYear, openModal, characters, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const db = getFirestore();
  const originalDocId = `${character.name} ${character.family}`;

  // 새로운 상태 추가: 검색 텍스트와 검색 결과
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  // 현재 활성화된 입력 필드를 추적하는 상태
  const [activeField, setActiveField] = useState('');
  const [images, setImages] = useState(character.images || []);

  
  const createDefaultCharacter = (characterData) => {
    const fields = 
      ['birth', 'name', 'family', 'title', 'gender', 'unit', 'party', 'personality', 'weapon', 'skill',
      'hobby', 'talent', 'body', 'country', 'familyRelation', 'goodship', 'badship', 'detail',
      'marriage', 'parent', 'child', 'brother', 'Images'];
    const defaultCharacter = {};
    fields.forEach(field => {
      defaultCharacter[field] = characterData[field] || ''; // 존재하지 않는 필드는 빈 문자열로 설정
    });
    return defaultCharacter;
  };

  const [editCharacter, setEditCharacter] = useState(createDefaultCharacter(character));

  useEffect(() => {
    setEditCharacter(createDefaultCharacter(character));
  }, [character]);

  const handleEditChange = (e) => {
    setEditCharacter({ ...editCharacter, [e.target.name]: e.target.value });
  };

  const saveEdit = async () => {
    const newDocId = editCharacter.family ? `${editCharacter.name} ${editCharacter.family}` : editCharacter.name;
    const newDocRef = doc(db, "char", newDocId);
    const updatedData = {
      ...editCharacter,
      images: images // 이미지 정보 포함
    };
  
    try {
      // 새로운 문서 식별자로 문서를 생성
      await setDoc(newDocRef, updatedData);
  
      // 기존 문서 식별자와 새 문서 식별자가 다르면 기존 문서 삭제
      if (originalDocId !== newDocId) {
        const originalDocRef = doc(db, "char", originalDocId);
        await deleteDoc(originalDocRef);
      }
      // 관련 캐릭터의 정보 업데이트
      if (character) { // character 객체가 유효한 경우에만 호출
        await updateRelatedCharacters(character, editCharacter);
      }
      if (onUpdate) {
        onUpdate(updatedData);
      }
      setIsEditing(false);
      onClose();
    } catch (error) {
      console.error("Error saving document: ", error);
    }
  };

  const cancelEdit = () => {
    setEditCharacter(character);
    setIsEditing(false);
  };

  const confirmDeletion = () => {
    if(window.confirm("정말로 삭제하시겠습니까?")) {
      console.log("Deleting character with ID:", character.id); // 디버깅을 위한 로그
      onDelete(character.id);
    }
  };


  const calculateAge = (birthYear) => nowYear - birthYear;

  const createMarkup = (text) => {
    // text가 undefined이면 빈 문자열로 대체
    if (text === undefined) {
      text = '';
    }
    return { __html: text.replace(/\n/g, '<br />') };
  };

  
  // 클릭 이벤트 핸들러
  const handleRelationClick = (e) => {
    const clickedName = e.target.dataset.name;
    const foundCharacter = characters.find(char => {
      // 성과 이름이 모두 있는 경우
      if (char.family) {
        return `${char.name} ${char.family}` === clickedName;
      }
      // 오직 이름만 있는 경우
      return char.name === clickedName;
    });
  
    if (foundCharacter) {
      // 현재 모달 닫기
      onClose();
  
      // 약간의 딜레이 후 새 캐릭터의 모달 열기
      setTimeout(() => {
      openModal(foundCharacter);
      }, 100); // 100밀리초 딜레이
    }
  };


  const updateRelatedCharacters = async (originalCharacter, updatedCharacter) => {
    const relationFields = ['familyRelation', 'marriage', 'brother', 'goodship', 'badship'];
    const parentChildField = 'parent';
  
    for (const field of relationFields) {
      await updateRelations(originalCharacter, updatedCharacter, field);
    }
  
    // 부모-자식 관계 업데이트
    await updateParentChildRelations(originalCharacter, updatedCharacter, parentChildField);
  };
    
  // 부모-자식 관계에 대한 변경 확인 및 업데이트 함수
  const updateParentChildRelations = async (originalCharacter, updatedCharacter) => {
    // 부모 관계 변경 확인
    await updateSpecificRelation(originalCharacter, updatedCharacter, 'parent', 'child');

    // 자식 관계 변경 확인
    await updateSpecificRelation(originalCharacter, updatedCharacter, 'child', 'parent');
  };

  // 특정 관계 필드에 대한 변경 확인 및 업데이트 함수
  const updateSpecificRelation = async (originalCharacter, updatedCharacter, sourceField, targetField) => {
    const originalRelations = originalCharacter[sourceField] ? originalCharacter[sourceField].split(',').map(name => name.trim()) : [];
    const updatedRelations = updatedCharacter[sourceField] ? updatedCharacter[sourceField].split(',').map(name => name.trim()) : [];

    // 추가된 관계 확인 및 업데이트
    for (const relation of updatedRelations.filter(name => !originalRelations.includes(name))) {
      await updateCharacterRelation(relation, updatedCharacter, targetField, true);
    }

    // 제거된 관계 확인 및 업데이트
    for (const relation of originalRelations.filter(name => !updatedRelations.includes(name))) {
      await updateCharacterRelation(relation, updatedCharacter, targetField, false);
    }
  };
  

  // 특정 관계 필드에 대한 변경 확인 및 업데이트 함수
  const updateRelations = async (originalCharacter, updatedCharacter, relationField) => {
    const originalRelations = originalCharacter[relationField] ? originalCharacter[relationField].split(',').map(name => name.trim()) : [];
    const updatedRelations = updatedCharacter[relationField] ? updatedCharacter[relationField].split(',').map(name => name.trim()) : [];

    // 관계의 추가 또는 제거 확인
    const addedRelations = updatedRelations.filter(name => !originalRelations.includes(name));
    const removedRelations = originalRelations.filter(name => !updatedRelations.includes(name));

    // 추가된 관계 업데이트
    for (const relation of addedRelations) {
      await updateCharacterRelation(relation, updatedCharacter, relationField, true);
    }
    // 제거된 관계 업데이트
    for (const relation of removedRelations) {
      await updateCharacterRelation(relation, updatedCharacter, relationField, false);
    }
  };


  // 특정 캐릭터의 관계 업데이트
  const updateCharacterRelation = async (relatedName, character, relationField, isAddition) => {
    const db = getFirestore();

    // 캐릭터의 전체 이름을 사용해야 하는 경우 (성이 있는 경우)
    let characterFullName = character.family ? `${character.name} ${character.family}` : character.name;

    // 관련 캐릭터의 문서 참조를 얻기 위한 함수
    const getRelatedDocRef = async (name) => {
      let docRef = doc(db, "char", name);
      let docSnap = await getDoc(docRef);

      if (!docSnap.exists() && name.includes(" ")) {
        // 이름에 공백이 있는 경우 (예: 'John Doe'), 이름만으로 다시 시도
        const nameOnly = name.split(" ")[0];
        docRef = doc(db, "char", nameOnly);
        docSnap = await getDoc(docRef);
      }

      return docSnap.exists() ? docRef : null;
    };

    // 관련 캐릭터의 문서 참조를 얻음
    const relatedDocRef = await getRelatedDocRef(relatedName);
    if (!relatedDocRef) return; // 관련 캐릭터가 없으면 함수 종료

    const relatedDocSnap = await getDoc(relatedDocRef);
    const relatedData = relatedDocSnap.data();
    let updatedRelation = relatedData[relationField] ? relatedData[relationField].split(',').map(name => name.trim()) : [];

    if (isAddition) {
      // 관계 추가 (중복 방지를 위해 추가 전 확인)
      if (!updatedRelation.includes(characterFullName)) {
        updatedRelation.push(characterFullName);
      }
    } else {
      // 관계 제거
      updatedRelation = updatedRelation.filter(name => name !== characterFullName);
    }

    await setDoc(relatedDocRef, { ...relatedData, [relationField]: updatedRelation.join(', ') });
  };


  const [showFamilyMap, setShowFamilyMap] = useState(false);

  // 가계도 모달 열기
  const openFamilyMap = () => {
    setShowFamilyMap(true);
  };

  // 관계 인풋창 입력어 추천 로직
  // 일반화된 입력 필드 변경 이벤트 핸들러
  const handleRelationEditChange = (e) => {
    const { name, value } = e.target;
    setEditCharacter({ ...editCharacter, [name]: value });
    setActiveField(name);

    if (['familyRelation', 'marriage', 'parent', 'child', 'brother', 'goodship', 'badship'].includes(name)) {
      setSearchText(value.split(',').pop().trim()); // 마지막 이름 추출
      if (value) {
        searchFamilyRelations(name); // 검색 실행
      } else {
        setSearchResults([]); // 텍스트가 비어있으면 결과 초기화
      }
    }
  };


  const searchFamilyRelations = () => {
    if (!searchText) {
      setSearchResults([]);
      return;
    }

    // 로컬 스토리지에서 캐릭터 데이터를 가져옴
    const storedCharacters = JSON.parse(localStorage.getItem('characters')) || [];

    // 검색된 캐릭터 이름 및 가문 이름을 담을 배열 초기화
    let searchResults = [];

    storedCharacters.forEach(char => {
      // 이름 또는 가문 이름이 검색어를 포함하는 경우 결과에 추가
      if (char.name.toLowerCase().includes(searchText.toLowerCase()) || (char.family && char.family.toLowerCase().includes(searchText.toLowerCase()))) {
        const fullName = char.family ? `${char.name} ${char.family}` : char.name;
        searchResults.push(fullName);
      }
    });

    // 결과 배열에서 중복 제거
    searchResults = Array.from(new Set(searchResults));
    setSearchResults(searchResults);
  };


// 일반화된 검색 결과 선택 로직
  const selectSearchResult = (field, selectedName) => {
    let currentFieldValues = editCharacter[field].split(',').map(item => item.trim());
    if (currentFieldValues.length > 0 && currentFieldValues[currentFieldValues.length - 1] === searchText) {
      currentFieldValues.pop();
    }
    currentFieldValues.push(selectedName.trim());
    const uniqueFieldValues = Array.from(new Set(currentFieldValues));
    const updatedField = uniqueFieldValues.join(', ');
    setEditCharacter({ ...editCharacter, [field]: updatedField });
    setSearchResults([]); // 추천 목록 초기화
    setSearchText(''); // 검색 텍스트 초기화
  };



  return (
    <div className="modal-background" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <span className="close" onClick={onClose}>&times;</span>

         {/* 상세 정보 표시 혹은 인풋 필드 */}
         {!isEditing ? (
          <>
            <div className='detail-profile'>
              <ImageUpload character={character} editCharacter={editCharacter}
              setImages={setImages} images={images} />

              <div className='info-title'>{character.title}</div>
              <div className='info-name'>{character.name} {character.family}</div>
              <div className='info-fam'>가문: {character.family}</div>
              <div className='info-birth'>출생연도 : {character.birth}년생 - {nowYear}년 기준 {calculateAge(character.birth)} 세</div>
              <div className='info-gen'>성별 : {character.gender}</div>
              <div className='info-unit'>유닛 : {character.unit}</div>
              <div className='info-party'>소속 : {character.party}</div>
              <div className='info-personality'>성향 : {character.personality}</div>
              <div className='info-weapon'>무기 : {character.weapon}</div>
              <div className='info-skill'>스킬 : {character.skill}</div>
              <div className='info-hobby'>취미 : {character.hobby}</div>
              <div className='info-talent'>특기 : {character.talent}</div>
              <div className='info-body'>신체 사이즈 : {character.body}</div>
              <div className='info-country'>출신 : {character.country}</div>
              <br/>
              <div className='info familyRelation'>
                가족 관계 : 
                {character.familyRelation ? character.familyRelation.split(',').map(name => (
                  <span 
                    key={`${name.trim()} ${name.family}`} 
                    data-name={name.trim()} 
                    onClick={handleRelationClick}
                    className="relation-name"
                  >
                    {name.trim()}
                  </span>
                )) : " none "}
              </div>
              <div className='info familyRelation'>
                배우자 : 
                {character.marriage ? character.marriage.split(',').map(name => (
                  <span 
                    key={`${name.trim()} ${name.family}`} 
                    data-name={name.trim()} 
                    onClick={handleRelationClick}
                    className="relation-name"
                  >
                    {name.trim()}
                  </span>
                )) : " none "}
              </div>
              <div className='info familyRelation'>
                부모 : 
                {character.parent ? character.parent.split(',').map(name => (
                  <span 
                    key={`${name.trim()} ${name.family}`} 
                    data-name={name.trim()} 
                    onClick={handleRelationClick}
                    className="relation-name"
                  >
                    {name.trim()}
                  </span>
                )) : " none "}
              </div>
              <div className='info familyRelation'>
                자식 : 
                {character.child ? character.child.split(',').map(name => (
                  <span 
                    key={`${name.trim()} ${name.family}`} 
                    data-name={name.trim()} 
                    onClick={handleRelationClick}
                    className="relation-name"
                  >
                    {name.trim()}
                  </span>
                )) : " none "}
              </div>
              <div className='info familyRelation'>
                형제 : 
                {character.brother ? character.brother.split(',').map(name => (
                  <span 
                    key={`${name.trim()} ${name.family}`} 
                    data-name={name.trim()} 
                    onClick={handleRelationClick}
                    className="relation-name"
                  >
                    {name.trim()}
                  </span>
                )) : " none "}
              </div>
              <br/>
              <div className='info-goodRelation'>
                우호 관계 : 
                {character.goodship ? character.goodship.split(',').map(name => (
                  <span 
                    key={`${name.trim()} ${name.family}`} 
                    data-name={name.trim()} 
                    onClick={handleRelationClick}
                    className="relation-name"
                  >
                    {name.trim()},
                  </span>
                )) : " none "}
              </div>
              <div className='info-badRelation'>
                적대 관계 : 
                {character.badship ? character.badship.split(',').map(name => (
                  <span 
                    key={`${name.trim()} ${name.family}`}  
                    data-name={name.trim()} 
                    onClick={handleRelationClick}
                    className="relation-name"
                  >
                    {name.trim()}
                  </span>
                )) : " none "}
              </div>
            </div>
            <div className='info-detail' dangerouslySetInnerHTML={createMarkup(character.detail)}></div>
            <div className='btn-container'>
              <button onClick={openFamilyMap}>가계도 보기</button>
              {showFamilyMap && <FamilyMapModal character={character} onClose={() => setShowFamilyMap(false)} />}
              <button onClick={() => setIsEditing(true)}>수정</button>
              <button onClick={confirmDeletion}>삭제</button>
            </div>
        </>
        ) : (
          <>
            {/* 인풋 필드들 */}
            <div className="edit-input">
            <div className="input-wrapper">
              출생 <input type="number" name="birth" value={editCharacter.birth} onChange={handleEditChange} placeholder="Birth" autoComplete="off" />
            </div>
            <div className="input-wrapper">
              이름 <input type="text" name="name" value={editCharacter.name} onChange={handleEditChange} placeholder="Name" autoComplete="off" />
            </div>
            <div className="input-wrapper">
              성 <input type="text" name="family" value={editCharacter.family} onChange={handleEditChange} placeholder="Family" autoComplete="off" />
            </div>
            <div className="input-wrapper">
              칭호 <input type="text" name="title" value={editCharacter.title} onChange={handleEditChange} placeholder="Title" autoComplete="off" />
            </div>
            <div className="input-wrapper">
              성별 <input type="string" name="gender" value={editCharacter.gender} onChange={handleEditChange} placeholder="Gender" autoComplete="off" />
            </div>
            <div className="input-wrapper">
              유닛 <input type="string" name="unit" value={editCharacter.unit} onChange={handleEditChange} placeholder="Unit" autoComplete="off" />
            </div>
            <div className="input-wrapper">
              소속 <input type="text" name="party" value={editCharacter.party} onChange={handleEditChange} placeholder="Party" autoComplete="off" />
            </div>
            <div className="input-wrapper">
              성향 <input type="string" name="personality" value={editCharacter.personality} onChange={handleEditChange} placeholder="Personality" autoComplete="off" />
            </div>
            <div className="input-wrapper">
              무기 <input type="text" name="weapon" value={editCharacter.weapon} onChange={handleEditChange} placeholder="Weapon" autoComplete="off" />
            </div>
            <div className="input-wrapper">
              스킬 <input type="text" name="skill" value={editCharacter.skill} onChange={handleEditChange} placeholder="skill" autoComplete="off" />
            </div>
            <div className="input-wrapper">
              취미 <input type="text" name="hobby" value={editCharacter.hobby} onChange={handleEditChange} placeholder="Hobby" autoComplete="off" />
            </div>
            <div className="input-wrapper">
              특기 <input type="text" name="talent" value={editCharacter.talent} onChange={handleEditChange} placeholder="Talent" autoComplete="off" />
            </div>
            <div className="input-wrapper">
              신체 <input type="text" name="body" value={editCharacter.body} onChange={handleEditChange} placeholder="Body" autoComplete="off" />
            </div>
            <div className="input-wrapper">
              출신 <input type="text" name="country" value={editCharacter.country} onChange={handleEditChange} placeholder="Country" autoComplete="off" />
            </div>

              {/* 가족 관계 필드 */}
              <div className="input-wrapper">
                가족 관계 <input type="text" name="familyRelation" value={editCharacter.familyRelation} onChange={handleRelationEditChange} placeholder="Family Relation" autoComplete="off" />
                {activeField === 'familyRelation' && searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map(result => (
                      <div key={result} onClick={() => selectSearchResult('familyRelation', result)}>
                        {result}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 배우자 필드 */}
              <div className="input-wrapper">
                배우자 <input type="text" name="marriage" value={editCharacter.marriage} onChange={handleRelationEditChange} placeholder="Marriage" autoComplete="off" />
                {activeField === 'marriage' && searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map(result => (
                      <div key={result} onClick={() => selectSearchResult('marriage', result)}>
                        {result}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 부모 필드 */}
              <div className="input-wrapper">
                부모 <input type="text" name="parent" value={editCharacter.parent} onChange={handleRelationEditChange} placeholder="Parent" autoComplete="off" />
                {activeField === 'parent' && searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map(result => (
                      <div key={result} onClick={() => selectSearchResult('parent', result)}>
                        {result}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 자식 필드 */}
              <div className="input-wrapper">
                자식 <input type="text" name="child" value={editCharacter.child} onChange={handleRelationEditChange} placeholder="Child" autoComplete="off" />
                {activeField === 'child' && searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map(result => (
                      <div key={result} onClick={() => selectSearchResult('child', result)}>
                        {result}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 형제 필드 */}
              <div className="input-wrapper">
                형제 <input type="text" name="brother" value={editCharacter.brother} onChange={handleRelationEditChange} placeholder="Brother" autoComplete="off" />
                {activeField === 'brother' && searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map(result => (
                      <div key={result} onClick={() => selectSearchResult('brother', result)}>
                        {result}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 우호 관계 필드 */}
              <div className="input-wrapper">
                우호 관계 <input type="text" name="goodship" value={editCharacter.goodship} onChange={handleRelationEditChange} placeholder="Goodship" autoComplete="off" />
                {activeField === 'goodship' && searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map(result => (
                      <div key={result} onClick={() => selectSearchResult('goodship', result)}>
                        {result}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 적대 관계 필드 */}
              <div className="input-wrapper">
                적대 관계 <input type="text" name="badship" value={editCharacter.badship} onChange={handleRelationEditChange} placeholder="Badship" autoComplete="off" />
                {activeField === 'badship' && searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map(result => (
                      <div key={result} onClick={() => selectSearchResult('badship', result)}>
                        {result}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <textarea type="text" name="detail" value={editCharacter.detail} onChange={handleEditChange} placeholder="Detail" />
            </div>
            <button onClick={saveEdit}>저장</button>
            <button onClick={cancelEdit}>취소</button>
          </>
        )}
      </div>
    </div>
  );
};

export default DetailModal;