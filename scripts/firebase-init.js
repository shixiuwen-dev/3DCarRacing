import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const firebaseConfig = {
    // 请将这里替换为您从 Firebase Console 复制的配置
    apiKey: "AIzaSyDQJZXPgYrXpbKBBZHKZhc7XDWlnqR7iAo",
    authDomain: "workmoyu-games.firebaseapp.com",
    projectId: "workmoyu-games",
    storageBucket: "workmoyu-games.appspot.com",
    messagingSenderId: "1082880009453",
    appId: "1:1082880009453:web:c2a5c5f7c2f2d2b3b3b3b3",
    measurementId: "G-WHGEE36CNX"
};

// 初始化 Firebase
console.log('Initializing Firebase...');
const app = initializeApp(firebaseConfig);

// 获取 Firestore 实例
console.log('Getting Firestore instance...');
const db = getFirestore(app);
console.log('Firebase initialization complete');

export { db }; 