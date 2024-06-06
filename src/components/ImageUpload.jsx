import React, { useState } from 'react';
import { arrayRemove, doc, setDoc, updateDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import '../styles/ImageUpload.css';
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';

const ImageUpload = ({ character, editCharacter }) => {
  const [images, setImages] = useState(character.images || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const db = getFirestore();
  const storage = getStorage();

  const handleImageUpload = async (event) => {
    const files = event.target.files;
    if (!files.length) return;
  
    const newImages = [];
    Array.from(files).forEach(file => {
      const storageRef = ref(storage, `charactersIMG/${character.name} ${character.family}/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
  
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
        }, 
        (error) => {
          console.error('Upload failed:', error);
          alert('Upload failed, please check the console for more details.');
        }, 
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            newImages.push(downloadURL);
            if (newImages.length === files.length) {
              const updatedCharacterData = {
                ...editCharacter,
                images: [...images, ...newImages]
              };
              setImages(updatedCharacterData.images);
              const docRef = doc(db, 'character_details', `${character.name} ${character.family}`);
              setDoc(docRef, updatedCharacterData, { merge: true }).then(() => {
                console.log('Document successfully updated with new images');
              }).catch((error) => {
                console.error("Error updating document: ", error);
                alert('Failed to update Firestore document, please check the console for more details.');
              });
            }
          }).catch((error) => {
            console.error('Error getting download URL:', error);
            alert('Failed to get download URL, please check the console for more details.');
          });
        }
      );
    });
  };
  
  const deleteImage = async (index) => {
    if (!window.confirm("정말로 삭제하시겠습니까?")) {
      return;
    }
    const imageUrl = images[index];
    const storageRef = ref(storage, imageUrl);
  
    try {
      await deleteObject(storageRef);
      console.log('File deleted successfully');
      const updatedImages = images.filter((_, i) => i !== index);
      setImages(updatedImages);
      setCurrentIndex(currentIndex > 0 ? currentIndex - 1 : 0);
  
      const docId = character.family ? `${character.name} ${character.family}` : character.name;
      const docRef = doc(db, 'character_details', docId);
      await updateDoc(docRef, {
        images: arrayRemove(imageUrl)
      });
    } catch (error) {
      console.error('Error removing image:', error);
      alert('이미지 삭제 실패. 다시 시도해주세요.');
    }
  };
  

  const nextImage = () => {
    setCurrentIndex((currentIndex + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((currentIndex - 1 + images.length) % images.length);
  };

  return (
    <div className='ImageUpload'>
      <div className='upload-btn-wrapper'>
        <label htmlFor="file-upload" className="custom-file-upload">
          이미지 업로드
        </label>
        <input id="file-upload" type="file" onChange={handleImageUpload} accept="image/*" multiple style={{display: 'none'}} />
      </div>

      {images.length > 0 && (
        <div className='image-slider'>
          <button className='stepBtn' onClick={prevImage}>&lt;</button>
          <img src={images[currentIndex]} alt={`Uploaded ${currentIndex}`} />
          <button className='stepBtn' onClick={nextImage}>&gt;</button>
          <button className="delete-btn" onClick={() => deleteImage(currentIndex)}>삭제</button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
