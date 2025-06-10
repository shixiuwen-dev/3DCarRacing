import { getFirestore, collection, getDocs, query, where, orderBy, limit, startAfter, doc, updateDoc, increment, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { db } from './firebase-init.js';

const mainContent = document.getElementById('main-content');

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
        
        // 对于静态页面，直接跳转而不是使用AJAX加载
        if (url.endsWith('.html')) {
            console.log('🔗 Navigating to static page:', url);
            window.location.href = url;
            return;
        }
        
        // 对于其他路由，使用客户端路由
        history.pushState(null, '', url);
        handleRoute();
    }
}

// 处理路由
async function handleRoute() {
    const path = window.location.pathname;
    console.log('🛣️ Current path:', path);
    console.log('🔄 handleRoute called');
    const [base, param] = path.split('/').filter(Boolean);
    console.log('Route parts:', { base, param });
    
    // 显示加载状态
    mainContent.innerHTML = createLoadingTemplate();

    try {
        if (!base) {
            console.log('Showing home page');
            await showHomePage();
        } else if (base === 'categories') {
            // 移除.html后缀
            const category = param ? param.replace('.html', '') : '';
            console.log('Showing category page:', category);
            if (category) {
                await showCategoryPage(category);
            } else {
                showErrorPage('Category not found');
            }
        } else if (base === 'games') {
            // 移除.html后缀
            const gameSlug = param ? param.replace('.html', '') : '';
            console.log('Showing game page:', gameSlug);
            if (gameSlug) {
                await showGamePage(gameSlug);
            } else {
                showErrorPage('Game not found');
            }
        } else if (path in routes) {
            // 处理静态页面路由
            await routes[path]();
        } else {
            console.log('Unknown route:', path);
            showErrorPage('Page not found');
        }
    } catch (error) {
        console.error('Route handling error:', error);
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
            limit(12)
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
            limit(12)
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
        if (moreGames.length < 12) {
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
        
        // 获取其他分类游戏
        console.log('Fetching other games...');
        const otherGames = await getOtherGames();
        console.log('Other games loaded:', otherGames.length, 'games');
        console.log('Other games data:', otherGames);
        
        // 获取所有游戏
        console.log('Fetching all games...');
        const allGames = await getAllGames();
        console.log('All games loaded:', allGames.length, 'games');
        console.log('All games data:', allGames);
        
        // 获取游戏总数以判断是否需要显示Load More按钮
        const totalGamesCount = await getTotalGamesCount();
        console.log('Total games in database:', totalGamesCount);
        console.log('Total games type:', typeof totalGamesCount);
        console.log('Should show Load More button?', totalGamesCount > 12);
        console.log('Comparison result:', totalGamesCount, '>', 12, '=', totalGamesCount > 12);
        
        // 如果没有游戏数据，提示用户初始化数据
        if (!allGames || allGames.length === 0) {
            console.warn('No games found in database. Database may need to be initialized.');
        }

        // 检查是否有热门游戏和其他游戏
        const hasPopularGames = popularGames && popularGames.length > 0;
        const hasOtherGames = otherGames && otherGames.length > 0;
        console.log('Has popular games:', hasPopularGames);
        console.log('Has other games:', hasOtherGames);
    
        mainContent.innerHTML = `
            <div class="container mx-auto px-4 py-8">
                <section id="new-games" class="mb-12">
                    <h2 class="text-2xl font-bold mb-6">New Games</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[320px]">
                        ${newGames && newGames.length > 0 ? 
                            newGames.map(game => createGameCard(game)).join('') : 
                            '<div class="col-span-full text-center py-12"><p class="text-gray-400">No new games available at the moment. Check back later!</p></div>'
                        }
                    </div>
                </section>
                
                ${hasPopularGames ? `
                    <section id="popular" class="mb-12">
                        <h2 class="text-2xl font-bold mb-6">Popular Games</h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[320px]">
                            ${popularGames && popularGames.length > 0 ? 
                                popularGames.map(game => createGameCard(game)).join('') : 
                                '<div class="col-span-full text-center py-12"><p class="text-gray-400">No popular games available at the moment.</p></div>'
                            }
                        </div>
                    </section>
                ` : ''}

                ${hasOtherGames ? `
                    <section id="other-games" class="mb-12">
                        <h2 class="text-2xl font-bold mb-6">Other Games</h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[320px]">
                            ${otherGames && otherGames.length > 0 ? 
                                otherGames.map(game => createGameCard(game)).join('') : 
                                '<div class="col-span-full text-center py-12"><p class="text-gray-400">No other games available at the moment.</p></div>'
                            }
                        </div>
                    </section>
                ` : ''}

                <section id="all-games" class="mb-12">
                    <h2 class="text-2xl font-bold mb-6">All Games (${totalGamesCount})</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[320px] h-auto">
                        ${allGames && allGames.length > 0 ? 
                            allGames.map(game => createGameCard(game)).join('') : 
                            '<div class="col-span-full text-center py-12"><p class="text-gray-400 mb-4">暂无游戏数据</p><a href="/init-data.html" class="bg-gaming-primary hover:bg-gaming-primary/80 px-4 py-2 rounded-lg transition">初始化示例数据</a></div>'
                        }
                    </div>
                    ${totalGamesCount > 12 ? `
                        <div class="text-center mt-8">
                            <button onclick="loadMoreGames()" class="px-6 py-3 bg-gaming-primary hover:bg-gaming-primary/80 rounded-lg transition">
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
        
        return games;
    } catch (error) {
        console.error('Error getting games:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        throw error;
    }
}

// 获取新游戏
async function getNewGames() {
    return getGames({
        orderBy: 'createdAt',
        orderDirection: 'desc',
        limit: 4
    });
}

// 获取热门游戏
async function getPopularGames() {
    try {
        console.log('Getting popular games...');
        // 直接获取播放次数最多的4个游戏
        const games = await getGames({
            orderBy: 'plays',
            orderDirection: 'desc',
            limit: 4
        });
        console.log('Popular games loaded:', games.length, 'games');
        return games;
    } catch (error) {
        console.error('Error getting popular games:', error);
        return [];
    }
}

// 获取相似游戏
async function getSimilarGames(category, excludeId) {
    try {
        const games = await getGames({
            category: category,
            limit: 4
        });
        return games.filter(game => game.id !== excludeId);
    } catch (error) {
        console.error('Error getting similar games:', error);
        return [];
    }
}

// 获取其他分类游戏
async function getOtherGames() {
    try {
        console.log('Getting other category games...');
        const games = await getGames({
            category: 'other',
            orderBy: 'createdAt',
            orderDirection: 'desc',
            limit: 4
        });
        console.log('Other games loaded:', games.length, 'games');
        return games;
    } catch (error) {
        console.error('Error getting other games:', error);
        return [];
    }
}

// 分类页面内容
async function showCategoryPage(category) {
    try {
        // 显示加载状态
        mainContent.innerHTML = createLoadingTemplate();
        
        console.log('Loading category:', category);
        // 确保分类名称正确
        const normalizedCategory = category.toLowerCase();
        console.log('Normalized category:', normalizedCategory);
        
        // 使用通用的 getGames 函数获取数据
        const games = await getGames({
            category: normalizedCategory,
            orderBy: 'createdAt',
            orderDirection: 'desc'
        });
        
        console.log('Games loaded:', games.length);
        
        if (games.length === 0) {
            mainContent.innerHTML = `
                <section class="relative rounded-2xl overflow-hidden mb-12 bg-gaming-primary/10 p-8">
                    <h1 class="text-4xl md:text-5xl font-bold mb-4">${category} Games</h1>
                    <p class="text-xl text-gray-300 max-w-2xl">Explore our collection of amazing ${category.toLowerCase()} games!</p>
                </section>
                <section class="text-center py-12">
                    <h2 class="text-2xl font-bold mb-4">No games found in ${category} category</h2>
                    <p class="text-gray-400">Check back later for new games!</p>
                    <a href="/" class="inline-block mt-6 bg-gaming-primary hover:bg-gaming-primary/80 px-6 py-3 rounded-lg transition">Back to Home</a>
                </section>
            `;
            return;
        }
        
        mainContent.innerHTML = `
            <section class="relative rounded-2xl overflow-hidden mb-12 bg-gaming-primary/10 p-8">
                <h1 class="text-4xl md:text-5xl font-bold mb-4">${category} Games</h1>
                <p class="text-xl text-gray-300 max-w-2xl">Explore our collection of amazing ${category.toLowerCase()} games!</p>
            </section>
            
            <section class="mb-12">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    ${games.map(game => createGameCard(game)).join('')}
                </div>
            </section>
        `;
    } catch (error) {
        console.error('Error loading category:', error);
        mainContent.innerHTML = `
            <section class="relative rounded-2xl overflow-hidden mb-12 bg-gaming-primary/10 p-8">
                <h1 class="text-4xl md:text-5xl font-bold mb-4">${category} Games</h1>
                <p class="text-xl text-gray-300 max-w-2xl">Explore our collection of amazing ${category.toLowerCase()} games!</p>
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

// 游戏详情页面内容
async function showGamePage(gameSlug) {
    try {
        console.log('Loading game:', gameSlug);
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
        
        if (!game.embedUrl) {
            console.error('Game embedUrl is missing');
            showErrorPage('Game is currently unavailable');
            return;
        }
        
        const similarGames = await getSimilarGames(game.category, game.id);
        console.log('Similar games:', similarGames);
        
        mainContent.innerHTML = `
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
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            ${similarGames.map(game => `
                                <div class="game-card rounded-xl overflow-hidden group h-full flex flex-col">
                                    <div class="relative overflow-hidden flex-shrink-0" style="height: 200px; min-height: 200px;">
                                        <img src="${game.thumbnail}" 
                                             alt="${game.title}" 
                                             class="w-full h-full object-cover transform group-hover:scale-110 transition duration-300">
                                    </div>
                                    <div class="p-4 flex flex-col flex-grow">
                                        <div class="flex items-center justify-between mb-2">
                                            <h3 class="text-lg font-bold line-clamp-1">${game.title}</h3>
                                            <span class="px-2 py-1 bg-gaming-primary/20 rounded text-sm flex-shrink-0 ml-2">${game.category}</span>
                                        </div>
                                        <p class="text-sm text-gray-300 mt-1 line-clamp-2" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${game.description}</p>
                                                        <div class="flex items-center justify-between mt-auto pt-4">
                    <span class="text-sm text-gray-400">${game.plays || 0} plays</span>
                    <a href="/games/${game.slug}" data-route class="bg-gaming-primary hover:bg-gaming-primary/80 px-4 py-2 rounded-lg transition" onclick="incrementPlays('${game.id}')">Play</a>
                </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    } catch (error) {
        console.error('Error loading game:', error);
        showErrorPage(`Error loading game: ${error.message}`);
    }
}

// 错误页面
function showErrorPage(message) {
    console.error('Showing error page:', message);
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
        <div class="flex items-center justify-center min-h-[400px]">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gaming-primary"></div>
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

// incrementPlays函数已在index.html中定义为全局函数

// 创建游戏卡片
function createGameCard(game) {
    console.log('Creating game card for:', game);
    console.log('Game thumbnail:', game.thumbnail);
    console.log('Game cover image:', game.coverImage);
    
    return `
        <div class="game-card bg-black/30 rounded-xl overflow-hidden group flex flex-col">
            <div class="relative w-full bg-black/50" style="height: 200px; min-height: 200px;">
                <div class="absolute inset-0 flex items-center justify-center">
                    <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gaming-primary image-loading"></div>
                </div>
                <img src="${game.thumbnail || game.coverImage || '/assets/game-placeholder.svg'}" 
                     alt="${game.title}" 
                     class="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition duration-300"
                     onload="this.parentElement.querySelector('.image-loading').style.display='none'"
                     onerror="this.src='/assets/game-placeholder.svg'">
            </div>
            <div class="p-4 flex flex-col flex-grow">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-lg font-bold line-clamp-1">${game.title}</h3>
                    <span class="px-2 py-1 bg-gaming-primary/20 rounded text-sm flex-shrink-0 ml-2">${game.category}</span>
                </div>
                <p class="text-sm text-gray-300 mt-1 line-clamp-2" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${game.description}</p>
                                                        <div class="flex items-center justify-between mt-auto pt-4">
                                            <span class="text-sm text-gray-400">${game.plays || 0} plays</span>
                                            <a href="/games/${game.slug}" data-route class="bg-gaming-primary hover:bg-gaming-primary/80 px-4 py-2 rounded-lg transition" onclick="incrementPlays('${game.id}')">Play</a>
                                        </div>
            </div>
        </div>
    `;
} 