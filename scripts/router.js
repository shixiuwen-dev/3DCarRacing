import { getFirestore, collection, getDocs, query, where, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { db } from './firebase-init.js';

const mainContent = document.getElementById('main-content');

// 路由配置
const routes = {
    '/': showHomePage,
    '/categories': showCategoryPage,
    '/games': showGamePage
};

// 初始化路由
export function initRouter() {
    window.addEventListener('popstate', handleRoute);
    document.addEventListener('click', handleClick);
    handleRoute();
}

// 处理点击事件
function handleClick(e) {
    if (e.target.matches('a[data-route]')) {
        e.preventDefault();
        const url = e.target.getAttribute('href');
        history.pushState(null, '', url);
        handleRoute();
    }
}

// 处理路由
async function handleRoute() {
    const path = window.location.pathname;
    const [base, param] = path.split('/').filter(Boolean);
    
    // 显示加载状态
    mainContent.innerHTML = createLoadingTemplate();

    try {
        if (!base) {
            await showHomePage();
        } else if (base === 'categories' && param) {
            await showCategoryPage(param);
        } else if (base === 'games' && param) {
            await showGamePage(param);
        } else {
            showErrorPage('Page not found');
        }
    } catch (error) {
        console.error('Route handling error:', error);
        showErrorPage('An error occurred while loading the page');
    }
}

// 首页内容
async function showHomePage() {
    // 获取新游戏和热门游戏
    const newGames = await getNewGames();
    const popularGames = await getPopularGames();
    
    mainContent.innerHTML = `
        <section id="new-games" class="mb-12">
            <h2 class="text-2xl font-bold mb-6">New Games</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                ${newGames.map(game => createGameCard(game)).join('')}
            </div>
        </section>
        
        <section id="popular" class="mb-12">
            <h2 class="text-2xl font-bold mb-6">Popular Games</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                ${popularGames.map(game => createGameCard(game)).join('')}
            </div>
        </section>
    `;
}

// 分类页面内容
async function showCategoryPage(category) {
    const gamesQuery = query(
        collection(db, 'games'),
        where('category', '==', category),
        orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(gamesQuery);
    const games = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    mainContent.innerHTML = `
        <section class="relative rounded-2xl overflow-hidden mb-12 bg-gaming-primary/10">
            <div class="py-12 px-8">
                <h1 class="text-4xl md:text-5xl font-bold mb-4">${category} Games</h1>
                <p class="text-xl text-gray-300 max-w-2xl">Explore our collection of amazing ${category.toLowerCase()} games!</p>
            </div>
        </section>
        
        <section class="mb-12">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                ${games.map(game => createGameCard(game)).join('')}
            </div>
        </section>
    `;
}

// 游戏详情页面内容
async function showGamePage(gameSlug) {
    const gamesQuery = query(
        collection(db, 'games'),
        where('slug', '==', gameSlug),
        limit(1)
    );
    
    const snapshot = await getDocs(gamesQuery);
    if (snapshot.empty) {
        showErrorPage('Game not found');
        return;
    }
    
    const game = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    const similarGames = await getSimilarGames(game.category, game.id);
    
    mainContent.innerHTML = `
        <div class="max-w-6xl mx-auto">
            <div class="bg-black/30 rounded-2xl overflow-hidden">
                <div class="aspect-[16/9] relative">
                    <iframe
                        src="${game.embedUrl}"
                        class="absolute inset-0 w-full h-full"
                        frameborder="0"
                        allow="gamepad *;"
                        allowfullscreen
                    ></iframe>
                </div>
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h1 class="text-2xl md:text-3xl font-bold">${game.title}</h1>
                        <div class="flex items-center space-x-4">
                            <div class="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                </svg>
                                <span class="ml-1 font-semibold">${game.rating || '4.5'}</span>
                            </div>
                            <span class="text-gray-400">${formatPlays(game.plays)} plays</span>
                        </div>
                    </div>
                    <p class="text-gray-300">${game.description}</p>
                    
                    <div class="mt-6">
                        <h2 class="text-xl font-bold mb-3">How to Play</h2>
                        <ul class="list-disc list-inside text-gray-300 space-y-2">
                            ${(game.howToPlay || []).map(item => `<li>${item}</li>`).join('\n')}
                        </ul>
                    </div>

                    <div class="mt-6">
                        <h2 class="text-xl font-bold mb-3">Features</h2>
                        <ul class="list-disc list-inside text-gray-300 space-y-2">
                            ${(game.features || []).map(item => `<li>${item}</li>`).join('\n')}
                        </ul>
                    </div>
                </div>
            </div>

            <div class="mt-8">
                <h2 class="text-2xl font-bold mb-4">Similar Games</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    ${similarGames.map(game => createGameCard(game)).join('')}
                </div>
            </div>
        </div>
    `;
}

// 错误页面
function showErrorPage(message) {
    mainContent.innerHTML = `
        <div class="text-center py-12">
            <h1 class="text-3xl font-bold mb-4">Oops!</h1>
            <p class="text-gray-400">${message}</p>
            <a href="/" class="inline-block mt-6 bg-gaming-primary hover:bg-gaming-primary/80 px-6 py-3 rounded-lg transition">
                Return to Home
            </a>
        </div>
    `;
}

// 加载中模板
function createLoadingTemplate() {
    return `
        <div class="flex items-center justify-center min-h-[400px]">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-gaming-primary border-t-transparent"></div>
        </div>
    `;
}

// 获取新游戏
async function getNewGames() {
    const gamesQuery = query(
        collection(db, 'games'),
        orderBy('createdAt', 'desc'),
        limit(4)
    );
    const snapshot = await getDocs(gamesQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 获取热门游戏
async function getPopularGames() {
    const gamesQuery = query(
        collection(db, 'games'),
        orderBy('plays', 'desc'),
        limit(4)
    );
    const snapshot = await getDocs(gamesQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 获取相似游戏
async function getSimilarGames(category, excludeId) {
    const gamesQuery = query(
        collection(db, 'games'),
        where('category', '==', category),
        limit(4)
    );
    const snapshot = await getDocs(gamesQuery);
    return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(game => game.id !== excludeId);
}

// 格式化播放次数
function formatPlays(plays) {
    if (!plays) return '0';
    if (plays >= 1000) {
        return Math.floor(plays / 1000) + 'K+';
    }
    return plays.toString();
}

// 创建游戏卡片
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