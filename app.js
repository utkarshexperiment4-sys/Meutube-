// =========================================================
// Metube App - Complete JavaScript Code (Error Free)
// =========================================================

// 🔥 GLOBAL VARIABLES (Firebase from index.html)
const auth = window.auth || null; // Firebase Auth object

// 📱 APP STATE
const AppState = {
    currentPage: 'home',
    currentVideo: null,
    videos: [],
    filteredVideos: [],
    categories: ['music', 'gaming', 'education', 'sports', 'entertainment'],
    searchQuery: '',
    isSidebarOpen: false,
    isOffline: !navigator.onLine,
    currentUser: null,
    fileToUpload: null
};

// 🎯 DOM ELEMENTS
const elements = {
    homePage: document.getElementById('homePage'),
    trendingPage: document.getElementById('trendingPage'),
    uploadPage: document.getElementById('uploadPage'),
    videoPlayerPage: document.getElementById('videoPlayerPage'),
    searchPage: document.getElementById('searchPage'),
    
    videosGrid: document.getElementById('videosGrid'),
    trendingGrid: document.getElementById('trendingGrid'),
    searchResultsGrid: document.getElementById('searchResultsGrid'),
    
    menuBtn: document.getElementById('menuBtn'),
    searchBtn: document.getElementById('searchBtn'),
    uploadBtn: document.getElementById('uploadBtn'),
    loadMoreBtn: document.getElementById('loadMoreBtn'),
    guestLoginBtn: document.getElementById('guestLoginBtn'), 
    loggedUser: document.getElementById('loggedUser'),
    
    searchInput: document.getElementById('searchInput'),
    sidebar: document.getElementById('sidebar'),
    offlineIndicator: document.getElementById('offlineIndicator'),
    searchQueryText: document.getElementById('searchQueryText'),
    resultCount: document.getElementById('resultCount')
};

// 🛠️ UTILITY FUNCTIONS
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ff4444' : type === 'success' ? '#44ff44' : '#333'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// 🔐 FIREBASE AUTHENTICATION FUNCTIONS
function showLoginOptions() {
    const loginOptions = `
        <div id="authModalContent" style="padding: 25px; text-align: center;">
            <h3 style="color: #ff0000; margin-bottom: 20px;">Metube में लॉगिन करें</h3>
            
            <input type="email" id="authEmail" placeholder="आपका ईमेल" 
                style="padding: 12px; margin: 10px 0; width: 90%; border-radius: 8px; 
                border: 1px solid #555; background: #121212; color: white; font-size: 16px;">
            
            <input type="password" id="authPassword" placeholder="पासवर्ड (न्यूनतम 6 वर्ण)" 
                style="padding: 12px; margin: 10px 0; width: 90%; border-radius: 8px; 
                border: 1px solid #555; background: #121212; color: white; font-size: 16px;">

            <button onclick="handleAuth(true)" 
                style="padding: 14px; background: #ff0000; color: white; border: none; 
                border-radius: 8px; margin-top: 15px; width: 90%; font-size: 16px; font-weight: bold; cursor: pointer;">
                लॉगिन करें
            </button>
            
            <button onclick="handleAuth(false)" 
                style="padding: 14px; background: #333; color: white; border: none; 
                border-radius: 8px; margin-top: 10px; width: 90%; font-size: 16px; cursor: pointer;">
                नया अकाउंट बनाएँ
            </button>
            
            <p id="authMessage" style="margin-top: 15px; font-size: 14px; min-height: 20px; color: #ffcc00;"></p>
            
            <button onclick="closeAuthModal()" 
                style="margin-top: 15px; padding: 10px; background: transparent; 
                color: #888; border: 1px solid #555; border-radius: 8px; cursor: pointer; width: 90%;">
                बाद में
            </button>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.id = 'authModal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.85); display: flex; justify-content: center; 
        align-items: center; z-index: 1000; backdrop-filter: blur(5px);
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: #212121; border-radius: 15px; padding: 0; 
        max-width: 400px; width: 90%; color: white;
        border: 2px solid #ff0000; box-shadow: 0 10px 30px rgba(255,0,0,0.2);
    `;
    
    modalContent.innerHTML = loginOptions;
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

window.closeAuthModal = function() {
    const modal = document.getElementById('authModal');
    if (modal) {
        document.body.removeChild(modal);
    }
};

window.handleAuth = async function(isLogin) {
    if (!auth) {
        const message = document.getElementById('authMessage');
        message.textContent = 'Firebase Auth उपलब्ध नहीं है। पेज रिफ्रेश करें।';
        message.style.color = '#ff4444';
        return;
    }
    
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value.trim();
    const message = document.getElementById('authMessage');

    if (!email || !password || password.length < 6) {
        message.textContent = 'ईमेल और पासवर्ड (न्यूनतम 6 वर्ण) आवश्यक हैं।';
        message.style.color = '#ff4444';
        return;
    }
    
    message.textContent = isLogin ? 'लॉगिन किया जा रहा है...' : 'अकाउंट बनाया जा रहा है...';
    message.style.color = '#44ff44';

    try {
        if (isLogin) {
            await auth.signInWithEmailAndPassword(email, password);
            message.textContent = 'लॉगिन सफल! रीडायरेक्ट हो रहा है...';
        } else {
            await auth.createUserWithEmailAndPassword(email, password);
            message.textContent = 'साइनअप सफल! रीडायरेक्ट हो रहा है...';
        }
        
        setTimeout(() => {
            closeAuthModal();
        }, 1500);
        
    } catch (error) {
        let errorMessage = 'एक अज्ञात त्रुटि हुई।';
        if (error.code === 'auth/user-not-found') errorMessage = 'यूज़र मौजूद नहीं है।';
        else if (error.code === 'auth/wrong-password') errorMessage = 'पासवर्ड गलत है।';
        else if (error.code === 'auth/email-already-in-use') errorMessage = 'यह ईमेल पहले से उपयोग में है।';
        else if (error.code === 'auth/invalid-email') errorMessage = 'कृपया वैध ईमेल पता डालें।';
        else if (error.code === 'auth/network-request-failed') errorMessage = 'नेटवर्क त्रुटि। इंटरनेट कनेक्शन चेक करें।';
        
        message.textContent = `त्रुटि: ${errorMessage}`;
        message.style.color = '#ff4444';
        console.error('Firebase Auth Error:', error);
    }
};

function updateUserUI(user) {
    AppState.currentUser = user;
    
    if (user) {
        elements.guestLoginBtn.style.display = 'none';
        elements.loggedUser.style.display = 'flex';
        elements.loggedUser.title = user.email || 'यूज़र';
        console.log('User logged in:', user.email);
    } else {
        elements.guestLoginBtn.style.display = 'flex';
        elements.loggedUser.style.display = 'none';
        console.log('User logged out');
    }
}

window.logoutUser = async function() {
    if (AppState.currentUser && auth) {
        try {
            await auth.signOut();
            showToast('आप सफलतापूर्वक लॉगआउट हो गए हैं!', 'success');
        } catch (error) {
            console.error('Logout Error:', error);
            showToast('लॉगआउट में त्रुटि हुई।', 'error');
        }
    } else {
        showToast('लॉगआउट करने के लिए पहले लॉगिन करें।', 'error');
    }
};

// 📹 DEMO VIDEOS DATA
const demoVideos = [
    { 
        id: 1, 
        title: 'चाइनीज़ पॉप संगीत 2024 | 中国流行音乐', 
        description: '2024 के सबसे लोकप्रिय चाइनीज़ पॉप गाने।', 
        duration: '15:42', 
        views: 2450000, 
        likes: 125000, 
        dislikes: 5000, 
        channel: 'China Music Hub', 
        channelSubs: 2500000, 
        category: 'music', 
        uploadDate: '2 दिन पहले', 
        thumbnail: 'https://picsum.photos/seed/music1/320/180', 
        videoUrl: 'assets/demo-video1.mp4', 
        isOffline: false 
    },
    { 
        id: 2, 
        title: 'Genshin Impact Gameplay | 原神高级游戏', 
        description: 'Genshin Impact के नए अपडेट की पूरी गेमप्ले। बेस्ट स्ट्रैटेजी और टिप्स।', 
        duration: '22:10', 
        views: 1850000, 
        likes: 98000, 
        dislikes: 3000, 
        channel: 'Gaming China', 
        channelSubs: 1500000, 
        category: 'gaming', 
        uploadDate: '1 सप्ताह पहले', 
        thumbnail: 'https://picsum.photos/seed/gaming1/320/180', 
        videoUrl: 'assets/demo-video2.mp4', 
        isOffline: true 
    },
    { 
        id: 3, 
        title: 'चाइनीज़ भाषा सीखें | 学中文', 
        description: 'आसान तरीके से चाइनीज़ भाषा सीखें। बेसिक से एडवांस्ड तक।', 
        duration: '18:35', 
        views: 3200000, 
        likes: 210000, 
        dislikes: 8000, 
        channel: 'Learn Chinese', 
        channelSubs: 3500000, 
        category: 'education', 
        uploadDate: '3 दिन पहले', 
        thumbnail: 'https://picsum.photos/seed/edu1/320/180', 
        videoUrl: 'assets/demo-video3.mp4', 
        isOffline: false 
    },
    { 
        id: 4, 
        title: 'बीजिंग ओलंपिक हाइलाइट्स | 北京奥运会', 
        description: 'बीजिंग ओलंपिक 2022 के सबसे यादगार पल। गोल्ड मेडल मोमेंट्स।', 
        duration: '12:45', 
        views: 4200000, 
        likes: 305000, 
        dislikes: 12000, 
        channel: 'Sports China', 
        channelSubs: 2800000, 
        category: 'sports', 
        uploadDate: '1 महीने पहले', 
        thumbnail: 'https://picsum.photos/seed/sports1/320/180', 
        videoUrl: 'assets/demo-video4.mp4', 
        isOffline: true 
    },
    { 
        id: 5, 
        title: 'चाइनीज़ कॉमेडी शो | 中国喜剧', 
        description: 'सबसे मजेदार चाइनीज़ कॉमेडी शो। हंसते-हंसते लोटपोट।', 
        duration: '25:30', 
        views: 1850000, 
        likes: 95000, 
        dislikes: 4000, 
        channel: 'China Comedy', 
        channelSubs: 1200000, 
        category: 'entertainment', 
        uploadDate: '4 दिन पहले', 
        thumbnail: 'https://picsum.photos/seed/ent1/320/180', 
        videoUrl: 'assets/demo-video5.mp4', 
        isOffline: false 
    }
];

// 🚀 APP INITIALIZATION
function initApp() {
    console.log('Metube ऐप शुरू हो रहा है...');
    
    setupEventListeners();
    checkNetworkStatus();
    
    if (auth) {
        auth.onAuthStateChanged((user) => {
            updateUserUI(user);
        });
    } else {
        console.warn('Firebase Auth not available. Running in demo mode.');
    }
    
    loadVideosFromDatabase();
    
    setTimeout(() => {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        console.log('Metube ऐप तैयार है!');
    }, 1500);
}

function loadVideosFromDatabase() {
    AppState.videos = demoVideos;
    AppState.filteredVideos = [...demoVideos];
    renderVideos();
    renderTrendingVideos();
}

// 🎮 EVENT LISTENERS SETUP
function setupEventListeners() {
    elements.menuBtn.addEventListener('click', toggleSidebar);
    elements.searchBtn.addEventListener('click', performSearch);
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
    
    elements.uploadBtn.addEventListener('click', () => {
        if (!AppState.currentUser) {
            showToast('वीडियो अपलोड करने के लिए कृपया पहले लॉगिन करें।', 'error');
            showLoginOptions();
            return;
        }
        showPage('upload');
    });

    elements.loadMoreBtn.addEventListener('click', loadMoreVideos);
    elements.guestLoginBtn.addEventListener('click', showLoginOptions);
    
    elements.loggedUser.addEventListener('click', logoutUser);
    
    setupUploadForm();
    document.querySelector('.back-btn').addEventListener('click', goBack);
    window.addEventListener('resize', handleResize);
    
    document.addEventListener('click', (e) => {
        if (AppState.isSidebarOpen && 
            !elements.sidebar.contains(e.target) && 
            !elements.menuBtn.contains(e.target)) {
            closeSidebar();
        }
    });
}

// 🎨 VIDEO RENDERING FUNCTIONS
function renderVideos() {
    const grid = elements.videosGrid;
    grid.innerHTML = '';
    
    if (AppState.filteredVideos.length === 0) {
        grid.innerHTML = `
            <div class="no-videos">
                <i class="fas fa-video-slash"></i>
                <h3>कोई वीडियो नहीं मिला</h3>
                <p>कृपया बाद में दोबारा कोशिश करें</p>
            </div>
        `;
        return;
    }
    
    AppState.filteredVideos.forEach(video => {
        const videoCard = createVideoCard(video);
        grid.appendChild(videoCard);
    });
    
    elements.loadMoreBtn.style.display = AppState.filteredVideos.length >= 5 ? 'block' : 'none';
}

function createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.dataset.id = video.id;
    card.dataset.category = video.category;
    
    card.innerHTML = `
        <div class="thumbnail-container">
            <img src="${video.thumbnail}" alt="${video.title}" class="video-thumbnail" onerror="this.src='assets/default-thumbnail.jpg'">
            <span class="video-duration">${video.duration}</span>
            ${video.isOffline ? '<span class="offline-badge">⬇️ ऑफलाइन</span>' : ''}
        </div>
        <div class="video-info">
            <h3 class="video-title">${video.title}</h3>
            <p class="channel-name">${video.channel}</p>
            <div class="video-stats">
                <span>${formatNumber(video.views)} व्यूज़</span>
                <span>•</span>
                <span>${video.uploadDate}</span>
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => playVideo(video));
    return card;
}

function renderTrendingVideos() {
    const grid = elements.trendingGrid;
    grid.innerHTML = '';
    
    const trendingVideos = [...AppState.videos]
        .sort((a, b) => b.views - a.views)
        .slice(0, 6);
    
    trendingVideos.forEach(video => {
        const videoCard = createVideoCard(video);
        grid.appendChild(videoCard);
    });
}

// ▶️ VIDEO PLAYER FUNCTIONS
function playVideo(video) {
    AppState.currentVideo = video;
    showPage('videoPlayer');
    updateVideoPlayer(video);
    video.views++;
    saveToHistory(video);
}

function updateVideoPlayer(video) {
    document.getElementById('playerVideoTitle').textContent = video.title;
    document.getElementById('viewsCount').innerHTML = `<i class="fas fa-eye"></i> ${formatNumber(video.views)} व्यूज़`;
    document.getElementById('uploadDate').innerHTML = `<i class="far fa-calendar"></i> ${video.uploadDate}`;
    document.getElementById('likeCount').textContent = formatNumber(video.likes);
    document.getElementById('dislikeCount').textContent = formatNumber(video.dislikes);
    document.getElementById('channelName').textContent = video.channel;
    document.getElementById('channelSubs').textContent = `${formatNumber(video.channelSubs)} सब्सक्राइबर्स`;
    document.getElementById('videoDescriptionText').textContent = video.description;
    
    const videoPlayer = document.getElementById('videoPlayer');
    videoPlayer.src = video.videoUrl;
    
    const subscribeBtn = document.getElementById('subscribeBtn');
    const isSubscribed = localStorage.getItem(`subscribed_${video.channel}`) === 'true';
    subscribeBtn.textContent = isSubscribed ? 'सब्सक्राइब्ड' : 'सब्सक्राइब करें';
    subscribeBtn.className = isSubscribed ? 'subscribe-btn subscribed' : 'subscribe-btn';
}

// 📱 PAGE NAVIGATION FUNCTIONS
function toggleSidebar() {
    if (window.innerWidth <= 768) {
        AppState.isSidebarOpen = !AppState.isSidebarOpen;
        elements.sidebar.classList.toggle('active', AppState.isSidebarOpen);
    }
}

function closeSidebar() {
    AppState.isSidebarOpen = false;
    elements.sidebar.classList.remove('active');
}

function showPage(pageName) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
    });
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    switch(pageName) {
        case 'home':
            elements.homePage.classList.add('active');
            elements.homePage.style.display = 'block';
            document.querySelector('[onclick="showHome()"]').classList.add('active');
            AppState.currentPage = 'home';
            break;
            
        case 'trending':
            elements.trendingPage.classList.add('active');
            elements.trendingPage.style.display = 'block';
            document.querySelector('[onclick="showTrending()"]').classList.add('active');
            AppState.currentPage = 'trending';
            break;
            
        case 'upload':
            elements.uploadPage.classList.add('active');
            elements.uploadPage.style.display = 'block';
            AppState.currentPage = 'upload';
            break;
            
        case 'videoPlayer':
            elements.videoPlayerPage.classList.add('active');
            elements.videoPlayerPage.style.display = 'block';
            AppState.currentPage = 'videoPlayer';
            break;
            
        case 'search':
            elements.searchPage.classList.add('active');
            elements.searchPage.style.display = 'block';
            AppState.currentPage = 'search';
            break;
    }
    
    if (window.innerWidth <= 768) {
        closeSidebar();
    }
}

// 🌐 GLOBAL FUNCTIONS (called from HTML)
window.showHome = () => showPage('home');
window.showTrending = () => showPage('trending');
window.showUpload = () => showPage('upload');

window.goBack = () => {
    if (AppState.currentPage === 'videoPlayer' || AppState.currentPage === 'search') {
        showPage('home');
    }
};

window.goHome = () => showPage('home');

// 🔍 SEARCH FUNCTIONS
function performSearch() {
    const query = elements.searchInput.value.trim();
    if (!query) return;
    
    AppState.searchQuery = query;
    showPage('search');
    
    elements.searchQueryText.textContent = `"${query}"`;
    
    const results = AppState.videos.filter(video => 
        video.title.toLowerCase().includes(query.toLowerCase()) ||
        video.description.toLowerCase().includes(query.toLowerCase()) ||
        video.channel.toLowerCase().includes(query.toLowerCase())
    );
    
    renderSearchResults(results);
}

function renderSearchResults(results) {
    const grid = elements.searchResultsGrid;
    grid.innerHTML = '';
    
    if (results.length === 0) {
        grid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>"${AppState.searchQuery}" के लिए कोई वीडियो नहीं मिला</h3>
                <p>कृपया दूसरे कीवर्ड से सर्च करें</p>
            </div>
        `;
    } else {
        results.forEach(video => {
            const videoCard = createVideoCard(video);
            grid.appendChild(videoCard);
        });
    }
    
    elements.resultCount.textContent = `${results.length} वीडियो मिले`;
}

// 🎛️ FILTER FUNCTIONS
window.filterVideos = (filter) => {
    let filtered = [...AppState.videos];
    
    switch(filter) {
        case 'today':
            filtered = filtered.slice(0, 2);
            break;
        case 'week':
            filtered = filtered.slice(2, 5);
            break;
        case 'all':
        default:
            filtered = [...AppState.videos];
    }
    
    AppState.filteredVideos = filtered;
    renderVideos();
};

window.filterByCategory = (category) => {
    AppState.filteredVideos = AppState.videos.filter(v => v.category === category);
    renderVideos();
    showPage('home');
};

function loadMoreVideos() {
    const newVideos = [
        {
            id: AppState.videos.length + 1,
            title: 'शंघाई ट्रेवल गाइड | 上海旅游',
            description: 'शंघाई घूमने का पूरा गाइड। बेस्ट प्लेसेस, फूड और टिप्स।',
            duration: '20:15',
            views: 1650000,
            likes: 88000,
            dislikes: 2500,
            channel: 'Travel China',
            channelSubs: 1950000,
            category: 'entertainment',
            uploadDate: '5 दिन पहले',
            thumbnail: 'https://picsum.photos/seed/ent2/320/180',
            videoUrl: 'assets/demo-video6.mp4',
            isOffline: true
        },
        {
            id: AppState.videos.length + 2,
            title: 'चाइनीज़ कुकिंग शो | 中国烹饪',
            description: 'ऑथेंटिक चाइनीज़ डिशेज बनाना सीखें। स्टेप बाई स्टेप गाइड।',
            duration: '30:45',
            views: 1250000,
            likes: 78000,
            dislikes: 2000,
            channel: 'China Cooking',
            channelSubs: 1850000,
            category: 'entertainment',
            uploadDate: '6 घंटे पहले',
            thumbnail: 'https://picsum.photos/seed/cooking1/320/180',
            videoUrl: 'assets/demo-video7.mp4',
            isOffline: false
        }
    ];
    
    AppState.videos.push(...newVideos);
    AppState.filteredVideos = [...AppState.videos];
    renderVideos();
    showToast('2 नए वीडियो लोड हुए!', 'success');
}

// 📤 UPLOAD FUNCTIONS
function setupUploadForm() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('videoFileInput');
    const selectFileBtn = document.getElementById('selectFileBtn');
    const uploadForm = document.getElementById('uploadForm');
    const cancelUploadBtn = document.getElementById('cancelUploadBtn');
    const uploadSubmitBtn = document.getElementById('uploadSubmitBtn');
    
    selectFileBtn.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });
    
    cancelUploadBtn.addEventListener('click', () => {
        uploadForm.style.display = 'none';
        uploadArea.style.display = 'block';
        fileInput.value = '';
        AppState.fileToUpload = null;
    });
    
    uploadSubmitBtn.addEventListener('click', uploadVideo);
}

function handleFileSelect(file) {
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    const maxSize = 2 * 1024 * 1024 * 1024;
    
    if (!validTypes.includes(file.type)) {
        showToast('कृपया वीडियो फाइल चुनें (MP4, MOV, AVI)', 'error');
        return;
    }
    
    if (file.size > maxSize) {
        showToast('फाइल साइज 2GB से कम होनी चाहिए', 'error');
        return;
    }
    
    document.getElementById('uploadArea').style.display = 'none';
    document.getElementById('uploadForm').style.display = 'block';
    
    const fileName = file.name.replace(/\.[^/.]+$/, "");
    document.getElementById('videoTitle').value = fileName;
    
    document.getElementById('thumbnailPreview').src = 'assets/default-thumbnail.jpg';
    
    AppState.fileToUpload = file;
    showToast('फाइल सफलतापूर्वक चुनी गई!', 'success');
}

function uploadVideo() {
    if (!AppState.currentUser) {
        showToast('अपलोड करने के लिए लॉगिन आवश्यक है।', 'error');
        return;
    }
    
    const title = document.getElementById('videoTitle').value.trim();
    const description = document.getElementById('videoDescription').value.trim();
    const category = document.getElementById('videoCategory').value;
    
    if (!title) {
        showToast('कृपया वीडियो का टाइटल दें', 'error');
        return;
    }
    
    if (!AppState.fileToUpload) {
        showToast('कृपया वीडियो फाइल चुनें', 'error');
        return;
    }
    
    document.getElementById('uploadProgress').style.display = 'block';
    simulateUploadProgress();
}

function simulateUploadProgress() {
    let progress = 0;
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const uploadSpeed = document.getElementById('uploadSpeed');
    
    const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress > 100) progress = 100;
        
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${Math.round(progress)}% अपलोड हुआ`;
        uploadSpeed.textContent = `स्पीड: ${(Math.random() * 5).toFixed(1)} MB/s`;
        
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                showToast('वीडियो सफलतापूर्वक अपलोड हो गया!', 'success');
                document.getElementById('uploadForm').style.display = 'none';
                document.getElementById('uploadArea').style.display = 'block';
                document.getElementById('uploadProgress').style.display = 'none';
                document.getElementById('videoFileInput').value = '';
                AppState.fileToUpload = null;
                showPage('home');
            }, 500);
        }
    }, 200);
}

// ⭐ VIDEO INTERACTION FUNCTIONS
window.likeVideo = function() {
    if (!AppState.currentVideo) return;
    
    if (!AppState.currentUser) {
        showToast('लाइक करने के लिए लॉगिन करें', 'error');
        return;
    }
    
    const likeBtn = document.querySelector('.like-btn');
    const isLiked = likeBtn.classList.contains('liked');
    
    if (isLiked) {
        likeBtn.classList.remove('liked');
        AppState.currentVideo.likes--;
        showToast('आपने लाइक हटा दिया', 'info');
    } else {
        likeBtn.classList.add('liked');
        AppState.currentVideo.likes++;
        showToast('आपने वीडियो लाइक किया!', 'success');
    }
    
    document.getElementById('likeCount').textContent = formatNumber(AppState.currentVideo.likes);
};

window.dislikeVideo = function() {
    if (!AppState.currentVideo) return;
    
    if (!AppState.currentUser) {
        showToast('डिसलाइक करने के लिए लॉगिन करें', 'error');
        return;
    }
    
    AppState.currentVideo.dislikes++;
    document.getElementById('dislikeCount').textContent = formatNumber(AppState.currentVideo.dislikes);
    showToast('आपने वीडियो डिसलाइक किया', 'info');
};

document.getElementById('subscribeBtn').addEventListener('click', function() {
    if (!AppState.currentVideo) return;
    
    if (!AppState.currentUser) {
        showToast('सब्सक्राइब करने के लिए लॉगिन करें', 'error');
        return;
    }
    
    const isSubscribed = this.classList.contains('subscribed');
    
    if (isSubscribed) {
        this.classList.remove('subscribed');
        this.textContent = 'सब्सक्राइब करें';
        AppState.currentVideo.channelSubs--;
        localStorage.setItem(`subscribed_${AppState.currentVideo.channel}`, 'false');
        showToast('आपने सब्सक्राइब नहीं किया', 'info');
    } else {
        this.classList.add('subscribed');
        this.textContent = 'सब्सक्राइब्ड';
        AppState.currentVideo.channelSubs++;
        localStorage.setItem(`subscribed_${AppState.currentVideo.channel}`, 'true');
        showToast('आपने सफलतापूर्वक सब्सक्राइब किया!', 'success');
    }
    
    document.getElementById('channelSubs').textContent = 
        `${formatNumber(AppState.currentVideo.channelSubs)} सब्सक्राइबर्स`;
});

window.shareVideo = function() {
    if (!AppState.currentVideo) return;
    
    if (navigator.share) {
        navigator.share({
            title: AppState.currentVideo.title,
            text: 'Metube पर यह वीडियो देखें',
            url: window.location.href,
        }).then(() => {
            showToast('वीडियो सफलतापूर्वक शेयर किया गया!', 'success');
        });
    } else {
        navigator.clipboard.writeText(window.location.href)
            .then(() => {
                showToast('लिंक कॉपी हो गया! दोस्तों के साथ शेयर करें।', 'success');
            });
    }
};

window.downloadVideo = function() {
    if (!AppState.currentVideo) return;
    
    if (AppState.currentVideo.isOffline) {
        showToast('यह वीडियो पहले से डाउनलोड है', 'info');
        return;
    }
    
    const downloadLink = document.createElement('a');
    downloadLink.href = AppState.currentVideo.videoUrl;
    downloadLink.download = `${AppState.currentVideo.title}.mp4`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    AppState.currentVideo.isOffline = true;
    saveOfflineVideo(AppState.currentVideo);
    showToast('वीडियो डाउनलोड शुरू हो गया!', 'success');
};

function saveOfflineVideo(video) {
    const offlineVideos = JSON.parse(localStorage.getItem('offlineVideos') || '[]');
    
    if (!offlineVideos.some(v => v.id === video.id)) {
        offlineVideos.push({
            id: video.id,
            title: video.title,
            thumbnail: video.thumbnail,
            videoUrl: video.videoUrl,
            duration: video.duration,
            savedAt: new Date().toISOString()
        });
        localStorage.setItem('offlineVideos', JSON.stringify(offlineVideos));
    }
}

function saveToHistory(video) {
    const history = JSON.parse(localStorage.getItem('watchHistory') || '[]');
    
    const filteredHistory = history.filter(v => v.id !== video.id);
    
    filteredHistory.unshift({
        id: video.id,
        title: video.title,
        thumbnail: video.thumbnail,
        watchedAt: new Date().toISOString()
    });
    
    const limitedHistory = filteredHistory.slice(0, 50);
    localStorage.setItem('watchHistory', JSON.stringify(limitedHistory));
}

// 📡 NETWORK & RESIZE FUNCTIONS
function checkNetworkStatus() {
    AppState.isOffline = !navigator.onLine;
    elements.offlineIndicator.style.display = AppState.isOffline ? 'block' : 'none';
}

function handleResize() {
    if (window.innerWidth > 768) {
        closeSidebar();
    }
}

// 🎛️ DEMO PAGES (Phase 2 में पूरे होंगे)
window.showSubscriptions = () => {
    showToast('फेज 2 में उपलब्ध होगा - सब्सक्रिप्शन पेज', 'info');
};

window.showLibrary = () => {
    showToast('फेज 2 में उपलब्ध होगा - लाइब्रेरी पेज', 'info');
};

window.showHistory = () => {
    showToast('फेज 2 में उपलब्ध होगा - वॉच हिस्ट्री पेज', 'info');
};

window.showDownloads = () => {
    showToast('फेज 2 में उपलब्ध होगा - डाउनलोड्स पेज', 'info');
};

// 🎮 VIDEO PLAYER CONTROLS
window.togglePlay = function() {
    const video = document.getElementById('videoPlayer');
    const btn = document.getElementById('playBtn');
    
    if (video.paused) {
        video.play();
        btn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
        video.pause();
        btn.innerHTML = '<i class="fas fa-play"></i>';
    }
};

window.skipBackward = function() {
    const video = document.getElementById('videoPlayer');
    video.currentTime = Math.max(0, video.currentTime - 10);
};

window.skipForward = function() {
    const video = document.getElementById('videoPlayer');
    video.currentTime = Math.min(video.duration, video.currentTime + 10);
};

window.toggleMute = function() {
    const video = document.getElementById('videoPlayer');
    const btn = document.getElementById('muteBtn');
    
    video.muted = !video.muted;
    btn.innerHTML = video.muted ? 
        '<i class="fas fa-volume-mute"></i>' : 
        '<i class="fas fa-volume-up"></i>';
};

window.toggleFullscreen = function() {
    const videoContainer = document.querySelector('.video-wrapper');
    
    if (!document.fullscreenElement) {
        videoContainer.requestFullscreen().catch(err => {
            console.log(`Fullscreen error: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
};

// 🔊 VOLUME CONTROL
document.getElementById('volumeSlider').addEventListener('input', (e) => {
    const video = document.getElementById('videoPlayer');
    video.volume = e.target.value / 100;
});

// 🏁 APP START
document.addEventListener('DOMContentLoaded', initApp);

// 🌐 NETWORK EVENTS
window.addEventListener('online', () => {
    elements.offlineIndicator.style.display = 'none';
    showToast('आप ऑनलाइन हैं!', 'success');
});

window.addEventListener('offline', () => {
    elements.offlineIndicator.style.display = 'block';
    showToast('आप ऑफलाइन हैं। सेव किए गए वीडियो देख सकते हैं।', 'error');
});
