// Firebase configuration and initialization
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, updateDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-init.js';

// 初始化 Firebase
console.log('Initializing Firebase...');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
console.log('Firebase initialized');

// 更新状态显示
function updateStatus(message, isError = false) {
    const statusDiv = document.getElementById('status');
    const resultsDiv = document.getElementById('results');
    
    if (statusDiv) {
        statusDiv.innerHTML = `
            <p class="${isError ? 'text-red-500' : 'text-green-500'}">${message}</p>
        `;
    }
    
    if (resultsDiv && !isError) {
        const p = document.createElement('p');
        p.textContent = message;
        p.className = 'text-gray-300';
        resultsDiv.appendChild(p);
    }
}

// 示例游戏数据
const sampleGames = [
    {
        title: "3D Racing Challenge",
        description: "Experience high-speed racing action in this thrilling 3D racing game! Master different tracks, upgrade your cars, and compete against skilled opponents.",
        thumbnail: "https://images.crazygames.com/super-racing-gt-drag-pro/20230706115004/super-racing-gt-drag-pro-cover",
        category: "racing",
        slug: "3d-racing-challenge",
        embedUrl: "https://games.crazygames.com/en_US/super-racing-gt-drag-pro/index.html",
        plays: 62000,
        rating: 4.5,
        searchTerms: ["racing", "3d", "cars", "speed", "competition"],
        howToPlay: [
            "Use arrow keys or WASD to control your car",
            "Press SPACE to use nitro boost",
            "Collect power-ups to gain advantages",
            "Complete laps as fast as possible"
        ],
        features: [
            "Multiple race tracks",
            "Car customization",
            "Real-time multiplayer",
            "Global leaderboards"
        ],
        createdAt: serverTimestamp()
    },
    {
        title: "Space Shooter",
        description: "Defend the galaxy in this classic space shooter! Upgrade your ship, collect power-ups, and defeat waves of alien invaders.",
        thumbnail: "https://images.crazygames.com/games/space-shooter/cover-1583232391642",
        category: "action",
        slug: "space-shooter",
        embedUrl: "https://games.crazygames.com/en_US/space-shooter/index.html",
        plays: 35000,
        rating: 4.3,
        searchTerms: ["space", "shooter", "arcade", "aliens", "action"],
        howToPlay: [
            "Use mouse to aim and shoot",
            "Move with WASD or arrow keys",
            "Collect power-ups to upgrade weapons",
            "Avoid enemy projectiles"
        ],
        features: [
            "Multiple weapon types",
            "Boss battles",
            "Power-up system",
            "Progressive difficulty"
        ],
        createdAt: serverTimestamp()
    },
    {
        title: "Pixel Jumper",
        description: "Jump and run through challenging pixel art levels in this retro-style platformer!",
        thumbnail: "https://images.crazygames.com/games/pixel-jumper/cover-1583232391642",
        category: "arcade",
        slug: "pixel-jumper",
        embedUrl: "https://games.crazygames.com/en_US/pixel-jumper/index.html",
        plays: 28000,
        rating: 4.2,
        searchTerms: ["platformer", "pixel", "retro", "jump", "run"],
        howToPlay: [
            "Use arrow keys to move",
            "Press SPACE to jump",
            "Collect coins for extra points",
            "Avoid obstacles and enemies"
        ],
        features: [
            "Multiple levels",
            "Retro pixel graphics",
            "Power-ups",
            "Level editor"
        ],
        createdAt: serverTimestamp()
    },
    {
        title: "Zombie Survival",
        description: "Survive the zombie apocalypse in this intense action game! Scavenge for resources, craft weapons, and defend against hordes of undead.",
        thumbnail: "https://images.crazygames.com/games/zombie-survival/cover-1583232391642",
        category: "action",
        slug: "zombie-survival",
        embedUrl: "https://games.crazygames.com/en_US/zombie-survival/index.html",
        plays: 42000,
        rating: 4.4,
        searchTerms: ["zombie", "survival", "action", "horror", "crafting"],
        howToPlay: [
            "WASD to move, SPACE to jump",
            "Left click to attack",
            "E to interact with objects",
            "Q to switch weapons"
        ],
        features: [
            "Day/night cycle",
            "Crafting system",
            "Character progression",
            "Base building"
        ],
        createdAt: serverTimestamp()
    },
    {
        title: "Strategy Commander",
        description: "Lead your armies to victory in this epic strategy game! Build your base, train units, and conquer territories.",
        thumbnail: "https://images.crazygames.com/games/strategy-commander/cover-1583232391642",
        category: "strategy",
        slug: "strategy-commander",
        embedUrl: "https://games.crazygames.com/en_US/strategy-commander/index.html",
        plays: 25000,
        rating: 4.6,
        searchTerms: ["strategy", "war", "commander", "army", "base"],
        howToPlay: [
            "Click to select units",
            "Right click to move or attack",
            "Use hotkeys for quick commands",
            "Build and manage your base"
        ],
        features: [
            "Multiple factions",
            "Campaign mode",
            "Multiplayer battles",
            "Resource management"
        ],
        createdAt: serverTimestamp()
    },
    {
        title: "Puzzle Master",
        description: "Challenge your mind with this engaging puzzle game! Solve increasingly difficult puzzles and unlock new levels.",
        thumbnail: "https://images.crazygames.com/games/puzzle-master/cover-1583232391642",
        category: "puzzle",
        slug: "puzzle-master",
        embedUrl: "https://games.crazygames.com/en_US/puzzle-master/index.html",
        plays: 31000,
        rating: 4.7,
        searchTerms: ["puzzle", "brain", "logic", "mind", "challenge"],
        howToPlay: [
            "Click to select pieces",
            "Drag and drop to solve puzzles",
            "Use hints when stuck",
            "Complete levels to progress"
        ],
        features: [
            "100+ levels",
            "Progressive difficulty",
            "Achievement system",
            "Daily challenges"
        ],
        createdAt: serverTimestamp()
    }
];

// 清除现有数据
export async function clearExistingData() {
    try {
        updateStatus('Clearing existing data...');
        console.log('Starting to clear existing data...');
        
        const gamesSnapshot = await getDocs(collection(db, 'games'));
        console.log(`Found ${gamesSnapshot.size} existing games to delete`);
        
        const deletePromises = [];
        gamesSnapshot.forEach(doc => {
            console.log(`Deleting game: ${doc.id}`);
            deletePromises.push(deleteDoc(doc.ref));
        });
        
        await Promise.all(deletePromises);
        console.log('All existing data cleared successfully');
        updateStatus('Existing data cleared successfully');
        return true;
    } catch (error) {
        console.error('Error clearing data:', error);
        updateStatus(`Error clearing data: ${error.message}`, true);
        throw error;
    }
}

// 更新游戏的播放次数
async function updateGamePlays() {
    try {
        updateStatus('Updating game plays...');
        console.log('Starting to update game plays...');
        
        const gamesSnapshot = await getDocs(collection(db, 'games'));
        console.log(`Found ${gamesSnapshot.size} games to update`);
        
        const updatePromises = [];
        gamesSnapshot.forEach(doc => {
            const plays = Math.floor(Math.random() * 100000); // 随机生成 0-100000 的播放次数
            console.log(`Updating plays for game ${doc.id} to ${plays}`);
            updatePromises.push(updateDoc(doc.ref, { 
                plays,
                updatedAt: serverTimestamp()
            }));
        });
        
        await Promise.all(updatePromises);
        console.log('All game plays updated successfully');
        updateStatus('Game plays updated successfully');
        return true;
    } catch (error) {
        console.error('Error updating game plays:', error);
        updateStatus(`Error updating game plays: ${error.message}`, true);
        throw error;
    }
}

// 初始化数据
export async function initializeData() {
    try {
        updateStatus('Starting data initialization...');
        console.log('Starting data initialization...');
        
        // 清除现有数据
        await clearExistingData();
        
        // 添加新的示例数据
        updateStatus('Adding sample games...');
        console.log('Adding new games...');
        
        for (const game of sampleGames) {
            console.log(`Adding game: ${game.title}`);
            const docRef = await addDoc(collection(db, 'games'), game);
            console.log(`Added game: ${game.title} with ID: ${docRef.id}`);
            updateStatus(`Added game: ${game.title}`);
        }
        
        // 更新游戏的播放次数
        await updateGamePlays();
        
        console.log('All games added successfully');
        updateStatus('✅ All games added successfully! You can now return to the homepage.');
        
        // 添加返回首页的链接
        const resultsDiv = document.getElementById('results');
        if (resultsDiv) {
            resultsDiv.innerHTML += `
                <div class="mt-8">
                    <a href="/" class="bg-gaming-primary hover:bg-gaming-primary/80 px-6 py-3 rounded-lg transition inline-block">
                        Return to Homepage
                    </a>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error in data initialization:', error);
        updateStatus(`Error initializing data: ${error.message}`, true);
    }
}

// 自动初始化已移除，现在通过手动点击按钮触发

// 导出所有需要的函数
export { updateStatus, updateGamePlays }; 