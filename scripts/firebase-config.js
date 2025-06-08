import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAPsGrrNzqw7l0ld5SiVVSvuI2WD7qCcko",
    authDomain: "workmoyu-games.firebaseapp.com",
    projectId: "workmoyu-games",
    storageBucket: "workmoyu-games.firebasestorage.app",
    messagingSenderId: "576763889820",
    appId: "1:576763889820:web:d0ff6040323a0548198559",
    measurementId: "G-CZ1CZ9C32Q"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 将文件转换为base64
async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// 压缩图片
async function compressImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // 如果图片大于800px，按比例缩小
                const maxSize = 800;
                if (width > maxSize || height > maxSize) {
                    if (width > height) {
                        height = Math.round((height * maxSize) / width);
                        width = maxSize;
                    } else {
                        width = Math.round((width * maxSize) / height);
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // 转换为base64，使用0.8的质量压缩
                const base64 = canvas.toDataURL('image/jpeg', 0.8);
                resolve(base64);
            };
        };
    });
}

// 游戏数据 CRUD 操作
export const gamesAPI = {
    // 获取所有游戏
    async getAllGames() {
        const gamesCol = collection(db, 'games');
        const snapshot = await getDocs(gamesCol);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    },

    // 获取特定分类的游戏
    async getGamesByCategory(category) {
        const gamesCol = collection(db, 'games');
        const snapshot = await getDocs(gamesCol);
        return snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            .filter(game => game.category === category);
    },

    // 添加新游戏
    async addGame(gameData) {
        const gamesCol = collection(db, 'games');
        
        // 如果有图片文件，转换为base64
        if (gameData.imageFile) {
            const compressedImage = await compressImage(gameData.imageFile);
            gameData.imageUrl = compressedImage;
            delete gameData.imageFile;
        }

        const docRef = await addDoc(gamesCol, {
            ...gameData,
            createdAt: new Date(),
            updatedAt: new Date(),
            views: 0,
            likes: 0
        });
        return docRef.id;
    },

    // 更新游戏信息
    async updateGame(gameId, gameData) {
        const gameRef = doc(db, 'games', gameId);
        
        // 如果有新的图片文件，转换为base64
        if (gameData.imageFile) {
            const compressedImage = await compressImage(gameData.imageFile);
            gameData.imageUrl = compressedImage;
            delete gameData.imageFile;
        }

        await updateDoc(gameRef, {
            ...gameData,
            updatedAt: new Date()
        });
    },

    // 删除游戏
    async deleteGame(gameId) {
        const gameRef = doc(db, 'games', gameId);
        await deleteDoc(gameRef);
    }
}; 