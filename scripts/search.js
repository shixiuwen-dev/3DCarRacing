import { collection, query, where, getDocs, orderBy, limit, startAfter } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { db } from '/scripts/firebase-init.js';

// 导航到游戏页面的函数（从router.js复制）
function navigateToGame(gameSlug, gameId) {
    try {
        // 增加游戏播放次数
        if (typeof incrementPlays === 'function') {
            incrementPlays(gameId);
        }
        // 使用路由导航
        history.pushState(null, '', `/games/${gameSlug}`);
        // 触发路由处理
        window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (error) {
        console.error('Error navigating to game:', error);
        // 降级到直接页面跳转
        window.location.href = `/games/${gameSlug}`;
    }
}

// 搜索分页状态
let searchPaginationState = {
    currentResults: [],
    currentTerm: '',
    isShowingAll: false,
    lastDoc: null,
    hasMore: true,
    loading: false
};

export function initSearch() {
    const searchInput = document.getElementById('search-input');

    // 处理回车键搜索
    searchInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const searchTerm = e.target.value.trim().toLowerCase();
            
            // 重置搜索状态
            searchPaginationState = {
                currentResults: [],
                currentTerm: searchTerm,
                isShowingAll: searchTerm === '',
                lastDoc: null,
                hasMore: true,
                loading: false
            };
            
            if (searchTerm === '') {
                // 如果搜索框为空，显示所有游戏（分页）
                const gamesQuery = query(
                    collection(db, 'games'),
                    orderBy('createdAt', 'desc'),
                    limit(20)
                );
                const snapshot = await getDocs(gamesQuery);
                const allGames = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                searchPaginationState.currentResults = allGames;
                searchPaginationState.lastDoc = snapshot.docs[snapshot.docs.length - 1];
                searchPaginationState.hasMore = allGames.length === 20;
                
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
        
        // 更新搜索状态
        searchPaginationState.currentResults = results;
        searchPaginationState.hasMore = false; // 搜索结果不支持分页（已经是全部结果）
        
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
    
    const title = isShowingAll ? `All Games (${results.length})` : `Search Results (${results.length})`;
    
    mainContent.innerHTML = `
        <section class="mb-12">
            <h2 class="text-2xl font-bold mb-6">${title}</h2>
            <div id="search-results-grid" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                ${results.map(game => createGameCard(game)).join('')}
            </div>
            ${searchPaginationState.hasMore && isShowingAll ? `
                <div class="text-center mt-8">
                    <button id="load-more-search-btn" onclick="loadMoreSearchResults()" class="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition">
                        Load More Games
                    </button>
                </div>
            ` : ''}
        </section>
    `;
    
    // 将loadMoreSearchResults函数添加到全局作用域
    window.loadMoreSearchResults = loadMoreSearchResults;
}

// 加载更多搜索结果的函数
async function loadMoreSearchResults() {
    if (searchPaginationState.loading || !searchPaginationState.hasMore || !searchPaginationState.isShowingAll) {
        return;
    }

    searchPaginationState.loading = true;
    const loadMoreBtn = document.getElementById('load-more-search-btn');
    if (loadMoreBtn) {
        loadMoreBtn.innerHTML = '<div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mx-auto"></div>';
        loadMoreBtn.disabled = true;
    }

    try {
        const gamesQuery = query(
            collection(db, 'games'),
            orderBy('createdAt', 'desc'),
            startAfter(searchPaginationState.lastDoc),
            limit(20)
        );
        
        const snapshot = await getDocs(gamesQuery);
        const moreGames = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (moreGames.length > 0) {
            // 添加到当前结果
            searchPaginationState.currentResults = [...searchPaginationState.currentResults, ...moreGames];
            searchPaginationState.lastDoc = snapshot.docs[snapshot.docs.length - 1];
            searchPaginationState.hasMore = moreGames.length === 20;

            // 添加新游戏到网格
            const searchGrid = document.getElementById('search-results-grid');
            if (searchGrid) {
                const newGamesHTML = moreGames.map(game => createGameCard(game)).join('');
                searchGrid.insertAdjacentHTML('beforeend', newGamesHTML);
            }

            // 更新标题中的游戏数量
            const titleElement = document.querySelector('section h2');
            if (titleElement) {
                titleElement.textContent = `All Games (${searchPaginationState.currentResults.length})`;
            }

            // 更新或移除"加载更多"按钮
            if (searchPaginationState.hasMore) {
                loadMoreBtn.innerHTML = 'Load More Games';
                loadMoreBtn.disabled = false;
            } else {
                loadMoreBtn.style.display = 'none';
            }
        } else {
            // 没有更多游戏了
            searchPaginationState.hasMore = false;
            if (loadMoreBtn) {
                loadMoreBtn.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error loading more search results:', error);
        if (loadMoreBtn) {
            loadMoreBtn.innerHTML = 'Load More Games';
            loadMoreBtn.disabled = false;
        }
    } finally {
        searchPaginationState.loading = false;
    }
}

function createGameCard(game) {
    console.log('Creating game card for:', game);
    console.log('Game thumbnail:', game.thumbnail);
    console.log('Game cover image:', game.coverImage);
    
    return `
        <div class="game-card bg-black/30 rounded-lg overflow-hidden group flex flex-col cursor-pointer hover:bg-black/40 transition-all duration-300" 
             onclick="navigateToGame('${game.slug}', '${game.id}')">
            <div class="relative w-full bg-black/50" style="height: 160px; min-height: 160px;">
                <div class="absolute inset-0 flex items-center justify-center">
                    <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gaming-primary image-loading"></div>
                </div>
                <img src="${game.thumbnail || game.coverImage || '/assets/game-placeholder.svg'}" 
                     alt="${game.title}" 
                     class="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition duration-300"
                     onload="this.parentElement.querySelector('.image-loading').style.display='none'"
                     onerror="this.src='/assets/game-placeholder.svg'">
                ${game.hoverAnimation ? `
                    <img src="${game.hoverAnimation}" 
                         alt="${game.title} animation" 
                         class="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                         style="z-index: 1;">
                ` : ''}
            </div>
            <div class="p-3 flex flex-col flex-grow">
                <div class="flex items-start justify-between mb-1">
                    <h3 class="text-sm font-bold line-clamp-1 pr-2" style="display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;">${game.title}</h3>
                    <span class="px-1.5 py-0.5 bg-gaming-primary/20 rounded text-xs flex-shrink-0">${game.category}</span>
                </div>
                <p class="text-xs text-gray-300 mt-1 line-clamp-2 flex-grow" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${game.description}</p>
                <div class="flex items-center justify-between mt-3 pt-2 border-t border-gray-700">
                    <span class="text-xs text-gray-400">${formatPlays(game.plays || 0)} plays</span>
                    <div class="bg-gaming-primary hover:bg-gaming-primary/80 px-3 py-1 rounded text-xs transition pointer-events-none">
                        Play
                    </div>
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