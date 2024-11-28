import React, { useState, useEffect } from 'react';
import { getDatabase, ref, set, update, onValue, remove, push, get, } from 'firebase/database';
import app from '../firebaseConfig';

const AudioLink = () => {
  const [isHost, setIsHost] = useState(false);
  const [isViewer, setIsViewer] = useState(false);
  const [peerConnection, setPeerConnection] = useState(null);
  const [audioStream, setAudioStream] = useState(null);
  const [hostIP, setHostIP] = useState(null);
  const [viewers, setViewers] = useState([]);
  const db = getDatabase(app);
  const roomRef = ref(db, 'audioRoom');

  useEffect(() => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
  
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidateRef = push(ref(db, 'audioRoom/iceCandidates'));
        set(candidateRef, event.candidate.toJSON());
      }
    };
  
    pc.ontrack = (event) => {
      const audio = new Audio();
      audio.srcObject = event.streams[0];
      audio.play();
    };
  
    setPeerConnection(pc);
  
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val() || {};
  
      setHostIP(data.hostIP || null);
  
      // Safely handle viewers field
      const viewersList = Array.isArray(data.viewers)
        ? data.viewers
        : typeof data.viewers === 'string'
        ? data.viewers.split(',').filter(Boolean) // Convert string to array
        : []; // Default to empty array for invalid types
  
      setViewers(viewersList);
    });
  
    return () => {
      pc.close();
      unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);  

  // 방장이 되는 함수
  const becomeHost = async () => {
    const roomSnapshot = await get(roomRef);
    if (roomSnapshot.exists() && roomSnapshot.val().hostIP) {
      alert('A host is already present in this room.');
      return;
    }
  
    setIsHost(true);
  
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ audio: true });
      setAudioStream(stream);
  
      stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
  
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
  
      await set(roomRef, {
        hostIP: 'Host-IP', // Replace with actual host identification
        offer: {
          type: offer.type,
          sdp: offer.sdp,
        },
        viewers: '',
        iceCandidates: '',
      });
    } catch (error) {
      if (error.name === 'NotAllowedError' || error.name === 'NotFoundError') {
        alert('Audio sharing was canceled or not allowed.'); // 사용자 친화적인 메시지 제공
      } else {
        console.error('Error starting host:', error); // 예상치 못한 에러는 콘솔에 로깅
      }
  
      // 상태 초기화
      setIsHost(false);
    }
  };  

  // 시청자로 참여하는 함수
  const joinAsViewer = async () => {
    const roomSnapshot = await get(roomRef);
    if (!roomSnapshot.exists() || !roomSnapshot.val().hostIP) {
      alert('No host is currently in this room.');
      return;
    }
  
    setIsViewer(true);
    const data = roomSnapshot.val();
  
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
  
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
  
    await update(roomRef, {
      answer: {
        type: answer.type,
        sdp: answer.sdp,
      },
      viewers: [...(data.viewers || []), 'Viewer-IP'], // Replace 'Viewer-IP' with the actual IP or ID
    });
  
    onValue(ref(db, 'audioRoom/iceCandidates'), (snapshot) => {
      const candidates = snapshot.val() || {};
      Object.values(candidates).forEach((candidate) => {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      });
    });
  };
  
  

  // 방을 떠나는 함수
  const leaveRoom = async () => {
    if (isHost) {
      await remove(roomRef);
      audioStream?.getTracks().forEach((track) => track.stop());
    }

    if (isViewer) {
      const viewersRef = ref(db, 'audioRoom/viewers');
      const snapshot = await get(viewersRef);
      if (snapshot.exists()) {
        const viewers = snapshot.val()?.split(',') || [];
        const updatedViewers = viewers.filter((viewer) => viewer !== 'Viewer-IP'); // Replace with actual identification
        await set(viewersRef, updatedViewers.join(','));
      }
    }

    setIsHost(false);
    setIsViewer(false);
  };

  return (
    <div className="p-6 px-[20%] space-y-6">
      <h1 className="text-2xl font-bold">Audio Link</h1>

      <div className="flex flex-col space-y-4">
        <div className="p-4 border rounded bg-gray-100">
          <h2 className="text-lg text-black font-semibold">Host</h2>
          {hostIP ? (
            <div>
              <p className="text-gray-700">Host IP: {hostIP}</p>
              {isHost && (
                <button
                  onClick={leaveRoom}
                  className="px-4 py-2 mt-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Leave Host
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={becomeHost}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Become Host
            </button>
          )}
        </div>

        <div className="p-4 border rounded bg-gray-100">
          <h2 className="text-lg text-black font-semibold">Viewers</h2>
          <ul className="list-disc list-inside text-gray-700">
            {viewers.map((viewer, index) => (
              <li key={index}>{viewer}</li>
            ))}
          </ul>
          {!isViewer && (
            <button
              onClick={joinAsViewer}
              className="px-4 py-2 mt-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Join as Viewer
            </button>
          )}
          {isViewer && (
            <button
              onClick={leaveRoom}
              className="px-4 py-2 mt-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Leave Viewer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioLink;