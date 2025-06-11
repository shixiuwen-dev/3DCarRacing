import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { firebaseConfig } from '../../scripts/firebase-init.js';

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 代理服务器URL
const PROXY_URL = 'http://localhost:3007/proxy?url=';

// 检查游戏是否已存在
async function checkGameExists(slug, sourceUrl) {
    try {
        console.log('检查游戏是否已存在:', { slug, sourceUrl });
        const gamesCollection = collection(db, 'games');
        
        // 检查slug是否重复
        const slugQuery = query(gamesCollection, where('slug', '==', slug));
        const slugSnapshot = await getDocs(slugQuery);
        
        if (!slugSnapshot.empty) {
            console.log('发现重复slug:', slug);
            return { exists: true, reason: 'slug重复' };
        }
        
        // 检查sourceUrl是否重复
        const urlQuery = query(gamesCollection, where('sourceUrl', '==', sourceUrl));
        const urlSnapshot = await getDocs(urlQuery);
        
        if (!urlSnapshot.empty) {
            console.log('发现重复sourceUrl:', sourceUrl);
            return { exists: true, reason: 'URL重复' };
        }
        
        return { exists: false };
    } catch (error) {
        console.error('检查重复失败:', error);
        return { exists: false }; // 出错时允许添加
    }
}

// 查找包含特定文本的表格行
function findTableRowByLabel(doc, label) {
    const rows = doc.querySelectorAll('.game-info__table-row');
    for (const row of rows) {
        const dt = row.querySelector('dt');
        if (dt && dt.textContent.trim() === label) {
            return row.querySelector('dd');
        }
    }
    return null;
}

// 验证缩略图是否可用
async function validateThumbnail(thumbnailUrl) {
    if (!thumbnailUrl) return false;
    
    try {
        const response = await fetch(thumbnailUrl, { method: 'HEAD' });
        return response.ok && response.headers.get('content-type')?.startsWith('image/');
    } catch (error) {
        console.error('验证缩略图失败:', error);
        return false;
    }
}

// 将原始分类映射到已有分类
function mapToExistingCategory(rawCategory) {
    if (!rawCategory) return 'other';
    
    const normalizedCategory = rawCategory.toLowerCase().trim();
    
    // 定义分类映射规则
    const categoryMappings = {
        // Action 动作类
        action: ['action', 'fighting', 'shooting', 'beat em up', 'platform', 'platformer'],
        
        // Racing 竞速类
        racing: ['racing', 'driving', 'car', 'motorcycle', 'bike', 'truck', 'drift'],
        
        // Strategy 策略类
        strategy: ['strategy', 'puzzle', 'tower defense', 'real time strategy', 'rts', 'turn based', 'chess', 'checkers'],
        
        // Sport 运动类
        sport: ['sport', 'sports', 'basketball', 'football', 'soccer', 'tennis', 'golf', 'baseball', 'hockey', 'volleyball', 'athletics'],
        
        // Arcade 街机类
        arcade: ['arcade', 'casual', 'classic', 'retro', 'skill']
    };
    
    // 遍历映射规则
    for (const [targetCategory, keywords] of Object.entries(categoryMappings)) {
        for (const keyword of keywords) {
            if (normalizedCategory.includes(keyword)) {
                console.log(`分类映射: "${rawCategory}" -> "${targetCategory}" (匹配关键词: "${keyword}")`);
                return targetCategory;
            }
        }
    }
    
    // 如果没有匹配到任何已有分类，返回 'other'
    console.log(`分类映射: "${rawCategory}" -> "other" (未匹配任何已有分类)`);
    return 'other';
}

// 获取游戏数据
async function fetchGameData(url) {
    try {
        console.log('开始获取游戏数据:', url);
        // 通过代理服务器获取页面内容
        const response = await fetch(`${PROXY_URL}${encodeURIComponent(url)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        console.log('成功获取页面内容');
        
        // 创建一个临时的 DOM 解析器
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        console.log('成功解析HTML');
        
        // 提取游戏信息
        const title = doc.querySelector('h1')?.textContent?.trim() || '';
        const description = doc.querySelector('meta[name="description"]')?.content || '';
        let thumbnail = doc.querySelector('meta[property="og:image"]')?.content || '';
        
        // 验证缩略图
        // const thumbnailValid = await validateThumbnail(thumbnail);
        // if (!thumbnailValid) {
        //     console.log('缩略图无效，尝试其他来源');
        //     // 尝试其他可能的缩略图来源
        //     const altThumbnails = [
        //         doc.querySelector('.game-thumbnail img')?.src,
        //         doc.querySelector('.game-image img')?.src,
        //         doc.querySelector('.hero-image img')?.src,
        //         doc.querySelector('[class*="thumbnail"] img')?.src
        //     ].filter(Boolean);
            
        //     for (const altThumb of altThumbnails) {
        //         if (await validateThumbnail(altThumb)) {
        //             thumbnail = altThumb;
        //             console.log('找到有效的替代缩略图:', thumbnail);
        //             break;
        //         }
        //     }
            
        //     if (!thumbnailValid && !await validateThumbnail(thumbnail)) {
        //         throw new Error('无法找到有效的缩略图');
        //     }
        // }
        
        console.log('提取基本信息:', { title, description: description.substring(0, 50) + '...', thumbnail });
        
        // 获取游戏分类
        const categoryElement = findTableRowByLabel(doc, 'Category');
        const rawCategory = categoryElement ? categoryElement.textContent.trim() : '';
        
        // 分类映射到已有分类
        const category = mapToExistingCategory(rawCategory);
        console.log('原始分类:', rawCategory, '-> 映射分类:', category);
        
        // 获取游戏嵌入URL
        const embedUrl = url.replace('game/', 'embed/');
        
        // 获取游戏说明
        const howToPlayElement = findTableRowByLabel(doc, 'Controls');
        const howToPlay = howToPlayElement ? howToPlayElement.textContent.trim() : '';
        console.log('游戏说明:', howToPlay);
        
        // 获取游戏特性
        const featuresElement = findTableRowByLabel(doc, 'Features');
        const features = featuresElement ? featuresElement.textContent.trim() : '';
        console.log('游戏特性:', features);
        
        // 获取播放次数
        let plays = 0;
        
        // 尝试从多个可能的选择器获取播放次数
        const playsSelectors = [
            '.game-info__plays',
            '.game-stats__plays',
            '.stats__plays',
            '[data-plays]',
            '.play-count'
        ];
        
        for (const selector of playsSelectors) {
            const playsElement = doc.querySelector(selector);
            if (playsElement) {
                const playsText = playsElement.textContent.trim();
                // 解析播放次数文本，例如 "1.2M plays" -> 1200000
                const playsMatch = playsText.match(/([\d.]+)([KMB]?)/i);
                if (playsMatch) {
                    let num = parseFloat(playsMatch[1]);
                    const suffix = playsMatch[2].toUpperCase();
                    if (suffix === 'K') num *= 1000;
                    else if (suffix === 'M') num *= 1000000;
                    else if (suffix === 'B') num *= 1000000000;
                    plays = Math.floor(num);
                    console.log('找到播放次数:', playsText, '->', plays);
                    break;
                }
            }
        }
        
        // 如果没有找到播放次数，从表格行中查找
        if (plays === 0) {
            const playsTableElement = findTableRowByLabel(doc, 'Plays');
            if (playsTableElement) {
                const playsText = playsTableElement.textContent.trim();
                const playsMatch = playsText.match(/([\d.]+)([KMB]?)/i);
                if (playsMatch) {
                    let num = parseFloat(playsMatch[1]);
                    const suffix = playsMatch[2].toUpperCase();
                    if (suffix === 'K') num *= 1000;
                    else if (suffix === 'M') num *= 1000000;
                    else if (suffix === 'B') num *= 1000000000;
                    plays = Math.floor(num);
                    console.log('从表格找到播放次数:', playsText, '->', plays);
                }
            }
        }
        
        // 如果仍然没有找到，生成一个随机的合理播放次数
        if (plays === 0) {
            plays = Math.floor(Math.random() * 50000) + 1000; // 1000-51000 之间的随机数
            console.log('未找到播放次数，生成随机数:', plays);
        }
        
        // 尝试查找悬停动画 - 从页面HTML中搜索真实URL
        let hoverAnimation = null;
        
        // 1. 从页面HTML中搜索符合CrazyGames动画URL模式的链接
        const gameSlug = url.split('/game/')[1];
        console.log('开始搜索动画URL，游戏slug:', gameSlug);
        
        // 搜索符合模式的URL：https://videos.crazygames.com/...494x276_30fps.mp4
        const animationUrlPattern = /https:\/\/videos\.crazygames\.com\/[^"'\s]*494x276_30fps\.mp4/g;
        const htmlContent = html || '';
        const foundAnimationUrls = htmlContent.match(animationUrlPattern);
        
        if (foundAnimationUrls && foundAnimationUrls.length > 0) {
            // 如果找到多个，优先选择包含游戏slug的
            let bestMatch = foundAnimationUrls[0];
            if (gameSlug) {
                const matchWithSlug = foundAnimationUrls.find(url => url.includes(gameSlug));
                if (matchWithSlug) {
                    bestMatch = matchWithSlug;
                }
            }
            hoverAnimation = bestMatch;
            console.log('从页面HTML中找到动画URL:', hoverAnimation);
        } else {
            console.log('未在页面HTML中找到符合模式的动画URL');
        }
        
        // 2. 如果还没找到，尝试搜索其他可能的动画URL模式（作为备用）
        if (!hoverAnimation) {
            console.log('尝试搜索其他动画URL模式...');
            const otherAnimationPatterns = [
                // 查找其他可能的CrazyGames动画URL
                /https:\/\/videos\.crazygames\.com\/[^"'\s]*\.mp4/g,
                // 查找其他MP4 URL
                /https?:\/\/[^"'\s]*preview[^"'\s]*\.mp4/g,
                /https?:\/\/[^"'\s]*hover[^"'\s]*\.mp4/g,
                /https?:\/\/[^"'\s]*animation[^"'\s]*\.mp4/g
            ];
            
            for (const pattern of otherAnimationPatterns) {
                const matches = htmlContent.match(pattern);
                if (matches && matches.length > 0) {
                    // 过滤出最可能的动画URL
                    const relevantMatches = matches.filter(url => 
                        url.includes('videos.crazygames.com') ||
                        (gameSlug && url.includes(gameSlug)) || 
                        url.includes('preview') || 
                        url.includes('hover') ||
                        url.includes('animation')
                    );
                    
                    if (relevantMatches.length > 0) {
                        hoverAnimation = relevantMatches[0];
                        console.log('从备用模式找到动画URL:', hoverAnimation);
                        break;
                    }
                }
            }
        }
        
        // 3. 最终检查：如果仍未找到，记录日志并设置为null
        if (!hoverAnimation) {
            console.log('所有方法均未找到动画URL，hoverAnimation将设置为null');
        }
        
        if (hoverAnimation) {
            console.log('✅ 最终悬停动画URL:', hoverAnimation);
        } else {
            console.log('❌ 未找到悬停动画，将设置为null');
        }
        
        // 生成 slug
        const slug = title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        
        return {
            title,
            slug,
            description,
            thumbnail,
            embedUrl,
            category,
            howToPlay,
            features,
            sourceUrl: url,
            plays,
            hoverAnimation
        };
    } catch (error) {
        console.error('获取游戏数据失败:', error);
        throw error;
    }
}

// 保存游戏到 Firebase
async function saveGameToFirebase(gameData) {
    try {
        console.log('开始保存游戏到 Firebase');
        const db = getFirestore();
        const gamesCollection = collection(db, 'games');
        
        // 添加游戏文档
        const docRef = await addDoc(gamesCollection, {
            ...gameData,
            createdAt: serverTimestamp()
        });
        
        console.log('游戏保存成功');
        return docRef.id;
    } catch (error) {
        console.error('保存游戏失败:', error);
        throw error;
    }
}

// 采集并保存游戏
export async function crawlAndSaveGame(url, forceCategory = null) {
    try {
        console.log('开始采集游戏:', url);
        const gameData = await fetchGameData(url);
        console.log('游戏数据采集完成');
        
        // 如果指定了强制分类，覆盖原有分类
        if (forceCategory) {
            const originalCategory = gameData.category;
            gameData.category = forceCategory;
            console.log(`强制分类设置: ${originalCategory} -> ${forceCategory}`);
        }
        
        // 检查是否重复
        const duplicateCheck = await checkGameExists(gameData.slug, gameData.sourceUrl);
        if (duplicateCheck.exists) {
            throw new Error(`游戏已存在: ${duplicateCheck.reason}`);
        }
        
        const gameId = await saveGameToFirebase(gameData);
        console.log('游戏保存成功，ID:', gameId);
        return gameId;
    } catch (error) {
        console.error('采集游戏失败:', error);
        throw error;
    }
}

// 从指定URL获取游戏链接
async function getGameLinksFromUrl(sourceUrl = 'https://www.crazygames.com/') {
    try {
        console.log(`从 ${sourceUrl} 获取游戏链接...`);
        const response = await fetch(`${PROXY_URL}${encodeURIComponent(sourceUrl)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        console.log('成功获取首页内容，长度:', html.length);
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // 查找游戏链接 - 更全面的选择器
        const gameLinks = [];
        const linkSelectors = [
            'a[href*="/game/"]',
            '[href*="/game/"]',
            '.game-link',
            '.game-card a',
            '.game-item a',
            '[class*="game"] a',
            'article a',
            '.grid a[href*="/game/"]',
            '.list a[href*="/game/"]'
        ];
        
        console.log('开始分析页面中的游戏链接...');
        console.log('HTML内容前1000字符:', html.substring(0, 1000));
        
        // 先尝试查找任何包含"/game/"的链接
        const allLinksWithGame = html.match(/href="[^"]*\/game\/[^"]*"/g);
        if (allLinksWithGame) {
            console.log(`通过正则表达式在HTML中找到 ${allLinksWithGame.length} 个包含/game/的链接`);
            allLinksWithGame.slice(0, 10).forEach((match, index) => {
                console.log(`正则匹配 ${index + 1}: ${match}`);
            });
        }
        
        for (const selector of linkSelectors) {
            const links = doc.querySelectorAll(selector);
            console.log(`使用选择器 "${selector}" 找到 ${links.length} 个元素`);
            
            for (const link of links) {
                const href = link.getAttribute('href') || link.href;
                if (href && href.includes('/game/')) {
                    let fullUrl = href;
                    if (href.startsWith('/')) {
                        fullUrl = 'https://www.crazygames.com' + href;
                    }
                    
                    // 放宽链接格式验证，允许更多格式
                    if (fullUrl.includes('crazygames.com/game/') && !fullUrl.includes('#')) {
                        // 清理URL，移除查询参数
                        const cleanUrl = fullUrl.split('?')[0].split('#')[0];
                        if (!gameLinks.includes(cleanUrl)) {
                            gameLinks.push(cleanUrl);
                            console.log(`添加游戏链接: ${cleanUrl}`);
                        }
                    }
                }
            }
        }
        
        // 尝试更全面的正则表达式解析
        console.log('使用多种正则表达式模式搜索游戏链接...');
        const regexPatterns = [
            /href="([^"]*\/game\/[^"]*?)"/g,           // 标准的href属性
            /href='([^']*\/game\/[^']*?)'/g,           // 单引号href
            /"([^"]*\/game\/[^"]*?)"/g,                // 任何双引号内的game链接
            /'([^']*\/game\/[^']*?)'/g,                // 任何单引号内的game链接
            /\/game\/([a-z0-9\-]+)/g                   // 直接匹配/game/slug模式
        ];
        
        regexPatterns.forEach((pattern, index) => {
            let match;
            while ((match = pattern.exec(html)) !== null) {
                let gameUrl = match[1] || match[0];
                
                // 确保是完整的URL路径
                if (gameUrl.startsWith('/game/')) {
                    gameUrl = 'https://www.crazygames.com' + gameUrl;
                } else if (gameUrl.startsWith('game/')) {
                    gameUrl = 'https://www.crazygames.com/' + gameUrl;
                } else if (!gameUrl.startsWith('http') && gameUrl.includes('/game/')) {
                    // 提取/game/部分
                    const gameMatch = gameUrl.match(/\/game\/[^\/\s"']+/);
                    if (gameMatch) {
                        gameUrl = 'https://www.crazygames.com' + gameMatch[0];
                    }
                }
                
                // 清理URL
                const cleanUrl = gameUrl.split('?')[0].split('#')[0];
                if (cleanUrl.includes('crazygames.com/game/') && !gameLinks.includes(cleanUrl)) {
                    gameLinks.push(cleanUrl);
                    console.log(`模式${index + 1}添加游戏链接: ${cleanUrl}`);
                }
            }
        });
        
        // 从JavaScript数据中提取游戏信息
        console.log('从JavaScript数据中查找游戏...');
        const jsDataPatterns = [
            // 查找JSON数据中的游戏信息
            /"slug"\s*:\s*"([^"]+)"/g,
            /"name"\s*:\s*"([^"]+)"/g,
            /game[_-]?slug['"]\s*:\s*['"]([^'"]+)['"]/gi,
            /game[_-]?id['"]\s*:\s*['"]([^'"]+)['"]/gi,
            // 查找游戏名称模式
            /['"]([\w\-]+(?:\-\d+)?)['"]\s*:\s*\{[^}]*game/gi,
            // 查找游戏slug的各种变体
            /['"]([a-z0-9\-]+)['"]\s*,\s*['"]([a-z0-9\-]+)['"].*?game/gi
        ];
        
        const foundGameSlugs = new Set();
        
        jsDataPatterns.forEach((pattern, index) => {
            let match;
            while ((match = pattern.exec(html)) !== null) {
                const slug = match[1];
                if (slug && slug.length > 2 && slug.includes('-') && !slug.includes(' ')) {
                    foundGameSlugs.add(slug);
                    console.log(`JS模式${index + 1}找到游戏slug: ${slug}`);
                }
            }
        });
        
        // 将找到的slugs转换为游戏URL
        foundGameSlugs.forEach(slug => {
            const gameUrl = `https://www.crazygames.com/game/${slug}`;
            if (!gameLinks.includes(gameUrl)) {
                gameLinks.push(gameUrl);
                console.log(`从JS数据添加游戏: ${gameUrl}`);
            }
        });
        
        // 专门查找页面中提到的游戏名称并构造URL
        console.log('查找页面中的游戏名称...');
        const gameNamePatterns = [
            // 查找所有可能的游戏名称（连字符分隔的词）
            /\b([a-z]+(?:-[a-z0-9]+){1,4})\b/g,
            // 查找引号中的游戏名称
            /["']([a-z]+(?:-[a-z0-9]+)+)["']/g,
            // 查找数据属性中的游戏名称
            /data-[\w-]*="([a-z]+(?:-[a-z0-9]+)+)"/g
        ];
        
        const potentialGameNames = new Set();
        gameNamePatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(html)) !== null) {
                const name = match[1];
                if (name && name.length > 5 && name.split('-').length >= 2) {
                    potentialGameNames.add(name);
                }
            }
        });
        
        // 验证这些名称是否真的是游戏
        const knownGameKeywords = ['game', 'play', 'adventure', 'action', 'puzzle', 'strategy', 'arcade', 'shooter', 'racing', 'sports'];
        potentialGameNames.forEach(name => {
            // 检查游戏名称周围的上下文
            const nameRegex = new RegExp(`\\b${name}\\b`, 'gi');
            const matches = html.match(nameRegex);
            if (matches && matches.length >= 2) {  // 至少出现2次
                // 检查上下文是否包含游戏相关词汇
                const contextRegex = new RegExp(`(.{0,100}\\b${name}\\b.{0,100})`, 'gi');
                const contexts = html.match(contextRegex) || [];
                
                const hasGameContext = contexts.some(context => 
                    knownGameKeywords.some(keyword => 
                        context.toLowerCase().includes(keyword)
                    )
                );
                
                if (hasGameContext) {
                    const gameUrl = `https://www.crazygames.com/game/${name}`;
                    if (!gameLinks.includes(gameUrl)) {
                        gameLinks.push(gameUrl);
                        console.log(`从上下文推断添加游戏: ${gameUrl}`);
                    }
                }
            }
        });
        
        // 专门处理已知遗漏的游戏
        const knownMissingGames = ['cursed-treasure-2', 'fortzone-battle-royale', 'stickman-clash'];
        knownMissingGames.forEach(gameName => {
            if (html.includes(gameName)) {
                const specificUrl = `https://www.crazygames.com/game/${gameName}`;
                if (!gameLinks.includes(specificUrl)) {
                    gameLinks.push(specificUrl);
                    console.log(`手动添加已知游戏: ${specificUrl}`);
                }
            }
        });
        
        console.log(`总共找到 ${gameLinks.length} 个有效游戏链接`);
        
        // 如果从当前页面没找到足够的链接，尝试从其他分类页面获取
        if (gameLinks.length < 10 && sourceUrl === 'https://www.crazygames.com/') {
            console.log('首页链接不足，尝试从分类页面获取...');
            const categoryUrls = [
                'https://www.crazygames.com/t/action',
                'https://www.crazygames.com/t/adventure',
                'https://www.crazygames.com/t/racing',
                'https://www.crazygames.com/t/strategy'
            ];
            
            for (const categoryUrl of categoryUrls) {
                try {
                    const catResponse = await fetch(`${PROXY_URL}${encodeURIComponent(categoryUrl)}`);
                    if (catResponse.ok) {
                        const catHtml = await catResponse.text();
                        const catDoc = parser.parseFromString(catHtml, 'text/html');
                        
                        const catLinks = catDoc.querySelectorAll('a[href*="/game/"]');
                        console.log(`从分类 ${categoryUrl} 找到 ${catLinks.length} 个链接`);
                        
                        for (const link of catLinks) {
                            const href = link.getAttribute('href');
                            if (href && href.includes('/game/')) {
                                let fullUrl = href;
                                if (href.startsWith('/')) {
                                    fullUrl = 'https://www.crazygames.com' + href;
                                }
                                
                                if (fullUrl.match(/https:\/\/www\.crazygames\.com\/game\/[^\/]+$/)) {
                                    if (!gameLinks.includes(fullUrl)) {
                                        gameLinks.push(fullUrl);
                                        console.log(`从分类添加游戏链接: ${fullUrl}`);
                                        
                                        // 限制总数量
                                        if (gameLinks.length >= 40) break;
                                    }
                                }
                            }
                        }
                        
                        if (gameLinks.length >= 40) break;
                    }
                    
                    // 添加延迟避免请求过快
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.error(`获取分类页面失败: ${categoryUrl}`, error);
                }
            }
        }
        
        // 如果仍然链接不足且是分类页面，尝试模拟滚动加载更多内容
        if (gameLinks.length < 20 && (sourceUrl.includes('/c/') || sourceUrl.includes('/t/'))) {
            console.log('分类页面链接不足，尝试查找加载更多的API...');
            
            // 尝试查找可能的AJAX API端点
            const scripts = doc.querySelectorAll('script');
            for (const script of scripts) {
                const content = script.textContent || script.innerHTML;
                if (content && (content.includes('api') || content.includes('load') || content.includes('games'))) {
                    // 查找可能的API URL
                    const apiMatches = content.match(/["']([^"']*api[^"']*games[^"']*)["']/g);
                    if (apiMatches) {
                        console.log('找到可能的API端点:', apiMatches);
                    }
                }
            }
            
            // 尝试构造可能的API URL
            const categoryName = sourceUrl.split('/').pop();
            const possibleApiUrls = [
                `https://www.crazygames.com/api/games?category=${categoryName}`,
                `https://www.crazygames.com/api/v1/games?category=${categoryName}`,
                `https://api.crazygames.com/games?category=${categoryName}`,
                `https://www.crazygames.com/games.json?category=${categoryName}`
            ];
            
            for (const apiUrl of possibleApiUrls) {
                try {
                    console.log(`尝试API: ${apiUrl}`);
                    const apiResponse = await fetch(`${PROXY_URL}${encodeURIComponent(apiUrl)}`);
                    if (apiResponse.ok) {
                        const apiData = await apiResponse.json();
                        console.log('API响应成功，数据长度:', JSON.stringify(apiData).length);
                        
                        // 尝试从API数据中提取游戏链接
                        if (apiData.games && Array.isArray(apiData.games)) {
                            apiData.games.forEach(game => {
                                if (game.slug || game.id) {
                                    const gameUrl = `https://www.crazygames.com/game/${game.slug || game.id}`;
                                    if (!gameLinks.includes(gameUrl)) {
                                        gameLinks.push(gameUrl);
                                        console.log(`API添加游戏链接: ${gameUrl}`);
                                    }
                                }
                            });
                        }
                        break;
                    }
                } catch (error) {
                    console.log(`API尝试失败: ${apiUrl}`, error.message);
                }
            }
        }
        
        console.log(`最终找到 ${gameLinks.length} 个游戏链接`);
        
        // 打印前几个链接作为示例
        gameLinks.slice(0, 10).forEach((link, index) => {
            console.log(`示例链接 ${index + 1}: ${link}`);
        });
        
        // 移除重复和无效链接
        const uniqueLinks = Array.from(new Set(gameLinks)).filter(link => {
            return link && 
                   link.startsWith('https://www.crazygames.com/game/') && 
                   !link.includes('undefined') && 
                   !link.includes('null');
        });
        
        console.log(`去重后有效链接数量: ${uniqueLinks.length}`);
        
        return uniqueLinks.slice(0, 100); // 返回前100个，确保抓取到所有游戏
    } catch (error) {
        console.error('获取首页游戏链接失败:', error);
        throw error;
    }
}

// 自动采集多个游戏
export async function autoCrawlGames(targetCount = 20, logCallback, sourceUrl = 'https://www.crazygames.com/', forceCategory = null) {
    try {
        logCallback('开始自动采集游戏...', 'info');
        if (forceCategory) {
            logCallback(`强制分类模式: 所有游戏将归类为 "${forceCategory}"`, 'info');
        }
        const gameLinks = await getGameLinksFromUrl(sourceUrl);
        logCallback(`找到 ${gameLinks.length} 个候选游戏`, 'info');
        
        let successCount = 0;
        let failCount = 0;
        const results = [];
        
        for (let i = 0; i < gameLinks.length && successCount < targetCount; i++) {
            const url = gameLinks[i];
            const gameName = url.split('/game/')[1] || `game-${i+1}`;
            
            try {
                logCallback(`[${i+1}/${gameLinks.length}] 正在采集: ${gameName}`, 'info');
                
                const gameId = await crawlAndSaveGame(url, forceCategory);
                successCount++;
                results.push({ url, status: 'success', gameId, gameName });
                logCallback(`✅ 采集成功: ${gameName} (ID: ${gameId})`, 'success');
                
                // 添加延迟避免过于频繁的请求
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                failCount++;
                results.push({ url, status: 'failed', error: error.message, gameName });
                logCallback(`❌ 采集失败: ${gameName} - ${error.message}`, 'error');
                
                // 如果是重复游戏，继续下一个
                if (error.message.includes('游戏已存在')) {
                    logCallback(`跳过重复游戏，继续下一个...`, 'warning');
                    continue;
                }
                
                // 如果是缩略图问题，也继续下一个
                if (error.message.includes('缩略图')) {
                    logCallback(`跳过无缩略图游戏，继续下一个...`, 'warning');
                    continue;
                }
            }
        }
        
        logCallback(`\n🎉 自动采集完成！`, 'success');
        logCallback(`✅ 成功: ${successCount} 个游戏`, 'success');
        logCallback(`❌ 失败: ${failCount} 个游戏`, 'error');
        
        return { successCount, failCount, results };
        
    } catch (error) {
        logCallback(`自动采集出错: ${error.message}`, 'error');
        throw error;
    }
} 