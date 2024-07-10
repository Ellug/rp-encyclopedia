import React, { useState, useEffect } from 'react';
import '../styles/MoogoonghwaGame.css';

const MoogoonghwaGame = () => {
  const initialCharacters = Array(10).fill({ x: 19, y: 0 }).map((pos, index) => ({ ...pos, y: index, name: '' }));
  const [characters, setCharacters] = useState(initialCharacters);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [highlightedCells, setHighlightedCells] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [usedTurns, setUsedTurns] = useState(Array(10).fill(false));
  const [warningRows, setWarningRows] = useState([]);
  const [traps, setTraps] = useState([]);
  const [turnEnded, setTurnEnded] = useState(false);

  useEffect(() => {
    if (currentTurn > 0) {
      const newWarningRows = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => Math.floor(Math.random() * 10));
      setWarningRows(newWarningRows);
    }
  }, [currentTurn]);

  useEffect(() => {
    const randomTraps = Array.from({ length: 10 }, () => ({
      x: Math.floor(Math.random() * 20),
      y: Math.floor(Math.random() * 10)
    }));
    setTraps(randomTraps);
  }, [currentTurn]);

  useEffect(() => {
    if (turnEnded) {
      endTurn();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnEnded]);

  const handleCharacterClick = (index) => {
    if (usedTurns[index]) return;
    const character = characters[index];
    setSelectedCharacter(index);
    const possibleMoves = getPossibleMoves(character);
    setHighlightedCells(possibleMoves);
  };

  const getPossibleMoves = (character) => {
    const moves = [];
    const directions = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ];

    directions.forEach((dir) => {
      const newX = character.x + dir.x;
      const newY = character.y + dir.y;
      if (newX >= 0 && newX < 20 && newY >= 0 && newY < 10) {
        if (!characters.some((char) => char.x === newX && char.y === newY)) {
          moves.push({ x: newX, y: newY });
        }
      }
    });

    return moves;
  };

  const handleCellClick = async (x, y) => {
    if (selectedCharacter !== null && highlightedCells.some(cell => cell.x === x && cell.y === y)) {
      const newCharacters = characters.map((char, index) => {
        if (index === selectedCharacter) {
          const newChar = { ...char, x, y };
          return newChar;
        }
        return char;
      });

      const newUsedTurns = [...usedTurns];
      newUsedTurns[selectedCharacter] = true;

      setCharacters(newCharacters);
      setSelectedCharacter(null);
      setHighlightedCells([]);
      setUsedTurns(newUsedTurns);

      const movedCharacter = newCharacters[selectedCharacter];
      const trapped = traps.find(trap => trap.x === movedCharacter.x && trap.y === movedCharacter.y);
      if (trapped) {
        await handleTrapEvent(trapped, selectedCharacter, newCharacters);
      }

      if (newUsedTurns.every(turn => turn)) {
        setTurnEnded(true);
      }
    }
  };

  const handleTrapEvent = async (trap, index, newCharacters) => {
    const trapIndex = traps.indexOf(trap);
    switch (trapIndex) {
      case 0: case 5:
        alert('매사드의 간지럼 고문 함정에 걸렸다! 뒤로 한칸');
        await moveCharacter(index, 1, 0, newCharacters);
        break;
      case 1: case 6:
        alert('옷이 소멸하는 액체를 맞았다. 뒤로 한칸.');
        await moveCharacter(index, 1, 0, newCharacters);
        break;
      case 2: case 7:
        alert('앞으로 1칸');
        await moveCharacter(index, -1, 0, newCharacters);
        break;
      case 3: case 8:
        alert('인정받을 만한 춤을 춘다!');
        break;
      case 4: case 9:
        alert('팔굽혀펴기 10회, 스쿼트 10회. 뒤로 한칸');
        await moveCharacter(index, 1, 0, newCharacters);
        break;
      case 10: case 11:
        alert('촉수 함정에 빠졌다! 뒤로 한칸')
        await moveCharacter(index, 1, 0, newCharacters);
        break
      case 12: case 13:
        alert('최음 가스 몬스터를 밟았다! 뒤로 한칸')
        await moveCharacter(index, 1, 0, newCharacters);
        break
      case 14: case 15:
        alert('옷이 에이블리의 의복 체인지에 당해 비키니로 변했다. 뒤로 한칸')
        await moveCharacter(index, 1, 0, newCharacters);
        break
      case 16: case 17:
        alert('옷이 에이블리의 의복 체인지에 당해 끈제복으로 변했다. 뒤로 한칸')
        await moveCharacter(index, 1, 0, newCharacters);
        break
      case 18:
        alert('럭키 가속 장치! 앞으로 두칸 이동!')
        await moveCharacter(index, -2, 0, newCharacters);
        break
      case 19:
        alert('강력한 촉수에게 잡혀 희롱당했다. 뒤로 두칸 이동!')
        await moveCharacter(index, -2, 0, newCharacters);
        break

      default:
        break;
    }
  };

  const moveCharacter = async (index, dx, dy, newCharacters) => {
    const updatedCharacters = newCharacters.map((char, charIndex) => {
      if (charIndex === index) {
        let newX = char.x + dx;
        const newY = char.y + dy;

        const isPositionOccupied = (x, y) => newCharacters.some(c => c.x === x && c.y === y);

        while (newX >= 0 && newX < 20 && isPositionOccupied(newX, newY)) {
          newX += dx;
        }

        return { ...char, x: newX, y: newY };
      }
      return char;
    });

    setCharacters(updatedCharacters);
  };

  const endTurn = () => {
    console.log('endTurn 호출됨');
    const newCharacters = characters.map((char) => {
      if (warningRows.includes(char.y) && char.x < 19) {
        console.log(`캐릭터 ${char.name}가 오른쪽으로 이동했습니다.`);
        return { ...char, x: char.x + 1 };
      }
      return char;
    });

    setCharacters(newCharacters);
    
    setUsedTurns(Array(10).fill(false));
    setCurrentTurn(prevTurn => prevTurn + 1);
    setTurnEnded(false); // 턴 종료 후 다시 초기화
    checkVictory();
  };

  const checkVictory = () => {
    const winner = characters.find(char => char.x === 0);
    if (winner) {
      alert(`${winner.name}가 승리했습니다!`);
      resetGame();
    }
  };

  const resetGame = () => {
    const resetCharacters = characters.map((char, index) => ({ ...char, x: 19, y: index }));
    setCharacters(resetCharacters);
    setCurrentTurn(0);
    setUsedTurns(Array(10).fill(false));
    setWarningRows([]);
    setHighlightedCells([]);
    setSelectedCharacter(null);
    setTurnEnded(false); // 초기화
  };

  const handleNameChange = (index, name) => {
    const newCharacters = characters.map((char, i) => {
      if (i === index) {
        return { ...char, name };
      }
      return char;
    });
    setCharacters(newCharacters);
  };

  const shuffleCharacters = () => {
    const shuffledCharacters = [...characters].sort(() => Math.random() - 0.5);
    setCharacters(shuffledCharacters.map((char, index) => ({ ...char, y: index })));
  };

  const renderCells = () => {
    const cells = [];
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 20; col++) {
        const isHighlighted = highlightedCells.some(cell => cell.x === col && cell.y === row);
        const isWarningRow = warningRows.includes(row);
        const isTrap = traps.some(trap => trap.x === col && trap.y === row);
        cells.push(
          <div
            className={`cell ${isHighlighted ? 'highlight' : ''} ${isWarningRow ? 'warning' : ''} ${isTrap ? 'trap' : ''}`}
            key={`${row}-${col}`}
            onClick={() => handleCellClick(col, row)}
          >
            {characters.map((character, index) =>
              character.x === col && character.y === row ? (
                <div className="character" key={index} onClick={() => handleCharacterClick(index)}>
                  {character.name}
                </div>
              ) : null
            )}
          </div>
        );
      }
    }
    return cells;
  };

  return (
    <div className="MGH">
      <div className="sidebar">
        {characters.map((char, index) => (
          <input
            key={index}
            type="text"
            value={char.name}
            onChange={(e) => handleNameChange(index, e.target.value)}
            placeholder={`Character ${index + 1}`}
          />
        ))}
        <button onClick={shuffleCharacters}>Shuffle</button>
        <button onClick={resetGame}>Start Game</button>
      </div>
      <div className="grid">
        {renderCells()}
      </div>
    </div>
  );
};

export default MoogoonghwaGame;
