const fs = require('fs');
const path = require('path');

const games = {
    racing: [
        {
            name: "3D Racing Challenge",
            slug: "3d-racing-challenge",
            embedUrl: "https://www.crazygames.com/embed/super-racing-gt-drag-pro",
            description: "Experience high-speed racing action in this thrilling 3D racing game! Master different tracks, upgrade your cars, and compete against skilled opponents.",
            rating: "4.8",
            plays: "62K+",
            coverImage: "https://images.crazygames.com/super-racing-gt-drag-pro/20230706115004/super-racing-gt-drag-pro-cover",
            howToPlay: [
                "Use Arrow keys or WASD to control your car",
                "Press SPACE for nitro boost",
                "Drift using brake + turn",
                "Collect power-ups on the track",
                "Complete races to earn upgrades"
            ],
            features: [
                "Multiple race tracks",
                "Various car models",
                "Realistic physics",
                "Car customization",
                "Championship mode"
            ]
        },
        {
            name: "Moto X3M",
            slug: "moto-x3m",
            embedUrl: "https://www.crazygames.com/embed/moto-x3m",
            description: "Race through challenging tracks on your motorcycle! Perform stunts, avoid obstacles, and reach the finish line as fast as possible.",
            rating: "4.7",
            plays: "58K+",
            coverImage: "https://images.crazygames.com/games/moto-x3m/cover-1583232391642",
            howToPlay: [
                "Use Arrow keys to control your bike",
                "Press Up to accelerate",
                "Press Down to brake",
                "Perform flips for bonus points",
                "Land safely to avoid crashes"
            ],
            features: [
                "30+ challenging levels",
                "Stunt system",
                "Time-based scoring",
                "Physics-based gameplay",
                "Progressive difficulty"
            ]
        },
        {
            name: "Rally Champion",
            slug: "rally-champion",
            embedUrl: "https://www.crazygames.com/embed/rally-point-4",
            description: "Take on challenging rally tracks in this intense racing game! Master different terrains and weather conditions to become the ultimate rally champion.",
            rating: "4.6",
            plays: "35K+",
            coverImage: "https://images.crazygames.com/games/rally-point-4/cover-1583232391642",
            howToPlay: [
                "Arrow keys to control your car",
                "Space for handbrake",
                "Shift for gear changes",
                "Master different surfaces",
                "Complete time trials"
            ],
            features: [
                "Realistic rally physics",
                "Various weather conditions",
                "Multiple rally cars",
                "Championship mode",
                "Time trial challenges"
            ]
        },
        {
            name: "Kart Race",
            slug: "kart-race",
            embedUrl: "https://www.crazygames.com/embed/kart-race",
            description: "Experience fun and exciting kart racing action! Race against opponents, use power-ups, and drift your way to victory.",
            rating: "4.5",
            plays: "42K+",
            coverImage: "https://images.crazygames.com/games/kart-race/cover-1583232391642",
            howToPlay: [
                "Arrow keys to drive",
                "Space for power-ups",
                "Drift for speed boosts",
                "Collect coins",
                "Avoid obstacles"
            ],
            features: [
                "Fun power-ups",
                "Multiple tracks",
                "Various karts",
                "Multiplayer mode",
                "Achievement system"
            ]
        }
    ],
    action: [
        {
            name: "Ninja Warrior",
            slug: "ninja-warrior",
            embedUrl: "https://www.crazygames.com/embed/ninja-hands",
            description: "Master ninja skills and defeat enemies in this action-packed adventure! Use your agility and combat abilities to overcome challenges.",
            rating: "4.7",
            plays: "45K+",
            coverImage: "https://images.crazygames.com/games/ninja-hands/cover-1583232391642",
            howToPlay: [
                "Use Arrow keys or WASD to move",
                "Press SPACE to jump",
                "Click or press X to attack",
                "Collect power-ups to enhance abilities",
                "Defeat enemies and complete missions"
            ],
            features: [
                "Dynamic combat system",
                "Multiple levels and environments",
                "Various enemy types",
                "Special ninja abilities",
                "Progressive difficulty"
            ]
        },
        {
            name: "Zombie Survival",
            slug: "zombie-survival",
            embedUrl: "https://www.crazygames.com/embed/zombie-survival-3d",
            description: "Survive the zombie apocalypse in this intense action game! Scavenge for resources, craft weapons, and defend against hordes of undead.",
            rating: "4.6",
            plays: "42K+",
            coverImage: "https://images.crazygames.com/games/zombie-survival/cover-1583232391642",
            howToPlay: [
                "WASD to move",
                "Left click to shoot",
                "R to reload",
                "E to interact",
                "Q for special ability"
            ],
            features: [
                "Survival mechanics",
                "Weapon crafting",
                "Day/night cycle",
                "Resource management",
                "Multiple zombie types"
            ]
        }
    ],
    strategy: [
        {
            name: "Empire Builder",
            slug: "empire-builder",
            embedUrl: "https://www.crazygames.com/embed/age-of-war",
            description: "Build and manage your empire in this epic strategy game! Develop your civilization, research technologies, and lead your empire to glory.",
            rating: "4.8",
            plays: "52K+",
            coverImage: "https://images.crazygames.com/games/age-of-war/cover-1583232391642",
            howToPlay: [
                "Click to select buildings and units",
                "Gather resources to build your empire",
                "Research new technologies",
                "Train and command armies",
                "Defend your base and conquer enemies"
            ],
            features: [
                "Multiple ages and civilizations",
                "Deep technology tree",
                "Various unit types",
                "Resource management",
                "Strategic combat system"
            ]
        },
        {
            name: "Tower Defense Master",
            slug: "tower-defense",
            embedUrl: "https://www.crazygames.com/embed/tower-defense-king",
            description: "Defend your kingdom from waves of enemies in this strategic tower defense game! Build and upgrade towers, plan your defense, and survive all waves.",
            rating: "4.7",
            plays: "48K+",
            coverImage: "https://images.crazygames.com/games/tower-defense-king/cover-1583232391642",
            howToPlay: [
                "Click to place towers",
                "Upgrade towers for more power",
                "Plan tower placement strategically",
                "Manage resources efficiently",
                "Use special abilities when needed"
            ],
            features: [
                "Multiple tower types",
                "Upgrade system",
                "Various enemy types",
                "Special abilities",
                "Challenge modes"
            ]
        },
        {
            name: "Chess Master",
            slug: "chess-master",
            embedUrl: "https://www.crazygames.com/embed/chess-master",
            description: "Challenge your mind in this classic game of chess! Play against AI opponents of varying difficulty levels and improve your strategic thinking.",
            rating: "4.6",
            plays: "38K+",
            coverImage: "https://images.crazygames.com/games/chess-master/cover-1583232391642",
            howToPlay: [
                "Click to select pieces",
                "Click destination to move",
                "Plan your moves carefully",
                "Protect your king",
                "Capture enemy pieces"
            ],
            features: [
                "Multiple difficulty levels",
                "Move suggestions",
                "Game analysis",
                "Opening library",
                "Save/load games"
            ]
        },
        {
            name: "City Builder",
            slug: "city-builder",
            embedUrl: "https://www.crazygames.com/embed/city-builder",
            description: "Build and manage your own city! Plan infrastructure, manage resources, and keep your citizens happy in this engaging city simulation game.",
            rating: "4.5",
            plays: "32K+",
            coverImage: "https://images.crazygames.com/games/city-builder/cover-1583232391642",
            howToPlay: [
                "Click to place buildings",
                "Manage city resources",
                "Plan road networks",
                "Balance city budget",
                "Respond to city events"
            ],
            features: [
                "Various building types",
                "Economic system",
                "Population management",
                "Natural disasters",
                "City policies"
            ]
        }
    ],
    arcade: [
        {
            name: "Pixel Jumper",
            slug: "pixel-jumper",
            embedUrl: "https://www.crazygames.com/embed/pixel-jumper",
            description: "Jump your way through challenging pixel art levels! Time your jumps perfectly and collect coins while avoiding obstacles.",
            rating: "4.5",
            plays: "28K+",
            coverImage: "https://images.crazygames.com/games/pixel-jumper/cover-1583232391642",
            howToPlay: [
                "Space to jump",
                "Double tap for double jump",
                "Collect coins",
                "Avoid spikes",
                "Find secret paths"
            ],
            features: [
                "Retro pixel graphics",
                "Multiple worlds",
                "Power-ups",
                "Secret levels",
                "Achievement system"
            ]
        },
        {
            name: "Space Shooter",
            slug: "space-shooter",
            embedUrl: "https://www.crazygames.com/embed/space-shooter",
            description: "Defend the galaxy in this classic space shooter! Upgrade your ship, collect power-ups, and defeat waves of alien invaders.",
            rating: "4.6",
            plays: "35K+",
            coverImage: "https://images.crazygames.com/games/space-shooter/cover-1583232391642",
            howToPlay: [
                "Arrow keys to move",
                "Space to shoot",
                "Z for special weapon",
                "Collect power-ups",
                "Dodge enemy fire"
            ],
            features: [
                "Multiple ship types",
                "Weapon upgrades",
                "Boss battles",
                "Score multipliers",
                "Endless mode"
            ]
        },
        {
            name: "Fruit Ninja",
            slug: "fruit-ninja",
            embedUrl: "https://www.crazygames.com/embed/fruit-ninja",
            description: "Slice and dice fruits in this addictive arcade game! Show off your ninja skills and create impressive combos while avoiding bombs.",
            rating: "4.7",
            plays: "40K+",
            coverImage: "https://images.crazygames.com/games/fruit-ninja/cover-1583232391642",
            howToPlay: [
                "Swipe to slice fruits",
                "Create combos",
                "Avoid bombs",
                "Use special blades",
                "Complete challenges"
            ],
            features: [
                "Various game modes",
                "Special blades",
                "Combo system",
                "Daily challenges",
                "Global leaderboards"
            ]
        },
        {
            name: "Bubble Pop",
            slug: "bubble-pop",
            embedUrl: "https://www.crazygames.com/embed/bubble-pop",
            description: "Pop colorful bubbles in this classic puzzle game! Match three or more bubbles of the same color to clear them and score points.",
            rating: "4.4",
            plays: "25K+",
            coverImage: "https://images.crazygames.com/games/bubble-pop/cover-1583232391642",
            howToPlay: [
                "Aim with mouse",
                "Click to shoot",
                "Match 3+ bubbles",
                "Create chain reactions",
                "Clear all bubbles"
            ],
            features: [
                "Multiple levels",
                "Power-ups",
                "Time challenges",
                "Special bubbles",
                "Star rewards"
            ]
        }
    ],
    puzzle: [
        {
            name: "Memory Match",
            slug: "memory-match",
            embedUrl: "https://www.crazygames.com/embed/memory-match",
            description: "Test your memory in this classic matching game! Find pairs of matching cards and complete levels within the time limit.",
            rating: "4.3",
            plays: "22K+",
            coverImage: "https://images.crazygames.com/games/memory-match/cover-1583232391642",
            howToPlay: [
                "Click cards to flip",
                "Find matching pairs",
                "Remember card positions",
                "Complete within time limit",
                "Score bonus points"
            ],
            features: [
                "Multiple themes",
                "Increasing difficulty",
                "Time challenges",
                "Score multipliers",
                "Achievement system"
            ]
        },
        {
            name: "Color Match",
            slug: "color-match",
            embedUrl: "https://www.crazygames.com/embed/color-match",
            description: "Match colors and create combinations in this addictive puzzle game! Clear the board and achieve high scores.",
            rating: "4.4",
            plays: "24K+",
            coverImage: "https://images.crazygames.com/games/color-match/cover-1583232391642",
            howToPlay: [
                "Click groups of colors",
                "Create combinations",
                "Clear the board",
                "Use power-ups",
                "Beat target scores"
            ],
            features: [
                "Multiple game modes",
                "Special tiles",
                "Power-up system",
                "Daily challenges",
                "Leaderboards"
            ]
        },
        {
            name: "Block Puzzle",
            slug: "block-puzzle",
            embedUrl: "https://www.crazygames.com/embed/block-puzzle",
            description: "Arrange blocks to complete lines in this challenging puzzle game! Plan your moves carefully and keep the board clear.",
            rating: "4.5",
            plays: "30K+",
            coverImage: "https://images.crazygames.com/games/block-puzzle/cover-1583232391642",
            howToPlay: [
                "Drag blocks to place",
                "Complete lines to clear",
                "Plan moves ahead",
                "Avoid filling board",
                "Use special blocks"
            ],
            features: [
                "Classic gameplay",
                "Special blocks",
                "Score multipliers",
                "Challenge mode",
                "Daily puzzles"
            ]
        },
        {
            name: "Word Master",
            slug: "word-master",
            embedUrl: "https://www.crazygames.com/embed/word-master",
            description: "Test your vocabulary in this word puzzle game! Form words from letter tiles and unlock new challenges.",
            rating: "4.4",
            plays: "26K+",
            coverImage: "https://images.crazygames.com/games/word-master/cover-1583232391642",
            howToPlay: [
                "Form words from tiles",
                "Use bonus tiles",
                "Complete word goals",
                "Find bonus words",
                "Beat time limits"
            ],
            features: [
                "Dictionary support",
                "Multiple modes",
                "Daily challenges",
                "Word categories",
                "Score boosters"
            ]
        }
    ]
};

function generateGamePage(game, category) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${game.name} | WorkMoyu Games</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        "gaming-primary": "#007AFF",
                        "gaming-secondary": "#ff3b30",
                        "gaming-dark": "#1a1a1a"
                    }
                }
            }
        }
    </script>
    <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
</head>
<body class="bg-gaming-dark min-h-screen text-white">
    <header class="bg-black/50 backdrop-blur-md sticky top-0 z-50 border-b border-white/10">
        <div class="container mx-auto px-4 py-4">
            <nav class="flex items-center justify-between">
                <a href="/" class="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gaming-primary to-gaming-secondary bg-clip-text text-transparent">WorkMoyu Games</a>
                <div class="hidden md:flex space-x-6">
                    <a href="/" class="hover:text-gaming-primary transition">Home</a>
                    <a href="/#new-games" class="hover:text-gaming-primary transition">New Games</a>
                    <a href="/#popular" class="hover:text-gaming-primary transition">Popular</a>
                    <a href="/#categories" class="hover:text-gaming-primary transition">Categories</a>
                </div>
            </nav>
        </div>
    </header>

    <main class="container mx-auto px-4 py-8">
        <div class="max-w-6xl mx-auto">
            <div class="bg-black/30 rounded-2xl overflow-hidden">
                <div class="aspect-[16/9] relative">
                    <iframe
                        src="${game.embedUrl}"
                        class="absolute inset-0 w-full h-full"
                        frameborder="0"
                        allow="gamepad *;"
                        allowfullscreen
                    ></iframe>
                </div>
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h1 class="text-2xl md:text-3xl font-bold">${game.name}</h1>
                        <div class="flex items-center space-x-4">
                            <div class="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                </svg>
                                <span class="ml-1 font-semibold">${game.rating}</span>
                            </div>
                            <span class="text-gray-400">${game.plays} plays</span>
                        </div>
                    </div>
                    <p class="text-gray-300">${game.description}</p>
                    
                    <div class="mt-6">
                        <h2 class="text-xl font-bold mb-3">How to Play</h2>
                        <ul class="list-disc list-inside text-gray-300 space-y-2">
                            ${game.howToPlay.map(item => `<li>${item}</li>`).join('\n                            ')}
                        </ul>
                    </div>

                    <div class="mt-6">
                        <h2 class="text-xl font-bold mb-3">Features</h2>
                        <ul class="list-disc list-inside text-gray-300 space-y-2">
                            ${game.features.map(item => `<li>${item}</li>`).join('\n                            ')}
                        </ul>
                    </div>
                </div>
            </div>

            <div class="mt-8">
                <h2 class="text-2xl font-bold mb-4">Similar Games</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    ${Object.entries(games)
                        .filter(([cat]) => cat === category)
                        .flatMap(([_, categoryGames]) => 
                            categoryGames
                                .filter(g => g.slug !== game.slug)
                                .map(g => `
                    <a href="/games/${g.slug}.html" class="bg-black/30 rounded-xl overflow-hidden group">
                        <div class="aspect-video relative overflow-hidden">
                            <img src="${g.coverImage}" 
                                 alt="${g.name}" 
                                 class="w-full h-full object-cover transform group-hover:scale-110 transition duration-300">
                        </div>
                        <div class="p-4">
                            <h3 class="text-lg font-bold">${g.name}</h3>
                            <p class="text-sm text-gray-300 mt-1">${g.description.split('!')[0]}!</p>
                        </div>
                    </a>`
                                )
                        ).join('\n')}
                </div>
            </div>
        </div>
    </main>

    <footer class="bg-black/50 backdrop-blur-md border-t border-white/10 py-8 mt-12">
        <div class="container mx-auto px-4 text-center">
            <p class="text-gray-400">&copy; 2024 WorkMoyu Games. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>`;
}

// Create games directory if it doesn't exist
if (!fs.existsSync('games')) {
    fs.mkdirSync('games');
}

// Generate game pages
Object.entries(games).forEach(([category, categoryGames]) => {
    categoryGames.forEach(game => {
        const filePath = path.join('games', `${game.slug}.html`);
        fs.writeFileSync(filePath, generateGamePage(game, category));
        console.log(`Generated ${filePath}`);
    });
});

console.log('All game pages have been generated successfully!'); 