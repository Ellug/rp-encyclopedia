import React, { useEffect, useState } from 'react';
import database from '../firebaseConfig';
import { getFirestore, doc, setDoc, getDocs, collection, getDoc } from 'firebase/firestore';
import FamilyMapModal from '../components/FamilyMapModal.jsx';

const Family = () => {
  const db = getFirestore(database);
  const [newFamily, setNewFamily] = useState('')
  const [showFamilyMap, setShowFamilyMap ] = useState(false)

  const [families, setFamilies] = useState([]); // 문서 이름들을 저장할 상태
  const [selectedFamilyData, setSelectedFamilyData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

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
    <div className="fam-comp flex flex-col items-center p-4 space-y-6">
      {/* 가문 추가 입력 및 버튼 */}
      <div className="flex items-center space-x-4">
        <input
          type="text"
          name="newFamily"
          value={newFamily}
          onChange={handleNewFamilyChange}
          placeholder="가문 이름 입력"
          autoComplete="off"
          className="w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <button
          onClick={addFamily}
          disabled={!newFamily}
          className={`px-4 py-2 rounded-lg transition ${
            newFamily
              ? "bg-gray-800 text-white hover:bg-gray-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          추가
        </button>
      </div>
  
      {/* 검색 입력 필드 */}
      <div className="search-container w-full max-w-md">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="가문 검색..."
          autoComplete="off"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
      </div>
  
      <h3 className="text-xl font-semibold text-white">가문, 유파 계보</h3>
      {/* 가문 리스트 */}
      <div className="fam-list w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-10 gap-4">
        {families
          .filter((name) =>
            name.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((name) => {
            // 검색어와 일치하는 부분을 강조
            const parts = name.split(new RegExp(`(${searchTerm})`, "gi"));
            return (
              <div
                key={name}
                onClick={() => handleFamilyClick(name)}
                className="fams px-4 py-2 border border-gray-300 rounded-md shadow-sm cursor-pointer text-center hover:text-yellow-500 hover:border-yellow-500"
              >
                {parts.map((part, index) =>
                  part.toLowerCase() === searchTerm.toLowerCase() ? (
                    <span key={index} className="font-semibold text-yellow-500">
                      {part}
                    </span>
                  ) : (
                    <span key={index}>{part}</span>
                  )
                )}
              </div>
            );
          })}
      </div>

  
      {/* 가문 지도 모달 */}
      {showFamilyMap && (
        <FamilyMapModal
          onClose={closeFamilyMap}
          familyData={selectedFamilyData}
          db={db}
          fetchFamilies={fetchFamilies}
        />
      )}
    </div>
  );
  
};

export default Family