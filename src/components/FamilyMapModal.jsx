import React from 'react';
import '../styles/FamilyMapModal.css';

const FamilyMapModal = ({ character, onClose }) => {
  
  // Helper function to create divs for each name
  const createDivs = (names) => {
    return names.split(', ').map((name, index) => (
      <div key={index}>{name}</div>
    ));
  };

  return (
    <div className="family-map-modal-background" onClick={onClose}>
      <div className="family-map-modal-content" onClick={e => e.stopPropagation()}>
        <div className="map-close" onClick={onClose}>&times;</div>
        
        <div className="family-map">
          <div className='map-up'>
            {createDivs(character.parent)}
          </div>
          <div className="map-side">
            <div className="map-name">{character.name}</div>
            {createDivs(character.brother)}
          </div>
          <div className='map-down'>
            {createDivs(character.child)}
          </div>
        </div>

      </div>
    </div>
  );
};

export default FamilyMapModal;
