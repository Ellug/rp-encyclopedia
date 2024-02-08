// src/components/DetailModal.jsx
import React, { useState, useEffect } from 'react';
import { deleteDoc, setDoc, doc, getDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import '../styles/DetailModal.css';

const DetailModal = ({ character, onClose, onDelete, nowYear, openModal, characters }) => {
  const [isEditing, setIsEditing] = useState(false);
  const db = getFirestore();
  const originalDocId = `${character.name} ${character.family}`;

  const createDefaultCharacter = (characterData) => {
    const fields = 
      ['birth', 'name', 'family', 'title', 'gender', 'unit', 'party', 'personality', 'weapon',
      'hobby', 'talent', 'body', 'country', 'familyRelation', 'goodship', 'badship', 'detail',
      'marriage', 'parent', 'child', 'brother'];
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
  
    try {
      // 새로운 문서 식별자로 문서를 생성
      await setDoc(newDocRef, editCharacter);
  
      // 기존 문서 식별자와 새 문서 식별자가 다르면 기존 문서 삭제
      if (originalDocId !== newDocId) {
        const originalDocRef = doc(db, "char", originalDocId);
        await deleteDoc(originalDocRef);
      }
  
      // 관련 캐릭터의 정보 업데이트
      if (character) { // character 객체가 유효한 경우에만 호출
        await updateRelatedCharacters(character, editCharacter);
      }
  
      setIsEditing(false);
      onClose(); // 모달 닫기
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
      onDelete(character.id);
    }
  };

  const calculateAge = (birthYear) => nowYear - birthYear;

  const createMarkup = (text) => {
    return {__html: text.replace(/\n/g, '<br />')};
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
      openModal(foundCharacter);
    }
  };


// 관계 변경 확인 및 업데이트 함수
  const updateRelatedCharacters = async (originalCharacter, updatedCharacter) => {
    // Update updated character's relations
    await updateRelations(originalCharacter, updatedCharacter, 'familyRelation');
    await updateRelations(originalCharacter, updatedCharacter, 'marriage');
    await updateRelations(originalCharacter, updatedCharacter, 'brother');
    await updateRelations(originalCharacter, updatedCharacter, 'goodship');
    await updateRelations(originalCharacter, updatedCharacter, 'badship');
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






  

  return (
    <div className="modal-background" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <span className="close" onClick={onClose}>&times;</span>

         {/* 상세 정보 표시 혹은 인풋 필드 */}
         {!isEditing ? (
          <>
            <div className='detail-profile'>
              <div className='info-title'>{character.title}</div>
              <div className='info-name'>{character.name} {character.family}</div>
              <div className='info fam'>가문: {character.family}</div>
              <div className='info birth'>출생연도 : {character.birth}년생 - {nowYear}년 기준 {calculateAge(character.birth)} 세</div>
              <div className='info gen'>성별 : {character.gender}</div>
              <div className='info unit'>유닛 : {character.unit}</div>
              <div className='info party'>소속 : {character.party}</div>
              <div className='info personality'>성향 : {character.personality}</div>
              <div className='info weapon'>무기/유파 : {character.weapon}</div>
              <div className='info hobby'>취미 : {character.hobby}</div>
              <div className='info talent'>특기 : {character.talent}</div>
              <div className='info body'>신체 사이즈 : {character.body}</div>
              <div className='info country'>출신 : {character.country}</div>
              <br/>
              <div className='info familyRelation'>
                가족 관계 : 
                {character.familyRelation ? character.familyRelation.split(',').map(name => (
                  <span 
                    key={name.trim()} 
                    data-name={name.trim()} 
                    onClick={handleRelationClick}
                    className="relation-name"
                  >
                    {name.trim()}
                  </span>
                )) : " 정보 없음 "}
              </div>
              <div className='info familyRelation'>
                배우자 : 
                {character.marriage ? character.marriage.split(',').map(name => (
                  <span 
                    key={name.trim()} 
                    data-name={name.trim()} 
                    onClick={handleRelationClick}
                    className="relation-name"
                  >
                    {name.trim()}
                  </span>
                )) : " 정보 없음 "}
              </div>
              <div className='info familyRelation'>
                부모 : 
                {character.parent ? character.parent.split(',').map(name => (
                  <span 
                    key={name.trim()} 
                    data-name={name.trim()} 
                    onClick={handleRelationClick}
                    className="relation-name"
                  >
                    {name.trim()}
                  </span>
                )) : " 정보 없음 "}
              </div>
              <div className='info familyRelation'>
                자식 : 
                {character.child ? character.child.split(',').map(name => (
                  <span 
                    key={name.trim()} 
                    data-name={name.trim()} 
                    onClick={handleRelationClick}
                    className="relation-name"
                  >
                    {name.trim()}
                  </span>
                )) : " 정보 없음 "}
              </div>
              <div className='info familyRelation'>
                형제 : 
                {character.brother ? character.brother.split(',').map(name => (
                  <span 
                    key={name.trim()} 
                    data-name={name.trim()} 
                    onClick={handleRelationClick}
                    className="relation-name"
                  >
                    {name.trim()}
                  </span>
                )) : " 정보 없음 "}
              </div>
              <br/>
              <div className='info-goodRelation'>
                우호 관계 : 
                {character.goodship ? character.goodship.split(',').map(name => (
                  <span 
                    key={name.trim()} 
                    data-name={name.trim()} 
                    onClick={handleRelationClick}
                    className="relation-name"
                  >
                    {name.trim()}
                  </span>
                )) : " 정보 없음 "}
              </div>
              <div className='info-badRelation'>
                적대 관계 : 
                {character.badship ? character.badship.split(',').map(name => (
                  <span 
                    key={name.trim()} 
                    data-name={name.trim()} 
                    onClick={handleRelationClick}
                    className="relation-name"
                  >
                    {name.trim()}
                  </span>
                )) : " 정보 없음 "}
              </div>
            </div>
            <div className='info-detail' dangerouslySetInnerHTML={createMarkup(character.detail)}></div>
            <div className='btn-container'>
              <button onClick={() => setIsEditing(true)}>수정</button>
              <button onClick={confirmDeletion}>삭제</button>
            </div>
        </>
        ) : (
          <>
            {/* 인풋 필드들 */}
            <div className="edit-input">
              <div className="input-wrapper">
                출생 <input type="number" name="birth" value={editCharacter.birth} onChange={handleEditChange} placeholder="Birth" />
              </div>
              <div className="input-wrapper">
                이름 <input type="text" name="name" value={editCharacter.name} onChange={handleEditChange} placeholder="Name" />
              </div>
              <div className="input-wrapper">
                성 <input type="text" name="family" value={editCharacter.family} onChange={handleEditChange} placeholder="Family" />
              </div>
              <div className="input-wrapper">
                칭호 <input type="text" name="title" value={editCharacter.title} onChange={handleEditChange} placeholder="Title" />
              </div>
              <div className="input-wrapper">
                성별 <input type="string" name="gender" value={editCharacter.gender} onChange={handleEditChange} placeholder="Gender" />
              </div>
              <div className="input-wrapper">
                유닛 <input type="string" name="unit" value={editCharacter.unit} onChange={handleEditChange} placeholder="Unit" />
              </div>
              <div className="input-wrapper">
                소속 <input type="text" name="party" value={editCharacter.party} onChange={handleEditChange} placeholder="Party" />
              </div>
              <div className="input-wrapper">
                성향 <input type="string" name="personality" value={editCharacter.personality} onChange={handleEditChange} placeholder="Personality" />
              </div>
              <div className="input-wrapper">
                무기, 유파 <input type="text" name="weapon" value={editCharacter.weapon} onChange={handleEditChange} placeholder="Weapon" />
              </div>
              <div className="input-wrapper">
                취미 <input type="text" name="hobby" value={editCharacter.hobby} onChange={handleEditChange} placeholder="Hobby" />
              </div>
              <div className="input-wrapper">
                특기 <input type="text" name="talent" value={editCharacter.talent} onChange={handleEditChange} placeholder="Talent" />
              </div>
              <div className="input-wrapper">
                신체 <input type="text" name="body" value={editCharacter.body} onChange={handleEditChange} placeholder="Body" />
              </div>
              <div className="input-wrapper">
                출신 <input type="text" name="country" value={editCharacter.country} onChange={handleEditChange} placeholder="Country" />
              </div>
              <div className="input-wrapper">
                가족 관계 <input type="text" name="familyRelation" value={editCharacter.familyRelation} onChange={handleEditChange} placeholder="Family Relation" />
              </div>
              <div className="input-wrapper">
                배우자 <input type="text" name="marriage" value={editCharacter.marriage} onChange={handleEditChange} placeholder="marriage" />
              </div>
              <div className="input-wrapper">
                부모 <input type="text" name="parent" value={editCharacter.parent} onChange={handleEditChange} placeholder="parent" />
              </div>
              <div className="input-wrapper">
                자식 <input type="text" name="child" value={editCharacter.child} onChange={handleEditChange} placeholder="child" />
              </div>
              <div className="input-wrapper">
                형제 <input type="text" name="brother" value={editCharacter.brother} onChange={handleEditChange} placeholder="brother" />
              </div>
              <div className="input-wrapper">
                우호 관계 <input type="text" name="goodship" value={editCharacter.goodship} onChange={handleEditChange} placeholder="Goodship" />
              </div>
              <div className="input-wrapper">
                적대 관계 <input type="text" name="badship" value={editCharacter.badship} onChange={handleEditChange} placeholder="Badship" />
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