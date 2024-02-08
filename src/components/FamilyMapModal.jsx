import React from 'react';
import '../styles/FamilyMapModal.css';

const FamilyMapModal = ({ character, onClose }) => {
  // 가계도 그리기 로직

  return (
    <div className="family-map-modal-background" onClick={onClose}>
      <div className="family-map-modal-content" onClick={e => e.stopPropagation()}>
        <span className="map-close" onClick={onClose}>&times;</span>
        
        <div className="family-map">
          <div className='map-up'>
            <span className='map-parent'>{character.parent}</span>
          </div>
          <div className="map-side">
            <span className="map-name">{character.name}</span>
            <span className="map-brother">{character.brother}</span>
          </div>
          <div className='map-dwon'>
            <span className='map-child'>{character.child}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FamilyMapModal;
