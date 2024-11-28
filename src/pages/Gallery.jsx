import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import database from '../firebaseConfig';
import NewDetailModal from '../components/NewDetailModal.jsx';

const Gallery = () => {
  const [galleryImages, setGalleryImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentCharacter, setCurrentCharacter] = useState(null);
  const db = getFirestore(database);

  const DetailModalMemo = React.memo(NewDetailModal);

  useEffect(() => {
    const fetchGalleryImages = async () => {
      setIsLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'Gallery'));
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id, // Gallery 컬렉션의 문서 ID (character_details의 docId와 동일)
          images: doc.data().images || [],
        }));

        setGalleryImages(data);
      } catch (error) {
        console.error('Error fetching gallery data: ', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGalleryImages();
  }, [db]);

  const handleCharacterClick = async (characterId) => {
    try {
      const docRef = doc(db, 'character_details', characterId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setCurrentCharacter({ id: characterId, ...docSnap.data() });
      } else {
        console.log('No such character!');
      }
    } catch (error) {
      console.error('Error fetching character details:', error);
    }
  };

  const closeModal = () => {
    setSelectedImage(null);
    setCurrentCharacter(null);
  };

  if (isLoading) {
    return <p className="text-center text-gray-500 mt-6">Loading...</p>;
  }

  return (
    <div className="gallery-container p-4 sm:px-20">
      {/* 검색 입력 */}
      <div className="search-container mb-6 w-[400px]">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="캐릭터 이름 검색"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
      </div>

      {/* 갤러리 */}
      {galleryImages
        .filter(character =>
          character.id.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .map(character => (
          <div
            key={character.id}
            className="character-section border-b border-gray-200 pb-4 mb-6"
          >
            <h2
              className="character-name text-2xl font-semibold text-white mb-3 cursor-pointer hover:text-yellow-400"
              onClick={() => handleCharacterClick(character.id)}
            >
              {character.id}
            </h2>
            <div className="images-row flex flex-wrap sm:gap-4 gap-2">
              {character.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`${character.id}-${index}`}
                  className="character-image sm:w-[300px] w-[30%] object-cover rounded-lg shadow-md cursor-pointer hover:opacity-75"
                  onClick={() => setSelectedImage(image)}
                />
              ))}
            </div>
          </div>
        ))}

      {/* 이미지 모달 */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-85"
          onClick={closeModal}
        >
          <div className="relative max-h-screen">
            <img
              src={selectedImage}
              alt="Selected"
              className="max-h-screen object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="w-[50px] h-[50px] flex items-center justify-center absolute top-4 right-4 text-white bg-gray-800 rounded-full hover:bg-gray-700 hover:text-red-500"
              onClick={closeModal}
            >
              <p className="mb-2 text-[36px]">
                &times;
              </p>
            </button>
          </div>
        </div>
      )}

      {/* 캐릭터 디테일 모달 */}
      {currentCharacter && (
        <DetailModalMemo
          onClose={closeModal}
          nowYear={56}
          openModal={handleCharacterClick}
          character={currentCharacter}
        />
      )}
    </div>
  );
};

export default Gallery;