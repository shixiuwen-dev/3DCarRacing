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
        const category = categoryElement ? categoryElement.textContent.trim() : '';
        console.log('游戏分类:', category);
        
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
            plays
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
export async function crawlAndSaveGame(url) {
    try {
        console.log('开始采集游戏:', url);
        const gameData = await fetchGameData(url);
        console.log('游戏数据采集完成');
        
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

// 从CrazyGames首页获取游戏链接
async function getGameLinksFromHomepage() {
    try {
        console.log('从CrazyGames首页获取游戏链接...');
        const homeUrl = 'https://www.crazygames.com/';
        const response = await fetch(`${PROXY_URL}${encodeURIComponent(homeUrl)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        console.log('成功获取首页内容，长度:', html.length);
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // 查找游戏链接 - 更精确的选择器
        const gameLinks = [];
        const linkSelectors = [
            'a[href*="/game/"]',
            '[href*="/game/"]'
        ];
        
        for (const selector of linkSelectors) {
            const links = doc.querySelectorAll(selector);
            console.log(`使用选择器 "${selector}" 找到 ${links.length} 个链接`);
            
            for (const link of links) {
                const href = link.getAttribute('href');
                if (href && href.includes('/game/')) {
                    let fullUrl = href;
                    if (href.startsWith('/')) {
                        fullUrl = 'https://www.crazygames.com' + href;
                    }
                    
                    // 确保链接格式正确 - 必须是游戏详情页
                    if (fullUrl.match(/https:\/\/www\.crazygames\.com\/game\/[^\/]+$/)) {
                        if (!gameLinks.includes(fullUrl)) {
                            gameLinks.push(fullUrl);
                            console.log(`添加游戏链接: ${fullUrl}`);
                        }
                    }
                }
            }
        }
        
        console.log(`总共找到 ${gameLinks.length} 个有效游戏链接`);
        
        // 如果从首页没找到足够的链接，尝试从游戏分类页面获取
        if (gameLinks.length < 10) {
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
        
        console.log(`最终找到 ${gameLinks.length} 个游戏链接`);
        
        // 打印前几个链接作为示例
        gameLinks.slice(0, 5).forEach((link, index) => {
            console.log(`示例链接 ${index + 1}: ${link}`);
        });
        
        return gameLinks.slice(0, 40); // 返回前40个，确保有足够的候选
    } catch (error) {
        console.error('获取首页游戏链接失败:', error);
        throw error;
    }
}

// 自动采集多个游戏
export async function autoCrawlGames(targetCount = 20, logCallback) {
    try {
        logCallback('开始自动采集游戏...', 'info');
        const gameLinks = await getGameLinksFromHomepage();
        logCallback(`找到 ${gameLinks.length} 个候选游戏`, 'info');
        
        let successCount = 0;
        let failCount = 0;
        const results = [];
        
        for (let i = 0; i < gameLinks.length && successCount < targetCount; i++) {
            const url = gameLinks[i];
            const gameName = url.split('/game/')[1] || `game-${i+1}`;
            
            try {
                logCallback(`[${i+1}/${gameLinks.length}] 正在采集: ${gameName}`, 'info');
                
                const gameId = await crawlAndSaveGame(url);
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