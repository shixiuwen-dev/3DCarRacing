const http = require('http');
const https = require('https');
const url = require('url');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, orderBy, limit } = require('firebase/firestore');

const PORT = 3007;

// Firebase 配置
const firebaseConfig = {
    apiKey: "AIzaSyDQJZXPgYrXpbKBBZHKZhc7XDWlnqR7iAo",
    authDomain: "workmoyu-games.firebaseapp.com",
    projectId: "workmoyu-games",
    storageBucket: "workmoyu-games.appspot.com",
    messagingSenderId: "1082880009453",
    appId: "1:1082880009453:web:c2a5c5f7c2f2d2b3b3b3b3",
    measurementId: "G-WHGEE36CNX"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const server = http.createServer(async (req, res) => {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理预检请求
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;

    // 处理游戏数据请求
    if (req.method === 'GET' && path === '/games') {
        try {
            console.log('Getting games data...');
            const gamesRef = collection(db, 'games');
            const gamesQuery = query(gamesRef, orderBy('plays', 'desc'), limit(10));
            const snapshot = await getDocs(gamesQuery);
            
            const games = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            console.log(`Found ${games.length} games`);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(games));
        } catch (error) {
            console.error('Error getting games:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Failed to get games data' }));
        }
        return;
    }

    // 处理代理请求
    if (req.method === 'GET' && path.startsWith('/proxy')) {
        const targetUrl = decodeURIComponent(parsedUrl.query.url);
        
        // 确保只代理CrazyGames的请求
        if (!targetUrl.startsWith('https://www.crazygames.com/')) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }

        // 发送请求到目标URL
        https.get(targetUrl, (proxyRes) => {
            // 转发响应头
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            
            // 转发响应体
            proxyRes.pipe(res);
        }).on('error', (err) => {
            console.error('Error fetching from target:', err);
            res.writeHead(500);
            res.end('Error fetching from target');
        });
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`Proxy server running at http://localhost:${PORT}`);
}); 