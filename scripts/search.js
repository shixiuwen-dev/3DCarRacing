import { collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { db } from './firebase-init.js';

export function initSearch() {
    const searchInput = document.getElementById('search-input');

    // 处理回车键搜索
    searchInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const searchTerm = e.target.value.trim().toLowerCase();
            if (searchTerm === '') {
                // 如果搜索框为空，显示所有游戏
                const gamesQuery = query(collection(db, 'games'));
                const snapshot = await getDocs(gamesQuery);
                const allGames = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                displaySearchResults(allGames, true);
            } else {
                performSearch(searchTerm);
            }
        }
    });

    // 清除之前的实时搜索监听器
    searchInput.removeEventListener('input', () => {});
}

async function performSearch(searchTerm) {
    try {
        // 获取所有游戏然后在客户端进行模糊搜索
        const gamesQuery = query(collection(db, 'games'));
        const snapshot = await getDocs(gamesQuery);
        const allGames = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // 只在游戏标题中进行模糊搜索
        const results = allGames.filter(game => 
            game.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        displaySearchResults(results, false);
    } catch (error) {
        console.error('Search error:', error);
    }
}

function displaySearchResults(results, isShowingAll = false) {
    const mainContent = document.getElementById('main-content');
    
    if (results.length === 0) {
        mainContent.innerHTML = `
            <div class="text-center py-12">
                <h2 class="text-2xl font-bold mb-4">No games found</h2>
                <p class="text-gray-400">Try different search terms or press Enter with empty search to show all games</p>
            </div>
        `;
        return;
    }
    
    mainContent.innerHTML = `
        <section class="mb-12">
            <h2 class="text-2xl font-bold mb-6">${isShowingAll ? 'All Games' : 'Search Results'}</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                ${results.map(game => createGameCard(game)).join('')}
            </div>
        </section>
    `;
}

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

function formatPlays(plays) {
    if (!plays) return '0';
    if (plays >= 1000) {
        return Math.floor(plays / 1000) + 'K+';
    }
    return plays.toString();
} 