import { getFirestore, collection, getDocs, query, where, orderBy, limit, startAfter, doc, updateDoc, increment, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { db } from '/scripts/firebase-init.js';

// 获取主内容容器的函数
function getMainContent() {
    return document.getElementById('main-content');
}

// 路由配置
const routes = {
    '/': showHomePage,
    '/categories': showCategoryPage,
    '/games': showGamePage,
    '/about.html': () => loadStaticPage('/about.html'),
    '/privacy.html': () => loadStaticPage('/privacy.html'),
    '/terms.html': () => loadStaticPage('/terms.html'),
    '/contact.html': () => loadStaticPage('/contact.html')
};

// 全局变量管理分页状态
let categoryPaginationState = {
    currentCategory: null,
    lastDoc: null,
    hasMore: true,
    loading: false
};

// 初始化路由
// 平滑滚动到顶部的函数
function smoothScrollToTop() {
    // 如果支持smooth behavior，使用平滑滚动
    if ('scrollBehavior' in document.documentElement.style) {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    } else {
        // 降级到普通滚动
        window.scrollTo(0, 0);
    }
}

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
        
        // 对于静态页面，直接跳转而不是使用AJAX加载
        if (url.endsWith('.html')) {
            console.log('🔗 Navigating to static page:', url);
            window.location.href = url;
            return;
        }
        
        // 对于其他路由，使用客户端路由
        // 立即滚动到顶部，提供更好的用户体验
        smoothScrollToTop();
        history.pushState(null, '', url);
        handleRoute();
    }
}

// 处理路由
async function handleRoute() {
    const path = window.location.pathname;
    console.log('🛣️ Current path:', path);
    console.log('🔄 handleRoute called');
    
    // 滚动到页面顶部 - 修复从首页滚动后进入游戏详情页的问题
    smoothScrollToTop();
    
    // 确保mainContent存在
    const mainContentEl = document.getElementById('main-content');
    if (!mainContentEl) {
        console.error('❌ Main content element not found!');
        return;
    }
    
    // 显示加载状态
    mainContentEl.innerHTML = createLoadingTemplate();
    console.log('📋 Loading template displayed');

    try {
        console.log('🔍 Checking database connection...');
        if (!db) {
            console.error('❌ Database not initialized!');
            showErrorPage('Database connection failed. Please refresh the page.');
            return;
        }
        console.log('✅ Database connection OK');
        
        // 直接处理根路径
        if (path === '/' || path === '/index.html') {
            console.log('🏠 Showing home page');
            await showHomePage();
            console.log('✅ Home page loaded successfully');
            return;
        }
        
        // 处理分类路径：/categories/action, /categories/racing 等
        if (path.startsWith('/categories/')) {
            const category = path.replace('/categories/', '').replace('.html', '');
            console.log('📂 Showing category page:', category);
            if (category && ['action', 'racing', 'strategy', 'arcade', 'sport', 'other'].includes(category.toLowerCase())) {
                await showCategoryPage(category);
                console.log('✅ Category page loaded successfully');
            } else {
                console.log('❌ Invalid category:', category);
                showErrorPage('Category not found');
            }
            return;
        }
        
        // 处理游戏路径：/games/game-slug
        if (path.startsWith('/games/')) {
            const gameSlug = path.replace('/games/', '').replace('.html', '');
            console.log('🎮 Showing game page:', gameSlug);
            if (gameSlug) {
                await showGamePage(gameSlug);
                console.log('✅ Game page loaded successfully');
            } else {
                console.log('❌ No game slug provided');
                showErrorPage('Game not found');
            }
            return;
        }
        
        // 处理静态页面路由
        if (path in routes) {
            console.log('📄 Loading static route:', path);
            await routes[path]();
            console.log('✅ Static route loaded successfully');
            return;
        }
        
        // 检查是否是静态文件，如果是则尝试重定向
        const staticPages = ['/about.html', '/privacy.html', '/terms.html', '/contact.html'];
        if (staticPages.includes(path)) {
            try {
                console.log('📄 Loading static page:', path);
                await loadStaticPage(path);
                console.log('✅ Static page loaded successfully');
                return;
            } catch (error) {
                console.error('❌ Error loading static page:', error);
            }
        }
        
        // 如果都不匹配，显示404
        console.log('❌ Unknown route:', path);
        showErrorPage('Page not found');
        
    } catch (error) {
        console.error('❌ Route handling error:', error);
        console.error('Error stack:', error.stack);
        showErrorPage('An error occurred while loading the page');
    }
}

// 加载静态页面
async function loadStaticPage(pagePath) {
    try {
        console.log('🌐 Loading static page:', pagePath);
        const response = await fetch(pagePath);
        console.log('📥 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Failed to load page: ${pagePath} (Status: ${response.status})`);
        }
        
        const html = await response.text();
        console.log('📄 Received HTML content length:', html.length);
        console.log('📄 HTML content preview:', html.substring(0, 200));
        
        // 尝试两种方法：DOMParser 和 createElement
        let mainContent = null;
        
        // 方法1: 使用DOMParser
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            console.log('🔍 DOMParser - Document parsed successfully');
            console.log('🔍 DOMParser - Document title:', doc.title);
            console.log('🔍 DOMParser - Document body exists:', !!doc.body);
            
            if (doc.body) {
                console.log('🔍 DOMParser - Document body children count:', doc.body.children.length);
                mainContent = doc.querySelector('main');
                console.log('🔍 DOMParser - Main element found:', !!mainContent);
            }
        } catch (domParserError) {
            console.error('❌ DOMParser failed:', domParserError);
        }
        
        // 方法2: 如果DOMParser失败，使用createElement
        if (!mainContent) {
            console.log('🔄 Trying createElement method...');
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            console.log('🔍 createElement - Temp div children count:', tempDiv.children.length);
            
            // 查找main元素
            mainContent = tempDiv.querySelector('main');
            console.log('🔍 createElement - Main element found:', !!mainContent);
            
            if (!mainContent) {
                // 尝试查找所有可能的容器
                const possibleContainers = tempDiv.querySelectorAll('body, main, .main-content, #main-content');
                console.log('🔍 Found possible containers:', possibleContainers.length);
                possibleContainers.forEach((container, index) => {
                    console.log(`Container ${index}:`, container.tagName, container.className, container.id);
                });
                
                // 如果找到body，尝试从body中获取main
                const bodyElement = tempDiv.querySelector('body');
                if (bodyElement) {
                    console.log('🔍 Found body element, looking for main inside');
                    mainContent = bodyElement.querySelector('main');
                    console.log('🔍 Main inside body found:', !!mainContent);
                }
            }
        }
        
        if (mainContent) {
            console.log('✅ Found main content, updating page');
            console.log('✅ Main content innerHTML length:', mainContent.innerHTML.length);
            const targetContainer = document.getElementById('main-content');
            if (!targetContainer) {
                throw new Error('Target container #main-content not found');
            }
            
            targetContainer.innerHTML = mainContent.innerHTML;
            
            // 如果是联系页面，初始化表单处理
            if (pagePath === '/contact.html') {
                console.log('📝 Initializing contact form');
                // 延迟执行以确保DOM已更新
                setTimeout(() => {
                    initContactForm();
                }, 100);
            }
        } else {
            console.error('❌ Main content not found in the static page with both methods');
            throw new Error('Main content not found in the static page');
        }
    } catch (error) {
        console.error('❌ Error loading static page:', error);
        showErrorPage(`Failed to load the page: ${error.message}`);
    }
}

// 初始化联系表单
function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) {
        console.error('Contact form not found');
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formMessage = document.getElementById('form-message');
        formMessage.className = 'mt-4 p-4 rounded-lg';
        formMessage.style.display = 'block';
        
        try {
            // 这里可以添加表单提交逻辑
            formMessage.className += ' bg-green-500/20 text-green-400';
            formMessage.textContent = '消息已发送！我们会尽快回复您。';
        } catch (error) {
            console.error('Error submitting form:', error);
            formMessage.className += ' bg-red-500/20 text-red-400';
            formMessage.textContent = '发送失败，请稍后重试。';
        }
    });
}

// 存储最后一个文档的引用
let lastLoadedDoc = null;

// 获取游戏总数
async function getTotalGamesCount() {
    try {
        console.log('Getting total games count...');
        
        // 直接查询Firebase获取所有游戏数量
        const gamesRef = collection(db, 'games');
        const gamesQuery = query(gamesRef, orderBy('createdAt', 'desc'));
        
        const snapshot = await getDocs(gamesQuery);
        const totalCount = snapshot.size;
        
        console.log('Total games count:', totalCount);
        return totalCount;
    } catch (error) {
        console.error('Error getting total games count:', error);
        return 0;
    }
}

// 获取所有游戏（首页用，限制12条）
async function getAllGames() {
    try {
        console.log('Getting games for homepage...');
        
        // 需要直接调用Firebase查询以获取文档引用
        const gamesRef = collection(db, 'games');
        const gamesQuery = query(gamesRef, 
            orderBy('createdAt', 'desc'), 
            limit(20)
        );
        
        const snapshot = await getDocs(gamesQuery);
        console.log(`getAllGames returned ${snapshot.size} games`);
        
        const games = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // 保存最后一个文档的引用（保存Firebase文档对象，不是数据对象）
        if (snapshot.docs.length > 0) {
            lastLoadedDoc = snapshot.docs[snapshot.docs.length - 1];
            console.log('Set lastLoadedDoc to:', lastLoadedDoc.id);
        } else {
            lastLoadedDoc = null;
            console.log('No documents found, lastLoadedDoc set to null');
        }
        
        return games;
    } catch (error) {
        console.error('Error in getAllGames:', error);
        throw error;
    }
}

// 加载更多游戏
window.loadMoreGames = async function() {
    try {
        const loadMoreButton = document.querySelector('#all-games button');
        if (!loadMoreButton) return;
        
        loadMoreButton.textContent = '加载中...';
        loadMoreButton.disabled = true;

        // 确保有lastLoadedDoc才能进行分页查询
        if (!lastLoadedDoc) {
            console.error('No lastLoadedDoc available for pagination');
            loadMoreButton.textContent = '暂无更多游戏';
            loadMoreButton.disabled = true;
            return;
        }

        console.log('Starting pagination with lastDoc:', lastLoadedDoc.id);

        // 直接使用Firebase查询获取更多游戏
        const gamesRef = collection(db, 'games');
        const moreGamesQuery = query(gamesRef, 
            orderBy('createdAt', 'desc'),
            startAfter(lastLoadedDoc),
            limit(20)
        );
        
        const moreSnapshot = await getDocs(moreGamesQuery);
        const moreGames = moreSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log('Pagination query returned:', moreGames.length, 'games');
        console.log('Game IDs:', moreGames.map(g => g.id));

        if (moreGames.length === 0) {
            loadMoreButton.textContent = '暂无更多游戏';
            loadMoreButton.disabled = true;
            return;
        }

        // 更新最后一个文档的引用（保存Firebase文档对象）
        if (moreSnapshot.docs.length > 0) {
            lastLoadedDoc = moreSnapshot.docs[moreSnapshot.docs.length - 1];
            console.log('Updated lastLoadedDoc to:', lastLoadedDoc.id);
        }

        const allGamesGrid = document.querySelector('#all-games .grid');
        if (allGamesGrid) {
            moreGames.forEach(game => {
                allGamesGrid.innerHTML += createGameCard(game);
            });
        }

        // 如果返回的游戏数量小于限制数量，说明没有更多了
        if (moreGames.length < 20) {
            loadMoreButton.textContent = '暂无更多游戏';
            loadMoreButton.disabled = true;
        } else {
            loadMoreButton.textContent = 'Load More Games';
            loadMoreButton.disabled = false;
        }
    } catch (error) {
        console.error('Error loading more games:', error);
        const loadMoreButton = document.querySelector('#all-games button');
        if (loadMoreButton) {
            loadMoreButton.textContent = '加载失败，请重试';
            loadMoreButton.disabled = false;
        }
    }
}

// 首页内容
async function showHomePage() {
    try {
        console.log('🚀 Loading home page...');
        console.log('✅ showHomePage function called');
        const mainContent = getMainContent();
        if (!mainContent) {
            console.error('❌ Main content element not found in showHomePage!');
            return;
        }
        mainContent.innerHTML = createLoadingTemplate();

        // 获取新游戏和热门游戏
        console.log('🎮 Fetching new games...');
        const newGames = await getNewGames();
        console.log('New games loaded:', newGames.length, 'games');
        console.log('New games data:', newGames);
        
        // 如果没有新游戏数据，显示详细错误信息
        if (!newGames || newGames.length === 0) {
            console.warn('No new games found in database');
        }
        
        console.log('Fetching popular games...');
        const popularGames = await getPopularGames();
        console.log('Popular games loaded:', popularGames.length, 'games');
        console.log('Popular games data:', popularGames);
        
        // 注释掉其他分类游戏的获取，仅保留导航入口
        // console.log('Fetching other games...');
        // const otherGames = await getOtherGames();
        // console.log('Other games loaded:', otherGames.length, 'games');
        // console.log('Other games data:', otherGames);
        
        // 获取所有游戏
        console.log('Fetching all games...');
        const allGames = await getAllGames();
        console.log('All games loaded:', allGames.length, 'games');
        console.log('All games data:', allGames);
        
        // 获取游戏总数以判断是否需要显示Load More按钮
        const totalGamesCount = await getTotalGamesCount();
        console.log('Total games in database:', totalGamesCount);
        console.log('Total games type:', typeof totalGamesCount);
        console.log('Should show Load More button?', totalGamesCount > 20);
        console.log('Comparison result:', totalGamesCount, '>', 20, '=', totalGamesCount > 20);
        
        // 如果没有游戏数据，提示用户初始化数据
        if (!allGames || allGames.length === 0) {
            console.warn('No games found in database. Database may need to be initialized.');
        }

        // 检查是否有热门游戏
        const hasPopularGames = popularGames && popularGames.length > 0;
        console.log('Has popular games:', hasPopularGames);
        
        // 获取最近玩过的游戏
        const recentlyPlayedGames = await getRecentlyPlayedGames();
        console.log('Recently played games loaded:', recentlyPlayedGames.length, 'games');
    
        mainContent.innerHTML = `
            <div class="container mx-auto px-4 py-8">
                <section id="new-games" class="mb-12">
                    <h2 class="text-2xl font-bold mb-6">New Games</h2>
                    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 min-h-[320px]">
                        ${newGames && newGames.length > 0 ? 
                            newGames.map(game => createGameCard(game)).join('') : 
                            '<div class="col-span-full text-center py-12"><p class="text-gray-400">No new games available at the moment. Check back later!</p></div>'
                        }
                    </div>
                </section>
                
                ${hasPopularGames ? `
                    <section id="popular" class="mb-12">
                        <h2 class="text-2xl font-bold mb-6">Popular Games</h2>
                        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 min-h-[320px]">
                            ${popularGames && popularGames.length > 0 ? 
                                popularGames.map(game => createGameCard(game)).join('') : 
                                '<div class="col-span-full text-center py-12"><p class="text-gray-400">No popular games available at the moment.</p></div>'
                            }
                        </div>
                    </section>
                ` : ''}

                <!-- Recently Played Games Section -->
                <section id="recently-played" class="mb-12" style="display: none;">
                    <h2 class="text-2xl font-bold mb-6">Recently Played</h2>
                    <div id="recently-played-grid" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 min-h-[320px]">
                        <!-- Games will be loaded dynamically -->
                    </div>
                </section>

                <section id="all-games" class="mb-12">
                    <h2 class="text-2xl font-bold mb-6">All Games (${totalGamesCount})</h2>
                    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 min-h-[320px] h-auto">
                        ${allGames && allGames.length > 0 ? 
                            allGames.map(game => createGameCard(game)).join('') : 
                            '<div class="col-span-full text-center py-12"><p class="text-gray-400 mb-4">暂无游戏数据</p><a href="/init-data.html" class="bg-gaming-primary hover:bg-gaming-primary/80 px-4 py-2 rounded-lg transition">初始化示例数据</a></div>'
                        }
                    </div>
                    ${totalGamesCount > 20 ? `
                        <div class="text-center mt-8">
                            <button onclick="loadMoreGames()" class="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition">
                                Load More Games
                            </button>
                        </div>
                    ` : `
                        <div class="text-center mt-8 text-gray-500">
                            <!-- 调试：总游戏数 ${totalGamesCount}，不显示Load More按钮 -->
                        </div>
                    `}
                </section>
            </div>
        `;
        
        // 在DOM渲染完成后，显示最近玩过的游戏
        setTimeout(() => {
            displayRecentlyPlayedGames(recentlyPlayedGames);
        }, 100);
    } catch (error) {
        console.error('Error loading home page:', error);
        console.error('Error stack:', error.stack);
        showErrorPage('Failed to load home page content. Please try again later.');
    }
}

// 通用获取游戏数据函数
async function getGames(options = {}) {
    try {
        console.log('Getting games with options:', JSON.stringify(options));
        
        // 检查数据库连接
        if (!db) {
            console.error('Database not initialized');
            throw new Error('Database not initialized');
        }
        
        let queryConstraints = [];
        
        // 如果指定了分类且不是'all'，添加分类过滤
        if (options.category && options.category !== 'all') {
            console.log('Adding category filter for:', options.category);
            queryConstraints.push(where('category', '==', options.category.toLowerCase()));
        }
        
        // 添加排序（如果没有指定排序，使用默认排序）
        const orderByField = options.orderBy || 'createdAt';
        const orderDirection = options.orderDirection || 'desc';
        console.log('Adding orderBy:', orderByField, orderDirection);
        queryConstraints.push(orderBy(orderByField, orderDirection));
        
        // 如果是按播放次数排序，添加创建时间作为第二排序条件
        if (orderByField === 'plays') {
            queryConstraints.push(orderBy('createdAt', 'desc'));
        }
        
        // 添加分页
        if (options.lastDoc) {
            console.log('Adding pagination after document:', options.lastDoc.id);
            queryConstraints.push(startAfter(options.lastDoc));
        }
        
        // 添加限制
        if (options.limit) {
            console.log('Adding limit:', options.limit);
            queryConstraints.push(limit(options.limit));
        }
        
        console.log('Final query constraints:', queryConstraints);
        const gamesRef = collection(db, 'games');
        console.log('Collection reference created for games collection');
        
        const gamesQuery = query(gamesRef, ...queryConstraints);
        console.log('Query created, executing...');
        
        const snapshot = await getDocs(gamesQuery);
        console.log(`Query returned ${snapshot.size} games`);
        
        const games = snapshot.docs.map(doc => {
            const gameData = {
                id: doc.id,
                ...doc.data()
            };
            console.log('Game data:', gameData);
            return gameData;
        });
        
        // 返回games数组和snapshot以便获取lastDoc
        return { games, snapshot };
    } catch (error) {
        console.error('Error getting games:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        throw error;
    }
}

// 获取新游戏
async function getNewGames() {
    const result = await getGames({
        orderBy: 'createdAt',
        orderDirection: 'desc',
        limit: 5
    });
    return result.games;
}

// 获取热门游戏
async function getPopularGames() {
    try {
        console.log('Getting popular games...');
        // 直接获取播放次数最多的5个游戏
        const result = await getGames({
            orderBy: 'plays',
            orderDirection: 'desc',
            limit: 5
        });
        console.log('Popular games loaded:', result.games.length, 'games');
        return result.games;
    } catch (error) {
        console.error('Error getting popular games:', error);
        return [];
    }
}

// 获取相似游戏
async function getSimilarGames(category, excludeId) {
    try {
        const result = await getGames({
            category: category,
            limit: 5
        });
        return result.games.filter(game => game.id !== excludeId);
    } catch (error) {
        console.error('Error getting similar games:', error);
        return [];
    }
}

// 获取其他分类游戏（保留函数以备将来使用）
async function getOtherGames() {
    try {
        console.log('Getting other category games...');
        const result = await getGames({
            category: 'other',
            orderBy: 'createdAt',
            orderDirection: 'desc',
            limit: 4
        });
        console.log('Other games loaded:', result.games.length, 'games');
        return result.games;
    } catch (error) {
        console.error('Error getting other games:', error);
        return [];
    }
}

// 获取运动分类游戏
async function getSportGames() {
    try {
        console.log('Getting sport category games...');
        const result = await getGames({
            category: 'sport',
            orderBy: 'createdAt',
            orderDirection: 'desc',
            limit: 4
        });
        console.log('Sport games loaded:', result.games.length, 'games');
        return result.games;
    } catch (error) {
        console.error('Error getting sport games:', error);
        return [];
    }
}

// 分类页面内容
async function showCategoryPage(category) {
    try {
        // 显示加载状态
        const mainContent = getMainContent();
        if (!mainContent) {
            console.error('❌ Main content element not found in showCategoryPage!');
            return;
        }
        mainContent.innerHTML = createLoadingTemplate();
        
        console.log('Loading category:', category);
        // 确保分类名称正确
        const normalizedCategory = category.toLowerCase();
        console.log('Normalized category:', normalizedCategory);
        
        // 重置分页状态
        categoryPaginationState = {
            currentCategory: normalizedCategory,
            lastDoc: null,
            hasMore: true,
            loading: false
        };
        
        // 使用通用的 getGames 函数获取数据，限制为20个
        const result = await getGames({
            category: normalizedCategory,
            orderBy: 'createdAt',
            orderDirection: 'desc',
            limit: 20
        });
        
        const games = result.games;
        console.log('Games loaded:', games.length);
        
        // 更新分页状态，使用Firebase文档对象
        if (result.snapshot.docs.length > 0) {
            categoryPaginationState.lastDoc = result.snapshot.docs[result.snapshot.docs.length - 1];
            categoryPaginationState.hasMore = games.length === 20;
        } else {
            categoryPaginationState.hasMore = false;
        }
        
        if (games.length === 0) {
            const mainContent = getMainContent();
            if (!mainContent) {
                console.error('❌ Main content element not found in showCategoryPage (no games)!');
                return;
            }
            mainContent.innerHTML = `
                <section class="relative rounded-2xl overflow-hidden mb-8 bg-gaming-primary/10 p-6">
                    <h1 class="text-2xl md:text-3xl font-bold mb-2">${category} Games</h1>
                    <p class="text-base text-gray-300 max-w-2xl">Explore our collection of amazing ${category.toLowerCase()} games!</p>
                </section>
                <section class="text-center py-12">
                    <h2 class="text-2xl font-bold mb-4">No games found in ${category} category</h2>
                    <p class="text-gray-400">Check back later for new games!</p>
                    <a href="/" class="inline-block mt-6 bg-gaming-primary hover:bg-gaming-primary/80 px-6 py-3 rounded-lg transition">Back to Home</a>
                </section>
            `;
            return;
        }
        
        const mainContent2 = getMainContent();
        if (!mainContent2) {
            console.error('❌ Main content element not found in showCategoryPage (with games)!');
            return;
        }
        mainContent2.innerHTML = `
            <section class="relative rounded-2xl overflow-hidden mb-8 bg-gaming-primary/10 p-6">
                <h1 class="text-2xl md:text-3xl font-bold mb-2">${category} Games</h1>
                <p class="text-base text-gray-300 max-w-2xl">Explore our collection of amazing ${category.toLowerCase()} games!</p>
            </section>
            
            <section class="mb-12">
                <div id="category-games-grid" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    ${games.map(game => createGameCard(game)).join('')}
                </div>
                ${categoryPaginationState.hasMore ? `
                    <div class="text-center mt-8">
                        <button id="load-more-category-btn" onclick="loadMoreCategoryGames()" class="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition">
                            Load More Games
                        </button>
                    </div>
                ` : ''}
            </section>
        `;
        
        // 将loadMoreCategoryGames函数添加到全局作用域
        window.loadMoreCategoryGames = loadMoreCategoryGames;
        
    } catch (error) {
        console.error('Error loading category:', error);
        const mainContent = getMainContent();
        if (!mainContent) {
            console.error('❌ Main content element not found in showCategoryPage (error)!');
            return;
        }
        mainContent.innerHTML = `
            <section class="relative rounded-2xl overflow-hidden mb-8 bg-gaming-primary/10 p-6">
                <h1 class="text-2xl md:text-3xl font-bold mb-2">${category} Games</h1>
                <p class="text-base text-gray-300 max-w-2xl">Explore our collection of amazing ${category.toLowerCase()} games!</p>
            </section>
            <section class="text-center py-12">
                <h2 class="text-2xl font-bold mb-4">Error loading games</h2>
                <p class="text-gray-400">Please try again later</p>
                <p class="text-sm text-gray-500 mt-2">${error.message}</p>
                <div class="mt-6">
                    <a href="/" class="inline-block bg-gaming-primary hover:bg-gaming-primary/80 px-6 py-3 rounded-lg transition">Back to Home</a>
                </div>
            </section>
        `;
    }
}

// 加载更多分类游戏的函数
async function loadMoreCategoryGames() {
    if (categoryPaginationState.loading || !categoryPaginationState.hasMore) {
        return;
    }

    categoryPaginationState.loading = true;
    const loadMoreBtn = document.getElementById('load-more-category-btn');
    if (loadMoreBtn) {
        loadMoreBtn.innerHTML = '<div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mx-auto"></div>';
        loadMoreBtn.disabled = true;
    }

    try {
        const result = await getGames({
            category: categoryPaginationState.currentCategory,
            orderBy: 'createdAt',
            orderDirection: 'desc',
            limit: 20,
            lastDoc: categoryPaginationState.lastDoc
        });

        const moreGames = result.games;
        console.log('Loaded more games:', moreGames.length);

        if (moreGames.length > 0) {
            // 更新分页状态，使用Firebase文档对象
            categoryPaginationState.lastDoc = result.snapshot.docs[result.snapshot.docs.length - 1];
            categoryPaginationState.hasMore = moreGames.length === 20;

            // 添加新游戏到网格
            const gamesGrid = document.getElementById('category-games-grid');
            if (gamesGrid) {
                const newGamesHTML = moreGames.map(game => createGameCard(game)).join('');
                gamesGrid.insertAdjacentHTML('beforeend', newGamesHTML);
            }

            // 更新或移除"加载更多"按钮
            if (categoryPaginationState.hasMore) {
                loadMoreBtn.innerHTML = 'Load More Games';
                loadMoreBtn.disabled = false;
            } else {
                loadMoreBtn.style.display = 'none';
            }
        } else {
            // 没有更多游戏了
            categoryPaginationState.hasMore = false;
            if (loadMoreBtn) {
                loadMoreBtn.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error loading more category games:', error);
        if (loadMoreBtn) {
            loadMoreBtn.innerHTML = 'Load More Games';
            loadMoreBtn.disabled = false;
        }
    } finally {
        categoryPaginationState.loading = false;
    }
}

// 游戏详情页面内容
async function showGamePage(gameSlug) {
    try {
        console.log('Loading game:', gameSlug);
        
        // 先显示加载模板
        const mainContent = getMainContent();
        if (!mainContent) {
            console.error('❌ Main content element not found in showGamePage!');
            return;
        }
        mainContent.innerHTML = createGameLoadingTemplate();
        
        const gamesQuery = query(
            collection(db, 'games'),
            where('slug', '==', gameSlug)
        );
        
        console.log('Executing Firebase query...');
        const snapshot = await getDocs(gamesQuery);
        console.log('Query results:', snapshot.size, 'games found');
        
        if (snapshot.empty) {
            console.log('Game not found');
            showErrorPage('Game not found');
            return;
        }
        
        const game = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        console.log('Game data:', game);
        
        // 添加游戏到最近玩过列表
        addToRecentlyPlayed(game);
        
        if (!game.embedUrl) {
            console.error('Game embedUrl is missing');
            showErrorPage('Game is currently unavailable');
            return;
        }
        
        const similarGames = await getSimilarGames(game.category, game.id);
        console.log('Similar games:', similarGames);
        
        const mainContentFinal = getMainContent();
        if (!mainContentFinal) {
            console.error('❌ Main content element not found in showGamePage (final)!');
            return;
        }
        mainContentFinal.innerHTML = `
            <div class="max-w-6xl mx-auto">
                <div class="bg-black/30 rounded-2xl overflow-hidden mb-8">
                    <div class="aspect-[16/9] w-full relative" style="min-height: 600px;">
                        <iframe
                            src="${game.embedUrl}"
                            class="absolute inset-0 w-full h-full"
                            style="min-height: 600px; height: 100%;"
                            frameborder="0"
                            allow="autoplay; fullscreen; gamepad *;"
                            allowfullscreen
                            loading="lazy"
                        ></iframe>
                    </div>
                </div>

                <div class="bg-black/30 rounded-2xl p-6 mb-8">
                    <div class="flex items-center justify-between mb-4">
                        <h1 class="text-2xl md:text-3xl font-bold">${game.title}</h1>
                        <div class="flex items-center space-x-4">
                            <div class="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                </svg>
                                <span class="ml-1 font-semibold">${game.rating || '4.5'}</span>
                            </div>
                            <span class="text-gray-400">${game.plays || 0} plays</span>
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

                ${similarGames.length > 0 ? `
                    <div class="mt-12">
                        <h2 class="text-2xl font-bold mb-6">Similar Games</h2>
                        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            ${similarGames.map(game => createGameCard(game)).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        // 确保页面滚动到顶部，让用户能看到游戏区域
        setTimeout(() => {
            smoothScrollToTop();
        }, 100);
        
    } catch (error) {
        console.error('Error loading game:', error);
        showErrorPage(`Error loading game: ${error.message}`);
    }
}

// 错误页面
function showErrorPage(message) {
    console.error('Showing error page:', message);
    const mainContent = getMainContent();
    if (!mainContent) {
        console.error('❌ Main content element not found in showErrorPage!');
        return;
    }
    mainContent.innerHTML = `
        <div class="min-h-[400px] flex items-center justify-center">
            <div class="text-center">
                <h1 class="text-4xl font-bold mb-4">Oops!</h1>
                <p class="text-xl text-gray-400">${message}</p>
            </div>
        </div>
    `;
}

// 加载中模板
function createLoadingTemplate() {
    return `
        <div class="container mx-auto px-4 py-8">
            <!-- Hero Section Skeleton -->
            <div class="relative rounded-2xl overflow-hidden mb-12 bg-black/30 p-8 animate-pulse">
                <div class="h-12 bg-gray-700 rounded mb-4 w-64"></div>
                <div class="h-6 bg-gray-700 rounded w-96"></div>
            </div>
            
            <!-- Games Grid Skeleton -->
            <div class="mb-12">
                <div class="h-8 bg-gray-700 rounded mb-6 w-48"></div>
                <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    ${Array(10).fill(0).map(() => `
                        <div class="bg-black/30 rounded-xl overflow-hidden animate-pulse">
                            <div class="w-full bg-gray-700" style="height: 200px;"></div>
                            <div class="p-4">
                                <div class="flex items-center justify-between mb-2">
                                    <div class="h-6 bg-gray-700 rounded w-32"></div>
                                    <div class="h-6 bg-gray-700 rounded w-16"></div>
                                </div>
                                <div class="h-4 bg-gray-700 rounded mb-2"></div>
                                <div class="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
                                <div class="flex items-center justify-between">
                                    <div class="h-4 bg-gray-700 rounded w-16"></div>
                                    <div class="h-8 bg-gray-700 rounded w-16"></div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// 游戏详情页面的加载模板
function createGameLoadingTemplate() {
    return `
        <div class="max-w-6xl mx-auto animate-pulse">
            <!-- Game iframe skeleton -->
            <div class="bg-black/30 rounded-2xl overflow-hidden mb-8">
                <div class="aspect-[16/9] w-full bg-gray-700 flex items-center justify-center" style="min-height: 600px;">
                    <div class="text-center">
                        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gaming-primary mx-auto mb-4"></div>
                        <p class="text-gray-400">Loading game...</p>
                    </div>
                </div>
            </div>
            
            <!-- Game info skeleton -->
            <div class="bg-black/30 rounded-2xl p-6 mb-8">
                <div class="flex items-center justify-between mb-4">
                    <div class="h-8 bg-gray-700 rounded w-64"></div>
                    <div class="flex items-center space-x-4">
                        <div class="h-6 bg-gray-700 rounded w-16"></div>
                        <div class="h-6 bg-gray-700 rounded w-20"></div>
                    </div>
                </div>
                <div class="h-4 bg-gray-700 rounded mb-2"></div>
                <div class="h-4 bg-gray-700 rounded w-3/4 mb-6"></div>
                
                <div class="mt-6">
                    <div class="h-6 bg-gray-700 rounded w-32 mb-3"></div>
                    <div class="space-y-2">
                        <div class="h-4 bg-gray-700 rounded"></div>
                        <div class="h-4 bg-gray-700 rounded w-5/6"></div>
                    </div>
                </div>
            </div>
            
            <!-- Similar games skeleton -->
            <div class="mt-12">
                <div class="h-8 bg-gray-700 rounded w-48 mb-6"></div>
                <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    ${Array(5).fill(0).map(() => `
                        <div class="bg-black/30 rounded-xl overflow-hidden">
                            <div class="w-full bg-gray-700" style="height: 200px;"></div>
                            <div class="p-4">
                                <div class="flex items-center justify-between mb-2">
                                    <div class="h-6 bg-gray-700 rounded w-32"></div>
                                    <div class="h-6 bg-gray-700 rounded w-16"></div>
                                </div>
                                <div class="h-4 bg-gray-700 rounded mb-2"></div>
                                <div class="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
                                <div class="flex items-center justify-between">
                                    <div class="h-4 bg-gray-700 rounded w-16"></div>
                                    <div class="h-8 bg-gray-700 rounded w-16"></div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// 格式化播放次数
function formatPlays(plays) {
    if (!plays) return '0';
    if (plays >= 1000) {
        return Math.floor(plays / 1000) + 'K+';
    }
    return plays.toString();
}

// 本地存储管理最近玩过的游戏
function addToRecentlyPlayed(game) {
    try {
        const STORAGE_KEY = 'recentlyPlayedGames';
        const MAX_GAMES = 10; // 最多保存10个游戏（两行）
        
        let recentGames = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        
        // 移除已存在的相同游戏
        recentGames = recentGames.filter(g => g.id !== game.id);
        
        // 添加到开头
        recentGames.unshift({
            id: game.id,
            title: game.title,
            slug: game.slug,
            thumbnail: game.thumbnail,
            coverImage: game.coverImage,
            category: game.category,
            description: game.description,
            plays: game.plays,
            playedAt: new Date().toISOString()
        });
        
        // 限制数量
        if (recentGames.length > MAX_GAMES) {
            recentGames = recentGames.slice(0, MAX_GAMES);
        }
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recentGames));
        console.log('Added game to recently played:', game.title);
    } catch (error) {
        console.error('Error adding to recently played:', error);
    }
}

// 获取最近玩过的游戏
async function getRecentlyPlayedGames() {
    try {
        const STORAGE_KEY = 'recentlyPlayedGames';
        const recentGames = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        
        // 如果没有最近玩过的游戏，返回空数组
        if (recentGames.length === 0) {
            return [];
        }
        
        // 验证游戏是否仍然存在于数据库中
        const validGames = [];
        for (const game of recentGames) {
            try {
                const gameQuery = query(
                    collection(db, 'games'),
                    where('slug', '==', game.slug)
                );
                const snapshot = await getDocs(gameQuery);
                if (!snapshot.empty) {
                    // 使用数据库中的最新数据
                    const dbGame = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
                    validGames.push(dbGame);
                }
            } catch (error) {
                console.error('Error verifying game:', game.slug, error);
                // 如果数据库查询失败，使用本地存储的数据
                validGames.push(game);
            }
        }
        
        return validGames.slice(0, 10); // 最多返回10个
    } catch (error) {
        console.error('Error getting recently played games:', error);
        return [];
    }
}

// 显示最近玩过的游戏
function displayRecentlyPlayedGames(games) {
    const section = document.getElementById('recently-played');
    const grid = document.getElementById('recently-played-grid');
    
    if (!section || !grid) {
        console.error('Recently played section not found');
        return;
    }
    
    if (games.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    // 显示区域
    section.style.display = 'block';
    
    // 渲染游戏卡片
    grid.innerHTML = games.map(game => createGameCard(game)).join('');
}

// incrementPlays函数已在index.html中定义为全局函数

// 创建游戏卡片
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

// 导航到游戏页面的函数
function navigateToGame(gameSlug, gameId) {
    try {
        // 增加游戏播放次数
        if (typeof incrementPlays === 'function') {
            incrementPlays(gameId);
        }
        // 使用路由导航
        history.pushState(null, '', `/games/${gameSlug}`);
        handleRoute();
    } catch (error) {
        console.error('Error navigating to game:', error);
        // 降级到直接页面跳转
        window.location.href = `/games/${gameSlug}`;
    }
}

// 将函数添加到全局作用域
window.navigateToGame = navigateToGame;