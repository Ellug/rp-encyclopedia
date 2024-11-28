import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBqSI7llCuPLE2bGFiCzcAbSu_pNS429fw",
  authDomain: "rp-encyclopedia.firebaseapp.com",
  projectId: "rp-encyclopedia",
  storageBucket: "rp-encyclopedia.appspot.com",
  messagingSenderId: "869065784455",
  appId: "1:869065784455:web:10a0c69a57854b8a098c22",
  databaseURL: "https://rp-encyclopedia-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig);
const realtime = getDatabase(app);
const database = initializeFirestore(app, {
  experimentalForceLongPolling: true,
})

export default app
export { database, realtime };