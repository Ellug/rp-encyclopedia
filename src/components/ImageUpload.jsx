import React, { useState } from 'react';
import { arrayRemove, doc, setDoc, updateDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';

const ImageUpload = ({ character, editCharacter }) => {
  const [images, setImages] = useState(character.images || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false); // 드래그 상태 추가
  const db = getFirestore();
  const storage = getStorage();

  const docId = character.family ? `${character.name} ${character.family}` : character.name;
  const folderPath = `charactersIMG/${docId}`;

  const syncGallery = async (updatedImages) => {
    try {
      await setDoc(
        doc(db, 'Gallery', docId),
        { images: updatedImages },
        { merge: true }
      );
      console.log('Gallery successfully updated');
    } catch (error) {
      console.error('Error updating Gallery collection:', error);
    }
  };

  const handleImageUpload = async (files) => {
    if (!files.length) return;

    setIsUploading(true);
    const newImages = [];

    for (const file of files) {
      const storageRef = ref(storage, `${folderPath}/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      try {
        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            null,
            reject,
            () => {
              getDownloadURL(uploadTask.snapshot.ref)
                .then((downloadURL) => {
                  newImages.push(downloadURL);
                  resolve();
                })
                .catch(reject);
            }
          );
        });
      } catch (error) {
        console.error('Upload failed:', error);
        alert('이미지 업로드 중 오류가 발생했습니다.');
      }
    }

    if (newImages.length > 0) {
      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);

      const updatedCharacterData = {
        ...editCharacter,
        images: updatedImages,
      };

      try {
        await setDoc(doc(db, 'character_details', docId), updatedCharacterData, { merge: true });
        console.log('Firestore successfully updated with new images');
        await syncGallery(updatedImages);
      } catch (error) {
        console.error('Error updating Firestore document:', error);
        alert('Firestore 업데이트 실패.');
      }
    }
    setIsUploading(false);
  };

  const deleteImage = async (index) => {
    if (!window.confirm('정말로 삭제하시겠습니까?')) return;

    const imageUrl = images[index];
    const storageRef = ref(storage, imageUrl);

    try {
      await deleteObject(storageRef);
      const updatedImages = images.filter((_, i) => i !== index);
      setImages(updatedImages);
      setCurrentIndex((currentIndex - 1 + updatedImages.length) % updatedImages.length);

      await updateDoc(doc(db, 'character_details', docId), {
        images: arrayRemove(imageUrl),
      });
      console.log('Image successfully deleted from character_details');
      await syncGallery(updatedImages);
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('이미지 삭제 실패.');
    }
  };

  const nextImage = () => {
    setCurrentIndex((currentIndex + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((currentIndex - 1 + images.length) % images.length);
  };

  // 드래그 앤 드롭 이벤트 핸들러
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    handleImageUpload(files);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div
        className={`w-full flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 ${
          isDragOver ? 'border-yellow-400 bg-yellow-100' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p className="text-gray-500 mb-2">이미지를 드래그하여 업로드하세요</p>
        <label
          htmlFor="file-upload"
          className="cursor-pointer bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800 transition"
        >
          파일 선택
        </label>
        <input
          id="file-upload"
          type="file"
          onChange={(e) => handleImageUpload(e.target.files)}
          accept="image/*"
          multiple
          className="hidden"
        />
      </div>

      {isUploading && <p className="text-gray-500">이미지 업로드 중...</p>}

      {images.length > 0 && (
        <div className="relative w-full max-w-md">
          <div className="flex justify-center items-center">
            <button
              onClick={prevImage}
              className="absolute left-[-40px] top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700"
            >
              &lt;
            </button>
            <img
              src={images[currentIndex]}
              alt={`Uploaded ${currentIndex}`}
              className="w-full max-h-[500px] object-contain rounded shadow"
            />
            <button
              onClick={nextImage}
              className="absolute right-[-40px] top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700"
            >
              &gt;
            </button>
          </div>
          <button
            onClick={() => deleteImage(currentIndex)}
            className="mt-4 w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
          >
            삭제
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;