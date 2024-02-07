// src/components/DetailModal.jsx
import React, { useState, useEffect } from 'react';
import { deleteDoc, setDoc, doc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import '../styles/DetailModal.css';

const DetailModal = ({ character, onClose, onDelete, nowYear }) => {
  const [isEditing, setIsEditing] = useState(false);
  const db = getFirestore();
  const originalDocId = `${character.name} ${character.family}`;

  const createDefaultCharacter = (characterData) => {
    const fields = 
      ['birth', 'name', 'family', 'title', 'gender', 'unit', 'party', 'personality', 'weapon',
      'hobby', 'talent', 'body', 'country', 'familyRelation', 'goodship', 'badship', 'detail'];
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
    const newDocId = `${editCharacter.name} ${editCharacter.family}`;
    const newDocRef = doc(db, "char", newDocId);
  
    try {
      // 새로운 문서 식별자로 문서를 생성
      await setDoc(newDocRef, editCharacter);
  
      // 기존 문서 식별자와 새 문서 식별자가 다르면 기존 문서 삭제
      if (originalDocId !== newDocId) {
        const originalDocRef = doc(db, "char", originalDocId);
        await deleteDoc(originalDocRef);
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

  const calculateAge = (birthYear) => nowYear - birthYear;

  const createMarkup = (text) => {
    return {__html: text.replace(/\n/g, '<br />')};
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
              <div className='info country'>가족 관계 : {character.familyRelation}</div>
              <div className='info country'>우호 관계 : {character.goodship}</div>
              <div className='info country'>적대 관계 : {character.badship}</div>
            </div>
            <div className='info-detail' dangerouslySetInnerHTML={createMarkup(character.detail)}></div>
            <div className='btn-container'>
              <button onClick={() => setIsEditing(true)}>수정</button>
              <button onClick={() => onDelete(character.id)}>삭제</button>
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
                성별 <input type="text" name="gender" value={editCharacter.gender} onChange={handleEditChange} placeholder="Gender" />
              </div>
              <div className="input-wrapper">
                유닛 <input type="text" name="unit" value={editCharacter.unit} onChange={handleEditChange} placeholder="Unit" />
              </div>
              <div className="input-wrapper">
                소속 <input type="text" name="party" value={editCharacter.party} onChange={handleEditChange} placeholder="Party" />
              </div>
              <div className="input-wrapper">
                성향 <input type="text" name="personality" value={editCharacter.personality} onChange={handleEditChange} placeholder="Personality" />
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