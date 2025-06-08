// Firebase configuration and initialization
const firebaseConfig = {
    apiKey: "AIzaSyDQJZXPgYrXpbKBBZHKZhc7XDWlnqR7iAo",
    authDomain: "workmoyu-games.firebaseapp.com",
    projectId: "workmoyu-games",
    storageBucket: "workmoyu-games.appspot.com",
    messagingSenderId: "1082880009453",
    appId: "1:1082880009453:web:c2a5c5f7c2f2d2b3b3b3b3",
    measurementId: "G-WHGEE36CNX"
};

// Sample game data
const sampleGames = [
    {
        title: "3D Racing Challenge",
        description: "Experience high-speed racing action in this thrilling 3D racing game! Master different tracks, upgrade your cars, and compete against skilled opponents.",
        thumbnail: "https://images.crazygames.com/super-racing-gt-drag-pro/20230706115004/super-racing-gt-drag-pro-cover",
        category: "Racing",
        url: "/games/3d-racing-challenge.html",
        plays: 62000,
        createdAt: new Date().toISOString()
    },
    {
        title: "Space Shooter",
        description: "Defend the galaxy in this classic space shooter! Upgrade your ship, collect power-ups, and defeat waves of alien invaders.",
        thumbnail: "https://images.crazygames.com/games/space-shooter/cover-1583232391642",
        category: "Arcade",
        url: "/games/space-shooter.html",
        plays: 35000,
        createdAt: new Date().toISOString()
    },
    {
        title: "Empire Builder",
        description: "Build and manage your empire in this epic strategy game! Develop your civilization, research technologies, and lead your empire to glory.",
        thumbnail: "https://images.crazygames.com/games/age-of-war/cover-1583232391642",
        category: "Strategy",
        url: "/games/empire-builder.html",
        plays: 52000,
        createdAt: new Date().toISOString()
    },
    {
        title: "Zombie Survival",
        description: "Survive the zombie apocalypse in this intense action game! Scavenge for resources, craft weapons, and defend against hordes of undead.",
        thumbnail: "https://images.crazygames.com/games/zombie-survival/cover-1583232391642",
        category: "Action",
        url: "/games/zombie-survival.html",
        plays: 42000,
        createdAt: new Date().toISOString()
    }
];

// Helper function to show errors
function showError(message) {
    console.error(message);
    updateStatus(`
        <h2 class="text-xl font-bold mb-2">Error</h2>
        <p class="mb-2">${message}</p>
        <p>Please check the console for more details.</p>
    `, true);
}

// Update UI status
function updateStatus(message, isError = false) {
    console.log(`Status update: ${message} (${isError ? 'error' : 'success'})`);
    const resultDiv = document.getElementById('result');
    if (resultDiv) {
        resultDiv.className = `status-message ${isError ? 'error' : 'success'}`;
        resultDiv.innerHTML = message;
        resultDiv.classList.remove('hidden');
    } else {
        console.error('Result div not found');
    }
}

// Update step status
function updateStepStatus(step, isDone, error = null) {
    console.log(`Step status update: ${step} - ${isDone ? 'done' : 'error'} ${error || ''}`);
    const stepDiv = document.getElementById(`${step}Status`);
    if (stepDiv) {
        const spinner = stepDiv.querySelector('div');
        const text = stepDiv.querySelector('span');
        
        if (error) {
            spinner.className = 'w-4 h-4 rounded-full bg-red-500 mr-2';
            text.className = 'text-red-500';
            text.textContent = `Error: ${error}`;
        } else if (isDone) {
            spinner.className = 'w-4 h-4 rounded-full bg-green-500 mr-2';
            text.textContent = `${step === 'clear' ? 'Existing data cleared' : 'New games added'} ✓`;
        }
    } else {
        console.error(`${step}Status div not found`);
    }
}

async function initializeFirebase() {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
    const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
    
    console.log('Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log('Firebase initialized successfully');
    return db;
}

// Function to clear existing data
async function clearExistingData(db) {
    const { collection, getDocs, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');

    try {
        console.log('Starting to clear existing data...');
        const gamesSnapshot = await getDocs(collection(db, 'games'));
        console.log(`Found ${gamesSnapshot.size} existing games to delete`);
        
        const deletePromises = [];
        gamesSnapshot.forEach(doc => {
            console.log(`Deleting game: ${doc.id}`);
            deletePromises.push(deleteDoc(doc.ref));
        });
        
        await Promise.all(deletePromises);
        console.log('All existing data cleared successfully');
        updateStepStatus('clear', true);
        return true;
    } catch (error) {
        console.error('Error clearing data:', error);
        updateStepStatus('clear', false, error.message);
        throw error;
    }
}

// Function to initialize data
async function initializeData() {
    try {
        const db = await initializeFirebase();
        const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        
        console.log('Starting data initialization...');
        
        // Clear existing data first
        await clearExistingData(db);
        
        // Add new sample data
        console.log('Adding new games...');
        for (const game of sampleGames) {
            console.log(`Adding game: ${game.title}`);
            const docRef = await addDoc(collection(db, 'games'), game);
            console.log(`Added game: ${game.title} with ID: ${docRef.id}`);
        }
        
        console.log('All games added successfully');
        updateStepStatus('add', true);
        updateStatus(`
            <h2 class="text-xl font-bold mb-2">Initialization Successful!</h2>
            <p class="mb-2">Added ${sampleGames.length} games to the database.</p>
            <p>You can now <a href="/" class="underline">return to the homepage</a> to see the games.</p>
        `);
        
    } catch (error) {
        console.error('Error in data initialization:', error);
        updateStepStatus('add', false, error.message);
        showError(error.message);
    }
}

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded, starting initialization...');
    initializeData().catch(error => {
        console.error('Unhandled error during initialization:', error);
        showError(error.message);
    });
}); 