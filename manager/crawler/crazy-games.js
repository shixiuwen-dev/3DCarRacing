import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, collection, addDoc, serverTimestamp, getDocs } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { firebaseConfig } from '../../scripts/firebase-init.js';

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 代理服务器URL
const PROXY_URL = 'http://localhost:3007/proxy?url=';

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
        const thumbnail = doc.querySelector('meta[property="og:image"]')?.content || '';
        console.log('提取基本信息:', { title, description: description.substring(0, 50) + '...' });
        
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
            plays: 0
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
        const gameId = await saveGameToFirebase(gameData);
        console.log('游戏保存成功，ID:', gameId);
        return gameId;
    } catch (error) {
        console.error('采集游戏失败:', error);
        throw error;
    }
} 