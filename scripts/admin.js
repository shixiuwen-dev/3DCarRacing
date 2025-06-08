import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { gamesAPI } from './firebase-config.js';

const firebaseConfig = {
    apiKey: "AIzaSyAPsGrrNzqw7l0ld5SiVVSvuI2WD7qCcko",
    authDomain: "workmoyu-games.firebaseapp.com",
    projectId: "workmoyu-games",
    storageBucket: "workmoyu-games.firebasestorage.app",
    messagingSenderId: "576763889820",
    appId: "1:576763889820:web:d0ff6040323a0548198559",
    measurementId: "G-CZ1CZ9C32Q"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 检查登录状态
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // 未登录，跳转到登录页面
        window.location.href = '/admin/login.html';
    }
});

// DOM 元素
const gamesList = document.getElementById('gamesList');
const gameModal = document.getElementById('gameModal');
const gameForm = document.getElementById('gameForm');
const addGameBtn = document.getElementById('addGameBtn');
const cancelBtn = document.getElementById('cancelBtn');
const modalTitle = document.getElementById('modalTitle');

// 添加登出按钮到页面
const header = document.querySelector('header .container');
const logoutBtn = document.createElement('button');
logoutBtn.textContent = '退出登录';
logoutBtn.className = 'bg-gaming-secondary px-4 py-2 rounded-lg hover:bg-gaming-secondary/80 transition';
logoutBtn.onclick = () => {
    signOut(auth).then(() => {
        window.location.href = '/admin/login.html';
    });
};
header.appendChild(logoutBtn);

// 当前编辑的游戏ID
let currentGameId = null;

// 加载游戏列表
async function loadGames() {
    try {
        const games = await gamesAPI.getAllGames();
        gamesList.innerHTML = games.map(game => createGameCard(game)).join('');
    } catch (error) {
        console.error('加载游戏列表失败:', error);
        alert('加载游戏列表失败，请刷新页面重试');
    }
}

// 创建游戏卡片HTML
function createGameCard(game) {
    return `
        <div class="bg-black/30 rounded-xl overflow-hidden">
            <img src="${game.imageUrl}" alt="${game.title}" class="w-full aspect-video object-cover">
            <div class="p-4">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-lg font-bold">${game.title}</h3>
                    <span class="px-2 py-1 bg-gaming-primary/20 rounded text-sm">${game.category}</span>
                </div>
                <p class="text-gray-400 text-sm mb-4">${game.description}</p>
                <div class="flex items-center justify-between">
                    <div class="text-sm text-gray-400">
                        <span>👁 ${game.views}</span>
                        <span class="ml-2">❤️ ${game.likes}</span>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="editGame('${game.id}')" class="px-3 py-1 bg-gaming-primary/20 rounded hover:bg-gaming-primary/40 transition">编辑</button>
                        <button onclick="deleteGame('${game.id}')" class="px-3 py-1 bg-gaming-secondary/20 rounded hover:bg-gaming-secondary/40 transition">删除</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 显示模态框
function showModal(title = '添加游戏') {
    modalTitle.textContent = title;
    gameModal.classList.remove('hidden');
}

// 隐藏模态框
function hideModal() {
    modalTitle.textContent = '添加游戏';
    gameForm.reset();
    currentGameId = null;
    gameModal.classList.add('hidden');
}

// 编辑游戏
async function editGame(gameId) {
    try {
        const games = await gamesAPI.getAllGames();
        const game = games.find(g => g.id === gameId);
        if (!game) throw new Error('游戏不存在');

        currentGameId = gameId;
        gameForm.title.value = game.title;
        gameForm.description.value = game.description;
        gameForm.category.value = game.category;
        gameForm.url.value = game.url;
        gameForm.featured.checked = game.featured;

        showModal('编辑游戏');
    } catch (error) {
        console.error('加载游戏信息失败:', error);
        alert('加载游戏信息失败，请重试');
    }
}

// 删除游戏
async function deleteGame(gameId) {
    if (!confirm('确定要删除这个游戏吗？')) return;

    try {
        await gamesAPI.deleteGame(gameId);
        await loadGames();
    } catch (error) {
        console.error('删除游戏失败:', error);
        alert('删除游戏失败，请重试');
    }
}

// 事件监听
addGameBtn.addEventListener('click', () => showModal());
cancelBtn.addEventListener('click', hideModal);

gameForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        title: gameForm.title.value,
        description: gameForm.description.value,
        category: gameForm.category.value,
        url: gameForm.url.value,
        featured: gameForm.featured.checked
    };

    try {
        const imageFile = gameForm.image.files[0];
        if (imageFile) {
            // 直接将图片文件传给 API，由 API 处理转换
            formData.imageFile = imageFile;
        }

        if (currentGameId) {
            await gamesAPI.updateGame(currentGameId, formData);
        } else {
            await gamesAPI.addGame(formData);
        }

        hideModal();
        await loadGames();
    } catch (error) {
        console.error('保存游戏失败:', error);
        alert('保存游戏失败，请重试');
    }
});

// 将函数添加到全局作用域
window.editGame = editGame;
window.deleteGame = deleteGame;

// 初始加载
loadGames(); 