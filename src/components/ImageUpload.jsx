import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import '../styles/ImageUpload.css'
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation'; // 네비게이션 스타일
import 'swiper/css/pagination'; // 페이지네이션 스타일

const ImageUpload = ({ character, editCharacter }) => {
  const [images, setImages] = useState(character.images || []);
  const db = getFirestore();

  // 이미지 크기 조정 함수
  const resizeImage = (file, maxWidth, maxHeight, callback) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
  
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
  
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
  
        canvas.toBlob(callback, 'image/jpeg', 0.7); // JPEG 형식으로 압축
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };
  
  const handleImageChange = async (event) => {
    if (event.target.files && event.target.files[0]) {
      if (images.length >= 2) {
        alert('최대 2개의 이미지만 업로드할 수 있습니다.');
        return;
      }
  
      const file = event.target.files[0];
  
      resizeImage(file, 800, 600, async (blob) => {
        const resizedFile = new File([blob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
  
        const reader = new FileReader();
        reader.onloadend = async () => {
          const newImages = [...images, reader.result];
          setImages(newImages);
    
          // Firestore에 저장할 데이터 업데이트
          const updatedData = {
            ...editCharacter,
            images: newImages
          };
    
          // Firestore에 즉시 저장
          try {
            const newDocId = editCharacter.family ? `${editCharacter.name} ${editCharacter.family}` : editCharacter.name;
            const newDocRef = doc(db, "char", newDocId);
            await setDoc(newDocRef, updatedData);
          } catch (error) {
            console.error("Error saving image to Firestore: ", error);
          }
        };
        reader.readAsDataURL(resizedFile);
      });
    }
  };

  // 이미지 삭제 함수
  const deleteImage = async (index) => {
    const confirmDelete = window.confirm("이미지를 삭제하시겠습니까?");
    if (confirmDelete) {
      const newImages = images.filter((_, i) => i !== index);
      setImages(newImages);
  
      // Firestore 업데이트
      const updatedData = {
        ...editCharacter,
        images: newImages
      };
      const newDocId = editCharacter.family ? `${editCharacter.name} ${editCharacter.family}` : editCharacter.name;
      const newDocRef = doc(db, "char", newDocId);
  
      try {
        await setDoc(newDocRef, updatedData);
      } catch (error) {
        console.error("Error deleting image from Firestore: ", error);
      }
    }
  };


  return (
    <div className='profile-container'>
      <input type="file" onChange={handleImageChange} accept="image/*" />

      <Swiper
        spaceBetween={10}
        slidesPerView={1}
        navigation // 네비게이션 활성화
        pagination={{ clickable: true }} // 페이지네이션 활성화
      >
        {images.map((image, index) => (
          <SwiperSlide key={index}>
            <div className='img-container'>
              <img src={image} alt={`Uploaded ${index}`} />
              <button onClick={() => deleteImage(index)}>
                X
              </button>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default ImageUpload;