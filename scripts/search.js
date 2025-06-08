import { getFirestore, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { db } from './firebase-init.js';

export function initSearch() {
    const searchInput = document.getElementById('search-input');
    let debounceTimer;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const searchTerm = e.target.value.trim().toLowerCase();
            if (searchTerm.length >= 2) {
                performSearch(searchTerm);
            }
        }, 300);
    });
}

async function performSearch(searchTerm) {
    try {
        const gamesQuery = query(
            collection(db, 'games'),
            where('searchTerms', 'array-contains', searchTerm)
        );
        
        const snapshot = await getDocs(gamesQuery);
        const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        displaySearchResults(results);
    } catch (error) {
        console.error('Search error:', error);
    }
}

function displaySearchResults(results) {
    const mainContent = document.getElementById('main-content');
    
    if (results.length === 0) {
        mainContent.innerHTML = `
            <div class="text-center py-12">
                <h2 class="text-2xl font-bold mb-4">No games found</h2>
                <p class="text-gray-400">Try different search terms</p>
            </div>
        `;
        return;
    }
    
    mainContent.innerHTML = `
        <section class="mb-12">
            <h2 class="text-2xl font-bold mb-6">Search Results</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                ${results.map(game => createGameCard(game)).join('')}
            </div>
        </section>
    `;
}

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

function formatPlays(plays) {
    if (!plays) return '0';
    if (plays >= 1000) {
        return Math.floor(plays / 1000) + 'K+';
    }
    return plays.toString();
} 