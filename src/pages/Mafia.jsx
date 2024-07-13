import React, { useState, useEffect, useRef } from 'react';
import { updateDoc, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { database } from '../firebaseConfig';
import '../styles/Mafia.css';

const Mafia = () => {
  const [characters, setCharacters] = useState([]);
  const [name, setName] = useState('');
  const [script, setScript] = useState([]);
  const [numMafia, setNumMafia] = useState(2);
  const [numDoctors, setNumDoctors] = useState(1);
  const [numPolice, setNumPolice] = useState(1);
  const scriptEndRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(database, 'mafia', 'gameState'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setCharacters(data.characters || []);
        setScript(data.script || []);
      }
    });

    return () => unsubscribe();
  }, []);

  const scrollToBottom = () => {
    scriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [script]);

  useEffect(() => {
    if (characters.filter(character => character.role.startsWith('mafia')).length >= 1) {
      checkForWinner(characters);
    }
  }, [characters]);

  const addCharacter = async (e) => {
    e.preventDefault();
    if (name) {
      const newCharacters = [...characters, { name, status: 'alive', role: 'villager' }];
      setCharacters(newCharacters);
      setName('');

      await setDoc(doc(database, 'mafia', 'gameState'), {
        characters: newCharacters,
        script
      });
    }
  };

  const checkForWinner = (newCharacters) => {
    const aliveCharacters = newCharacters.filter(character => character.status === 'alive');
    const mafiaCharacters = aliveCharacters.filter(character => character.role.startsWith('mafia'));
    const nonMafiaCharacters = aliveCharacters.filter(character => !character.role.startsWith('mafia'));

    if (mafiaCharacters.length < 1 && nonMafiaCharacters.length < 1) {
      setScript(prev => [...prev, '마피아와 시민이 모두 사망했습니다. 게임은 무승부입니다.', '--- 게임 시작 버튼을 눌러 다시 시작 가능']);
      return true;
    }

    if (mafiaCharacters.length < 1) {
      setScript(prev => [...prev, '마피아가 모두 사망했습니다. 시민의 승리입니다.', '--- 게임 시작 버튼을 눌러 다시 시작 가능']);
      return true;
    }

    if (nonMafiaCharacters.length < 1) {
      setScript(prev => [...prev, '시민이 모두 사망했습니다. 마피아의 승리입니다.', '--- 게임 시작 버튼을 눌러 다시 시작 가능']);
      return true;
    }

    return false;
  };

  const toggleStatus = async (index) => {
    const character = characters[index];
    const confirmMessage = character.status === 'alive'
      ? `${character.name}를 죽이겠습니까?`
      : `${character.name}를 부활시키겠습니까?`;

    if (window.confirm(confirmMessage)) {
      const newCharacters = characters.map((character, i) => {
        if (i === index) {
          const newStatus = character.status === 'alive' ? 'dead' : 'alive';
          return {
            ...character,
            status: newStatus
          };
        }
        return character;
      });

      const newScript = character.status === 'alive'
        ? `투표로 인해 ${character.name}가 죽었습니다. (${character.role.startsWith('mafia') ? '마피아' : '시민'})`
        : `${character.name}가 부활했습니다.`;

      setCharacters(newCharacters);
      setScript(prev => [...prev, newScript, '-------']);

      await updateDoc(doc(database, 'mafia', 'gameState'), {
        characters: newCharacters,
        script: [...script, newScript, '-------']
      });
    }
  };

  const assignRoles = async () => {
    let newCharacters = characters.map(character => ({
      ...character,
      status: 'alive',
      role: 'villager'
    }));

    const shuffle = (array) => array.sort(() => Math.random() - 0.5);

    const roles = [
      ...Array(numMafia).fill().map((_, i) => `mafia${i + 1}`),
      ...Array(numDoctors).fill().map((_, i) => `doctor${i + 1}`),
      ...Array(numPolice).fill().map((_, i) => `police${i + 1}`)
    ];

    const additionalVillagers = new Array(newCharacters.length - roles.length).fill('villager');
    const allRoles = shuffle(roles.concat(additionalVillagers));

    newCharacters = newCharacters.map((character, index) => ({
      ...character,
      role: allRoles[index]
    }));

    setCharacters(newCharacters);
    setScript([]);

    await setDoc(doc(database, 'mafia', 'gameState'), {
      characters: newCharacters,
      script: []
    });
  };

  const resetCharacters = async () => {
    setCharacters([]);
    setScript([]);
    await setDoc(doc(database, 'mafia', 'gameState'), {
      characters: [],
      script: []
    });
  };

  const proceedTurn = async () => {
    let newCharacters = [...characters];
    let newScript = [];
    const aliveCharacters = newCharacters.filter(character => character.status === 'alive');
    const mafiaCharacters = aliveCharacters.filter(character => character.role.startsWith('mafia'));
    const nonMafiaCharacters = aliveCharacters.filter(character => !character.role.startsWith('mafia'));
    const doctors = aliveCharacters.filter(character => character.role.startsWith('doctor'));

    const shuffle = (array) => array.sort(() => Math.random() - 0.5);

    let targets = shuffle(nonMafiaCharacters).slice(0, mafiaCharacters.length);

    doctors.forEach((doctor, i) => {
      const protectedCharacter = shuffle(aliveCharacters)[0];
      newScript.push(`의사${i + 1}가 ${protectedCharacter.name}를 보호했습니다.`);
      targets = targets.filter(target => target.name !== protectedCharacter.name);
    });

    targets.forEach((target, i) => {
      const attacker = mafiaCharacters[i % mafiaCharacters.length];
      if (target.role.startsWith('police')) {
        newScript.push(`마피아가 경찰 ${target.name}를 공격했습니다. 경찰과 마피아 ${attacker.name}가 죽었습니다.`);
        newCharacters = newCharacters.map(character => {
          if (character.name === target.name || character.name === attacker.name) {
            return { ...character, status: 'dead' };
          }
          return character;
        });
      } else {
        newScript.push(`마피아가 ${target.name}를 공격했습니다.`);
        newCharacters = newCharacters.map(character => {
          if (character.name === target.name) {
            return { ...character, status: 'dead' };
          }
          return character;
        });
      }
    });

    newScript.push('-------');
    setCharacters(newCharacters);
    setScript(prev => [...prev, ...newScript]);

    await updateDoc(doc(database, 'mafia', 'gameState'), {
      characters: newCharacters,
      script: [...script, ...newScript]
    });
  };

  const radius = 348;

  return (
    <div className="mafia-container">
      <div className="mafia">
        <div className="circle">
          {characters && characters.map((character, index) => {
            const angle = (index / characters.length) * 2 * Math.PI;
            const x = (radius + 50) * Math.cos(angle) + radius;
            const y = (radius + 50) * Math.sin(angle) + radius;

            return (
              <div
                key={index}
                onClick={() => toggleStatus(index)}
                className={`character ${character.status}`}
                style={{
                  top: `${y}px`,
                  left: `${x}px`,
                }}
              >
                {character.name} <br /> {character.status === 'dead' ? `(${character.role})` : ''}
              </div>
            );
          })}
          <button
            className="turn-button"
            onClick={proceedTurn}
            disabled={
              characters.filter(c => c.role.startsWith('mafia') && c.status === 'alive').length < 1 ||
              characters.filter(c => !c.role.startsWith('mafia') && c.status === 'alive').length < 1
            }
          >
            턴 진행
          </button>
        </div>
      </div>
      <aside className="sidebar">
        <div className="fixed-button">
          <form onSubmit={addCharacter} className="input-form">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="캐릭터 이름 입력"
            />
            <select value={numMafia} onChange={(e) => setNumMafia(Number(e.target.value))}>
              {[...Array(5)].map((_, i) => (
                <option key={i} value={i + 1}>마피아 {i + 1}</option>
              ))}
            </select>
            <select value={numDoctors} onChange={(e) => setNumDoctors(Number(e.target.value))}>
              {[...Array(3)].map((_, i) => (
                <option key={i} value={i + 1}>의사 {i + 1}</option>
              ))}
            </select>
            <select value={numPolice} onChange={(e) => setNumPolice(Number(e.target.value))}>
              {[...Array(3)].map((_, i) => (
                <option key={i} value={i + 1}>경찰 {i + 1}</option>
              ))}
            </select>
            <button type="submit">추가</button>
          </form>
          <div className='startBtn'>
            <button onClick={assignRoles} disabled={characters.length <= 2}>
              게임 시작
            </button>
            <button onClick={resetCharacters}>
              캐릭터 리셋
            </button>
          </div>
        </div>
        <div className="script">
          {script && script.map((line, index) => (
            <p key={index}>{line}</p>
          ))}
          <div ref={scriptEndRef} />
        </div>
      </aside>
    </div>
  );
};

export default Mafia;
