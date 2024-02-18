import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import '../styles/ImageUpload.css'
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation'; // 네비게이션 스타일
import 'swiper/css/pagination'; // 페이지네이션 스타일
import { Navigation, Pagination, A11y } from 'swiper';

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
    const files = event.target.files;
    if (files.length + images.length > 3) {
      alert('최대 3개의 이미지만 업로드할 수 있습니다.');
      return;
    }
  
    const resizePromises = Array.from(files).map(file =>
      new Promise(resolve => {
        resizeImage(file, 800, 600, (blob) => {
          const resizedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
  
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result); // 리사이즈된 이미지의 data URL 반환
          };
          reader.readAsDataURL(resizedFile);
        });
      })
    );
  
    try {
      const newImagesDataUrls = await Promise.all(resizePromises);
      const newImages = [...images, ...newImagesDataUrls];
      setImages(newImages);
  
      // Firestore에 저장할 데이터 업데이트
      const updatedData = {
        ...editCharacter,
        images: newImages
      };
  
      // Firestore에 즉시 저장
      const newDocId = editCharacter.family ? `${editCharacter.name} ${editCharacter.family}` : editCharacter.name;
      const newDocRef = doc(db, "char", newDocId);
      await setDoc(newDocRef, updatedData);
    } catch (error) {
      console.error("Error processing images: ", error);
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
      <div className='upload-btn-wrapper'>
        <label htmlFor="file-upload" className="custom-file-upload">
          이미지 업로드
        </label>
        <input id="file-upload" type="file" onChange={handleImageChange} accept="image/*" multiple style={{display: 'none'}} />
      </div>

      <Swiper
        modules={[Navigation, Pagination, A11y]}
        spaceBetween={30}
        slidesPerView={1}
        loop={true}
        navigation
        pagination={{ clickable: true }}
        // onSlideChange={(swiper) => setCurrentSlide(swiper.activeIndex)}
      >
        {images.map((image, index) => (
          <SwiperSlide key={image}>
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