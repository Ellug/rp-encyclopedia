// src/pages/Family.jsx
import React, { useEffect, useState } from 'react';
import database from '../firebaseConfig';
import { getFirestore, doc, setDoc, getDocs, collection, getDoc } from 'firebase/firestore';
import '../styles/Family.css';
import FamilyMapModal from '../components/FamilyMapModal.jsx';
// import Spinner from '../components/Spinner.jsx'

const Family = () => {
  const db = getFirestore(database);
  const [newFamily, setNewFamily] = useState('')
  const [showFamilyMap, setShowFamilyMap ] = useState(false)

  const [families, setFamilies] = useState([]); // 문서 이름들을 저장할 상태
  const [selectedFamilyData, setSelectedFamilyData] = useState(null);

  const fetchFamilies = async () => {
    const querySnapshot = await getDocs(collection(db, "family"));
    const familyNames = [];
    querySnapshot.forEach((doc) => {
      // 문서 ID(여기서는 문서 이름)를 배열에 추가
      familyNames.push(doc.id);
    });
    setFamilies(familyNames); // 상태 업데이트
  };

  useEffect(() => {
    fetchFamilies();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNewFamilyChange = (e) => {
    setNewFamily(e.target.value);
  }

  const addFamily = async () => {
    if (!newFamily) { alert('가문명을 입력하세요'); return; }
    if (families.includes(newFamily)) {
      alert('이미 존재하는 가문명입니다. 다른 이름을 입력해주세요.');
      return;
    }

    try {
      const docRef = doc(db, "family", newFamily);
      await setDoc(docRef, {}); // 빈 문서를 추가합니다.

      console.log('가문 생성', newFamily);
      setNewFamily(''); // 입력 필드 초기화
    } catch (error) {
      console.error("Error adding document: ", error);
    } finally {
      fetchFamilies();
    }
  };


  const handleFamilyClick = async (familyName) => {
    const docRef = doc(db, "family", familyName);
    const docSnap = await getDoc(docRef);
  
    if (docSnap.exists()) {
      // 문서 데이터를 가져온 후, selectedFamilyData 상태를 업데이트하고 모달을 엽니다.
      setSelectedFamilyData({ ...docSnap.data(), id: docSnap.id });
      setShowFamilyMap(true); // 모달 열기
    } else {
      console.log("No such document!");
    }
  };

  const closeFamilyMap =() => {
    setShowFamilyMap(false);
  }

  
  return (
    <div className='fam-comp'>
      {/* {isLoading && <Spinner />} */}
      <input type="text" name="newFamily" value={newFamily} onChange={handleNewFamilyChange}
        placeholder="Family" autoComplete='off' />
      <button onClick={addFamily} disabled={!newFamily}>추가</button>

      <h3>가문 목록</h3>
        <div className='fam-list'>
          {families.map((name) => (
            <div className='fams' key={name} onClick={() => handleFamilyClick(name)}>
              {name}
            </div> // 문서 이름(가문명)을 리스트로 표시
          ))}
        </div>
      
      {showFamilyMap &&
        <FamilyMapModal
          onClose={closeFamilyMap}
          familyData={selectedFamilyData}
          db={db}
          fetchFamilies={fetchFamilies}
        />
      }
    </div>
  );
};

export default Family