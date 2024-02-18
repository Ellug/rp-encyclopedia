import React, { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import '../styles/FamilyMapModal.css';

const FamilyMapModal = ({ onClose, familyData, db, fetchFamilies }) => {
  const [name, setName] = useState('');
  const [boxes, setBoxes] = useState(familyData?.boxes || []);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedBox, setDraggedBox] = useState(null);

  const fetchFamilyMembers = async () => {
    const membersCollectionRef = collection(db, `family/${familyData.id}/familyMember`);
    const querySnapshot = await getDocs(membersCollectionRef);
    const members = [];
    querySnapshot.forEach((doc) => {
      members.push({ id: doc.id, ...doc.data() });
    });
    setBoxes(members);
  };

  useEffect(() => {
    fetchFamilyMembers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addBox = async () => {
    if (!name) {
      alert('Please enter the name of the family member.');
      return;
    }

    const newBox = { name, x: 100, y: 100 };
    const docRef = doc(collection(db, `family/${familyData.id}/familyMember`)); // Firestore에서 자동 생성된 ID 사용
    await setDoc(docRef, newBox);
    setBoxes(prevBoxes => [...prevBoxes, { ...newBox, id: docRef.id }]);
    setName('');
  };

  const startDrag = (box) => (e) => {
    e.stopPropagation();
    setIsDragging(true);
    setDraggedBox({...box, offsetX: e.clientX - e.target.offsetLeft, offsetY: e.clientY - e.target.offsetTop});
  };

  const onDrag = (e) => {
    if (!isDragging || !draggedBox) return;
    // 마우스 위치에서 offsetX, offsetY를 빼서 새 위치 계산
    let newX = e.clientX - draggedBox.offsetX;
    let newY = e.clientY - draggedBox.offsetY;
  
    // 5px 단위로 정렬
    newX = Math.round(newX / 15) * 15;
    newY = Math.round(newY / 25) * 25;
  
    setDraggedBox({ ...draggedBox, x: newX, y: newY });
  };
  

  const endDrag = () => {
    if (!isDragging || !draggedBox) return;
    setIsDragging(false);
    setBoxes(boxes.map(box => box.id === draggedBox.id ? { ...draggedBox } : box));
    setDraggedBox(null);
  };
  // 모달 닫기 및 데이터 저장 로직
  const saveAndClose = async () => {
    // 모든 박스(캐릭터)에 대해 Firestore 업데이트
    const batch = writeBatch(db);
    boxes.forEach((box) => {
      const boxRef = doc(db, `family/${familyData.id}/familyMember`, box.id);
      batch.update(boxRef, { x: box.x, y: box.y });
    });
 
    try {
      await batch.commit(); // 변경사항 일괄 적용
    } catch (error) {
      console.error("Error updating boxes: ", error);
    } finally {
      onClose(); // 모달 닫기
    }
  };

  // 캐릭터 삭제 함수
  const deleteCharacter = async (characterId) => {
    // 로컬 상태에서 캐릭터 제거
    setBoxes(boxes.filter(box => box.id !== characterId));

    // Firestore에서 캐릭터 문서 삭제
    try {
      await deleteDoc(doc(db, `family/${familyData.id}/familyMember`, characterId));
      console.log("Document successfully deleted!");
    } catch (error) {
      console.error("Error removing document: ", error);
    }
  };

  const deleteFamily = async () => {
    // 사용자에게 가문 삭제를 확인
    const isConfirmed = window.confirm(`${familyData.id} 가문을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`);
    if (!isConfirmed) {
      return; // 사용자가 취소한 경우, 작업 중단
    }
  
    try {
      // 가문에 속한 구성원들(familyMember)을 삭제하기 위한 batch 생성
      const batch = writeBatch(db);
      const membersCollectionRef = collection(db, `family/${familyData.id}/familyMember`);
      const querySnapshot = await getDocs(membersCollectionRef);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref); // 각 구성원 문서에 대해 삭제 작업 추가
      });
  
      // 가문 문서 자체를 삭제
      const familyDocRef = doc(db, "family", familyData.id);
      batch.delete(familyDocRef);
  
      // batch 작업 실행으로 모든 관련 문서를 삭제
      await batch.commit();
      console.log(`${familyData.id} 가문이 성공적으로 삭제되었습니다.`);
    } catch (error) {
      console.error("가문 삭제 중 오류 발생: ", error);
      alert("가문을 삭제하는 중 오류가 발생했습니다. 다시 시도해 주세요.");
      return; // 오류 발생시 여기서 함수 종료
    } finally {
      onClose();
      fetchFamilies();
    }
  };
  

  const [scale, setScale] = useState(1); // 확대/축소를 위한 상태
  const [position, setPosition] = useState({ x: 0, y: 0 }); // 이동을 위한 상태
  const [dragging, setDragging] = useState(false); // 드래그 상태
  const [startPos, setStartPos] = useState({ x: 0, y: 0 }); // 드래그 시작 위치

  // 확대/축소 함수
  const zoomIn = () => setScale(scale * 1.1);
  const zoomOut = () => setScale(scale * 0.9);

  // 마우스 휠 이벤트 핸들러
  const handleWheel = (e) => {
    if (e.deltaY < 0) {
      // 휠을 위로 스크롤 (줌인)
      setScale(prevScale => Math.min(prevScale * 1.1, 4)); // 최대 4배까지 확대 가능
    } else if (e.deltaY > 0) {
      // 휠을 아래로 스크롤 (줌아웃)
      setScale(prevScale => Math.max(prevScale / 1.1, 0.25)); // 최소 0.25배까지 축소 가능
    }
  };

   // 방향키로 이동하는 함수
   const handleKeyDown = (e) => {
    switch (e.key) {
      case "ArrowUp":
        setPosition(prev => ({ ...prev, y: prev.y + 20 }));
        break;
      case "ArrowDown":
        setPosition(prev => ({ ...prev, y: prev.y - 20 }));
        break;
      case "ArrowLeft":
        setPosition(prev => ({ ...prev, x: prev.x + 20 }));
        break;
      case "ArrowRight":
        setPosition(prev => ({ ...prev, x: prev.x - 20 }));
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    
    // 컴포넌트가 언마운트될 때 이벤트 리스너 제거
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // 마우스 드래그 시작 처리
  const handleMouseDown = (e) => {
    // e.target이 박스가 아닌 경우에만 dragging 상태를 true로 설정
    if (!e.target.classList.contains('fam-member')) {
        setDragging(true);
        setStartPos({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        });
    }
};

  // 마우스 이동 처리
  const handleMouseMove = (e) => {
    if (!isDragging && dragging) {
      setPosition({
        x: e.clientX - startPos.x,
        y: e.clientY - startPos.y,
      });
    }
  };

  // 마우스 드래그 끝 처리
  const handleMouseUp = () => {
    setDragging(false);
  };



  return (
    <div className="family-map-modal-background" onClick={saveAndClose}>
      <div className="family-map-modal-content" onClick={e => e.stopPropagation()}
        onMouseMove={onDrag}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
      >
        <h1>{familyData.id}</h1>
        
        <button onClick={zoomIn}>확대</button>
        <button onClick={zoomOut}>축소</button>
        <div className="map-close" onClick={saveAndClose}>&times;</div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="구성원 이름 입력"
        />
        <button onClick={addBox}>추가</button>
        <button onClick={deleteFamily}>가문 삭제</button>
        <div 
          style={{
            overflow: 'hidden',
            width: '100%', // 외부 컨테이너의 크기 조정
            height: '100%', // 외부 컨테이너의 크기 조정
          }}
          onWheel={handleWheel} // 마우스 휠 이벤트에 핸들러 연결
          onMouseDown={handleMouseDown} // 드래그 시작
          onMouseMove={handleMouseMove} // 마우스 이동
          onMouseUp={handleMouseUp} // 드래그 끝
          onMouseLeave={handleMouseUp} // 마우스가 컨테이너 밖으로 나갔을 때도 드래그 종료 처리
        >
          <div
            style={{
              transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
              transformOrigin: '0 0',
              transition: 'transform 0.2s',
            }}
          >

            {/* 가계도 및 기타 컴포넌트 */}
            {boxes.map((box, index) => (
              <div className='fam-member' key={index} 
              onMouseDown={startDrag(box)}
              style={{ 
                position: 'absolute', 
                left: box.id === draggedBox?.id ? draggedBox.x : box.x, 
                top: box.id === draggedBox?.id ? draggedBox.y : box.y, 
                cursor: 'move', 
              }}
              >
                {box.name}
                <button className='delete-char'
                onClick={(e) => {
                  e.stopPropagation(); // 상위 요소로의 이벤트 전파 방지
                  deleteCharacter(box.id);
                }}
              >
                X
              </button>
              </div>
            ))}


          </div>
        </div>

      </div>
    </div>
  );
};

export default FamilyMapModal;
