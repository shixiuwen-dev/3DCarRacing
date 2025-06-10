import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDQJZXPgYrXpbKBBZHKZhc7XDWlnqR7iAo",
    authDomain: "workmoyu-games.firebaseapp.com",
    projectId: "workmoyu-games",
    storageBucket: "workmoyu-games.appspot.com",
    messagingSenderId: "1082880009453",
    appId: "1:1082880009453:web:c2a5c5f7c2f2d2b3b3b3b3",
    measurementId: "G-WHGEE36CNX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM 元素
const newGamesSection = document.getElementById('new-games');
const popularGamesSection = document.getElementById('popular');
const searchInput = document.getElementById('game-search');

// 创建游戏卡片HTML
function createGameCard(game) {
    return `
        <div class="bg-black/30 rounded-xl overflow-hidden group">
            <div class="aspect-video relative overflow-hidden">
                <img src="${game.thumbnail}" 
                     alt="${game.title}" 
                     class="w-full h-full object-cover transform group-hover:scale-110 transition duration-300">
            </div>
            <div class="p-4">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-lg font-bold">${game.title}</h3>
                    <span class="px-2 py-1 bg-gaming-primary/20 rounded text-sm">${game.category}</span>
                </div>
                <p class="text-sm text-gray-300 mt-1">${game.description}</p>
                <div class="flex items-center justify-between mt-4">
                    <span class="text-sm text-gray-400">${formatPlays(game.plays)} plays</span>
                    <a href="/games/${game.slug}" data-route class="bg-gaming-primary hover:bg-gaming-primary/80 px-4 py-2 rounded-lg transition">Play</a>
                </div>
            </div>
        </div>
    `;
}

// 格式化游戏播放次数
function formatPlays(plays) {
    if (!plays) return '0';
    if (plays >= 1000) {
        return Math.floor(plays / 1000) + 'K+';
    }
    return plays.toString();
}

// 加载游戏
async function loadGames() {
    try {
        console.log('Starting to load games...');
        
        // Get new games
        const newGamesQuery = query(
            collection(db, 'games'),
            orderBy('createdAt', 'desc'),
            limit(4)
        );
        
        console.log('Fetching new games...');
        const newGamesSnapshot = await getDocs(newGamesQuery);
        const newGamesContainer = document.querySelector('#new-games .grid');
        
        if (newGamesSnapshot.empty) {
            console.log('No new games found in database');
            // Keep loading skeletons visible
        } else {
            console.log(`Found ${newGamesSnapshot.size} new games`);
            newGamesContainer.innerHTML = '';
            newGamesSnapshot.forEach(doc => {
                const game = doc.data();
                console.log('New game:', game.title);
                newGamesContainer.innerHTML += createGameCard(game);
            });
        }

        // Get popular games
        const popularGamesQuery = query(
            collection(db, 'games'),
            orderBy('plays', 'desc'),
            limit(4)
        );
        
        console.log('Fetching popular games...');
        const popularGamesSnapshot = await getDocs(popularGamesQuery);
        const popularGamesContainer = document.querySelector('#popular .grid');
        
        if (popularGamesSnapshot.empty) {
            console.log('No popular games found in database');
            // Keep loading skeletons visible
        } else {
            console.log(`Found ${popularGamesSnapshot.size} popular games`);
            popularGamesContainer.innerHTML = '';
            popularGamesSnapshot.forEach(doc => {
                const game = doc.data();
                console.log('Popular game:', game.title);
                popularGamesContainer.innerHTML += createGameCard(game);
            });
        }

    } catch (error) {
        console.error('Error loading games:', error);
        // Show error message to user
        const errorMessage = `
            <div class="text-gaming-secondary text-center py-4">
                Failed to load games. Please try again later.
                <br>
                Error: ${error.message}
            </div>
        `;
        document.querySelector('#new-games .grid').innerHTML = errorMessage;
        document.querySelector('#popular .grid').innerHTML = errorMessage;
    }
}

// 搜索游戏
let searchTimeout;
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
        const searchTerm = e.target.value.toLowerCase();
        if (!searchTerm) {
            await loadGames();
            return;
        }

        try {
            const gamesQuery = query(collection(db, 'games'));
            const snapshot = await getDocs(gamesQuery);
            
            const newGamesContainer = document.querySelector('#new-games .grid');
            const popularGamesContainer = document.querySelector('#popular .grid');
            
            // Clear both containers
            newGamesContainer.innerHTML = '';
            popularGamesContainer.innerHTML = '';

            // Filter and display search results in new games section
            const searchResults = [];
            snapshot.forEach(doc => {
                const game = doc.data();
                if (game.title.toLowerCase().includes(searchTerm) || 
                    game.description.toLowerCase().includes(searchTerm) ||
                    game.category.toLowerCase().includes(searchTerm)) {
                    searchResults.push(game);
                }
            });

            // Display first 4 results in new games section
            searchResults.slice(0, 4).forEach(game => {
                newGamesContainer.innerHTML += createGameCard(game);
            });

            // Update section titles
            document.querySelector('#new-games h2').textContent = `Search Results (${searchResults.length})`;
            document.querySelector('#popular').style.display = 'none';
        } catch (error) {
            console.error('搜索游戏失败:', error);
        }
    }, 300);
});

// 初始加载
document.addEventListener('DOMContentLoaded', loadGames); 