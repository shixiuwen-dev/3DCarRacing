import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';

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

// DOM 元素
const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');

// 检查登录状态
onAuthStateChanged(auth, (user) => {
    if (user) {
        // 已登录，跳转到管理页面
        window.location.href = '/admin/index.html';
    }
});

// 显示错误信息
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

// 处理登录
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        // 登录成功后会触发 onAuthStateChanged
    } catch (error) {
        console.error('登录失败:', error);
        switch (error.code) {
            case 'auth/invalid-email':
                showError('邮箱格式不正确');
                break;
            case 'auth/user-not-found':
                showError('用户不存在');
                break;
            case 'auth/wrong-password':
                showError('密码错误');
                break;
            default:
                showError('登录失败，请重试');
        }
    }
}); 