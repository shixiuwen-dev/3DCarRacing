// 游戏点击跟踪
document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', function(e) {
        const gameTitle = this.querySelector('.game-title').textContent;
        gtag('event', 'game_click', {
            'event_category': 'Game',
            'event_label': gameTitle
        });
    });
});

// 搜索跟踪
const searchInput = document.getElementById('game-search');
let searchTimeout;

searchInput.addEventListener('input', function(e) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        gtag('event', 'game_search', {
            'event_category': 'Search',
            'event_label': this.value
        });
    }, 1000); // 延迟1秒再发送事件，避免频繁触发
});

// 分类点击跟踪
document.querySelectorAll('#categories a').forEach(category => {
    category.addEventListener('click', function(e) {
        const categoryName = this.querySelector('span').textContent;
        gtag('event', 'category_click', {
            'event_category': 'Category',
            'event_label': categoryName
        });
    });
});

// 页面停留时间跟踪
let startTime = new Date();
window.addEventListener('beforeunload', function() {
    const endTime = new Date();
    const timeSpent = Math.round((endTime - startTime) / 1000); // 转换为秒
    gtag('event', 'time_spent', {
        'event_category': 'Engagement',
        'value': timeSpent
    });
});

// 滚动深度跟踪
let maxScroll = 0;
window.addEventListener('scroll', function() {
    const scrollPercent = Math.round((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100);
    if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        if (maxScroll % 25 === 0) { // 每达到25%的倍数时触发一次
            gtag('event', 'scroll_depth', {
                'event_category': 'Engagement',
                'event_label': maxScroll + '%'
            });
        }
    }
}); 