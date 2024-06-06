import React, { useState, useEffect } from 'react';
import { deleteDoc, setDoc, doc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import '../styles/NewDetailModal.css';
import ImageUpload from './ImageUpload';
import { deleteObject, getStorage, listAll, ref } from 'firebase/storage';

const DetailModal = ({ character, onClose, nowYear, openModal, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const db = getFirestore();
  const storage = getStorage();
  const originalDocId = `${character.name} ${character.family}`;
  const [images, setImages] = useState(character.images || []);

  
  const createDefaultCharacter = (characterData) => {
    const fields = 
      ['birth', 'name', 'family', 'title', 'gender', 'unit', 'party', 'personality', 'weapon', 'skill',
      'hobby', 'talent', 'body', 'country', 'familyRelation', 'detail',
      'marriage', 'parent', 'child', 'brother', 'Images', 'voice', 'series'];
    const defaultCharacter = {};
    fields.forEach(field => {
      defaultCharacter[field] = characterData[field] || '';
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
    const newCharRef = doc(db, "characters", newDocId);
    const newDetailRef = doc(db, "character_details", newDocId);

    const characterData = {
      birth: editCharacter.birth,
      name: editCharacter.name,
      family: editCharacter.family,
      title: editCharacter.title,
      gender: editCharacter.gender,
      unit: editCharacter.unit,
      party: editCharacter.party,
      skill: editCharacter.skill,
      body: editCharacter.body
    };

    const detailData = {
      ...editCharacter,
      images: images
    };

    try {
      await setDoc(newCharRef, characterData);
      await setDoc(newDetailRef, detailData);
  
      // 기존 문서 식별자와 새 문서 식별자가 다르면 기존 문서 삭제
      if (originalDocId !== newDocId) {
        const originalCharRef = doc(db, "characters", originalDocId);
        const originalDetailRef = doc(db, "character_details", originalDocId);
        await deleteDoc(originalCharRef);
        await deleteDoc(originalDetailRef);
      }
      // 관련 캐릭터의 정보 업데이트
      if (onUpdate) {
        onUpdate(characterData); // 상위 컴포넌트에서 리스트를 업데이트
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

  const deleteStorageFolder = async (path) => {
    const folderRef = ref(storage, path);
    try {
      const listResult = await listAll(folderRef);
      listResult.items.forEach(async (itemRef) => {
        await deleteObject(itemRef);
      });
      console.log('All files in the folder have been deleted');
    } catch (error) {
      console.error("Failed to delete storage folder:", error);
    }
  };
  
  const confirmDeletion = async () => {
    const docId = character.family ? `${character.name} ${character.family}` : character.name;
    if(window.confirm("정말로 삭제하시겠습니까?")) {
      try {
        // Firestore에서 문서 삭제
        await deleteDoc(doc(db, "characters", docId));
        await deleteDoc(doc(db, "character_details", docId));
  
        // Storage에서 이미지 폴더 삭제
        await deleteStorageFolder(`charactersIMG/${docId}`);
        onClose(); // 모달 닫기
      } catch (error) {
        console.error("Error deleting document or folder: ", error);
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const calculateAge = (birthYear) => nowYear - birthYear;

  const createMarkup = (text) => {
    if (text === undefined) {
      text = '';
    }
    return { __html: text.replace(/\n/g, '<br />') };
  };

  
  // 클릭 이벤트 핸들러
  const handleRelationClick = (e) => {
    const clickedName = e.target.dataset.name;
    const clickedFamily = e.target.dataset.family;

    const characterId = clickedFamily ? `${clickedName} ${clickedFamily}` : clickedName;
  
    if (!characterId) {
      console.error("No character information provided.");
      alert('캐릭터 정보가 제공되지 않았습니다.');
      return;
    }
  
    // 클릭된 캐릭터 ID를 사용하여 상세 정보 모달 열기
    onClose(); // 현재 모달 닫기
    setTimeout(() => {
      openModal(characterId); // 클릭된 ID로 모달 열기
    }, 100);
  };
  


  // 모달 배경 클릭 핸들러
  const handleModalBackgroundClick = (e) => {
    if (isEditing) {
      const confirmClose = window.confirm("진짜로 닫을 거냐 어리석은 자여?");
      if (confirmClose) {
        setIsEditing(false);
        onClose();
      }
    } else {
      onClose();
    }
  };


  return (
    <div className="modal-background" onClick={handleModalBackgroundClick}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <span className="close" onClick={onClose}>&times;</span>

         {!isEditing ? (
          <>
            <div className='detail-profile'>
              
              <div className='main-profile'>
                <div className='left'>
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
                  <div className='info-voice'>성우 : {character.voice}</div>
                  <div className='info-voice'>시리즈 : {character.series}</div>
                </div>
                <ImageUpload character={character} editCharacter={editCharacter}
                setImages={setImages} images={images} />
              </div>
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
              <div className="input-wrapper">
                성우 <input type="text" name="voice" value={editCharacter.voice} onChange={handleEditChange} placeholder="Voice" autoComplete="off" />
              </div>
              <div className="input-wrapper">
                시리즈 <input type="text" name="series" value={editCharacter.series} onChange={handleEditChange} placeholder="Series" autoComplete="off" />
              </div>


              <div className="input-wrapper">
                가족 관계 <input type="text" name="familyRelation" value={editCharacter.familyRelation} onChange={handleEditChange} placeholder="Family Relation" autoComplete="off" />
              </div>

              <div className="input-wrapper">
                배우자 <input type="text" name="marriage" value={editCharacter.marriage} onChange={handleEditChange} placeholder="Marriage" autoComplete="off" />
              </div>

              <div className="input-wrapper">
                부모 <input type="text" name="parent" value={editCharacter.parent} onChange={handleEditChange} placeholder="Parent" autoComplete="off" />
              </div>

              <div className="input-wrapper">
                자식 <input type="text" name="child" value={editCharacter.child} onChange={handleEditChange} placeholder="Child" autoComplete="off" />
              </div>

              <div className="input-wrapper">
                형제 <input type="text" name="brother" value={editCharacter.brother} onChange={handleEditChange} placeholder="Brother" autoComplete="off" />
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