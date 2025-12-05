// Metube App - Main JavaScript File

// एप्लिकेशन स्टेट
const AppState = {
    currentPage: 'home',
    currentVideo: null,
    videos: [],
    filteredVideos: [],
    categories: ['music', 'gaming', 'education', 'sports', 'entertainment'],
    searchQuery: '',
    isSidebarOpen: false,
    isOffline: !navigator.onLine
};

// DOM Elements
const elements = {
    // पेजेस
    homePage: document.getElementById('homePage'),
    trendingPage: document.getElementById('trendingPage'),
    uploadPage: document.getElementById('uploadPage'),
    videoPlayerPage: document.getElementById('videoPlayerPage'),
    searchPage: document.getElementById('searchPage'),
    
    // वीडियो ग्रिड्स
    videosGrid: document.getElementById('videosGrid'),
    trendingGrid: document.getElementById('trendingGrid'),
    searchResultsGrid: document.getElementById('searchResultsGrid'),
    
    // बटन्स
    menuBtn: document.getElementById('menuBtn'),
    searchBtn: document.getElementById('searchBtn'),
    uploadBtn: document.getElementById('uploadBtn'),
    loadMoreBtn: document.getElementById('loadMoreBtn'),
    
    // इनपुट्स
    searchInput: document.getElementById('searchInput'),
    
    // अन्य
    sidebar: document.getElementById('sidebar'),
    offlineIndicator: document.getElementById('offlineIndicator'),
    searchQueryText: document.getElementById('searchQueryText'),
    resultCount: document.getElementById('resultCount')
};

// ऐप इनिशियलाइज़ेशन
function initApp() {
    console.log('Metube ऐप शुरू हो रहा है...');
    
    // ईवेंट लिसनर्स सेटअप
    setupEventListeners();
    
    // नेटवर्क स्टेटस चेक
    checkNetworkStatus();
    
    // डेमो वीडियो लोड करें
    loadDemoVideos();
    
    // ऑफलाइन डेटा चेक
    loadOfflineVideos();
    
    // लोडिंग हाइड करें
    setTimeout(() => {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        console.log('Metube ऐप तैयार है!');
    }, 1500);
}

// ईवेंट लिसनर्स सेटअप
function setupEventListeners() {
    // मेन्यू बटन
    elements.menuBtn.addEventListener('click', toggleSidebar);
    
    // सर्च बटन
    elements.searchBtn.addEventListener('click', performSearch);
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
    
    // अपलोड बटन
    elements.uploadBtn.addEventListener('click', () => showPage('upload'));
    
    // लोड मोर बटन
    elements.loadMoreBtn.addEventListener('click', loadMoreVideos);
    
    // गेस्ट लॉगिन बटन
    document.getElementById('guestLoginBtn').addEventListener('click', showLoginOptions);
    
    // अपलोड फॉर्म
    setupUploadForm();
    
    // बैक बटन (वीडियो प्लेयर)
    document.querySelector('.back-btn').addEventListener('click', goBack);
    
    // विंडो रिसाइज
    window.addEventListener('resize', handleResize);
    
    // क्लिक ऑउटसाइड साइडबार
    document.addEventListener('click', (e) => {
        if (AppState.isSidebarOpen && 
            !elements.sidebar.contains(e.target) && 
            !elements.menuBtn.contains(e.target)) {
            closeSidebar();
        }
    });
}

// डेमो वीडियो डेटा
const demoVideos = [
    {
        id: 1,
        title: 'चाइनीज़ पॉप संगीत 2024 | 中国流行音乐',
        description: '2024 के सबसे लोकप्रिय चाइनीज़ पॉप गाने। सबसे नई चाइना म्यूजिक।',
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
    },
    {
        id: 6,
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
    }
];

// डेमो वीडियो लोड करें
function loadDemoVideos() {
    AppState.videos = demoVideos;
    AppState.filteredVideos = [...demoVideos];
    renderVideos();
    renderTrendingVideos();
}

// वीडियो रेंडर करें
function renderVideos() {
    const grid = elements.videosGrid;
    grid.innerHTML = '';
    
    AppState.filteredVideos.forEach(video => {
        const videoCard = createVideoCard(video);
        grid.appendChild(videoCard);
    });
    
    // लोड मोर बटन शो/हाइड
    elements.loadMoreBtn.style.display = AppState.filteredVideos.length >= 6 ? 'block' : 'none';
}

// वीडियो कार्ड बनाएं
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

// ट्रेंडिंग वीडियो रेंडर करें
function renderTrendingVideos() {
    const grid = elements.trendingGrid;
    grid.innerHTML = '';
    
    // व्यूज़ के हिसाब से सॉर्ट करें
    const trendingVideos = [...AppState.videos]
        .sort((a, b) => b.views - a.views)
        .slice(0, 6);
    
    trendingVideos.forEach(video => {
        const videoCard = createVideoCard(video);
        grid.appendChild(videoCard);
    });
}

// वीडियो प्ले करें
function playVideo(video) {
    AppState.currentVideo = video;
    showPage('videoPlayer');
    
    // वीडियो प्लेयर अपडेट करें
    updateVideoPlayer(video);
    
    // व्यूज़ काउंट बढ़ाएं (डेमो)
    video.views++;
    
    // हिस्ट्री में सेव करें
    saveToHistory(video);
}

// वीडियो प्लेयर अपडेट करें
function updateVideoPlayer(video) {
    document.getElementById('playerVideoTitle').textContent = video.title;
    document.getElementById('viewsCount').innerHTML = `<i class="fas fa-eye"></i> ${formatNumber(video.views)} व्यूज़`;
    document.getElementById('uploadDate').innerHTML = `<i class="far fa-calendar"></i> ${video.uploadDate}`;
    document.getElementById('likeCount').textContent = formatNumber(video.likes);
    document.getElementById('dislikeCount').textContent = formatNumber(video.dislikes);
    document.getElementById('channelName').textContent = video.channel;
    document.getElementById('channelSubs').textContent = `${formatNumber(video.channelSubs)} सब्सक्राइबर्स`;
    document.getElementById('videoDescriptionText').textContent = video.description;
    
    // वीडियो सोर्स सेट करें
    const videoPlayer = document.getElementById('videoPlayer');
    videoPlayer.src = video.videoUrl;
    
    // सब्सक्राइब बटन
    const subscribeBtn = document.getElementById('subscribeBtn');
    const isSubscribed = localStorage.getItem(`subscribed_${video.channel}`) === 'true';
    subscribeBtn.textContent = isSubscribed ? 'सब्सक्राइब्ड' : 'सब्सक्राइब करें';
    subscribeBtn.className = isSubscribed ? 'subscribe-btn subscribed' : 'subscribe-btn';
}

// साइडबार टॉगल
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

// पेज शो करें
function showPage(pageName) {
    // सभी पेजेस हाइड करें
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
    });
    
    // नेविगेशन एक्टिव क्लास अपडेट
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // नए पेज को शो करें
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
    
    // मोबाइल पर साइडबार क्लोज करें
    if (window.innerWidth <= 768) {
        closeSidebar();
    }
}

// ग्लोबल फंक्शन्स (HTML से कॉल करने के लिए)
window.showHome = () => showPage('home');
window.showTrending = () => showPage('trending');
window.showUpload = () => showPage('upload');
window.goBack = () => {
    if (AppState.currentPage === 'videoPlayer') {
        showPage('home');
    } else if (AppState.currentPage === 'search') {
        showPage('home');
    }
};

// सर्च फंक्शन
function performSearch() {
    const query = elements.searchInput.value.trim();
    if (!query) return;
    
    AppState.searchQuery = query;
    showPage('search');
    
    // सर्च रिजल्ट्स अपडेट
    elements.searchQueryText.textContent = `"${query}"`;
    
    // वीडियो फिल्टर करें
    const results = AppState.videos.filter(video => 
        video.title.toLowerCase().includes(query.toLowerCase()) ||
        video.description.toLowerCase().includes(query.toLowerCase()) ||
        video.channel.toLowerCase().includes(query.toLowerCase())
    );
    
    // रिजल्ट्स रेंडर करें
    renderSearchResults(results);
}

// सर्च रिजल्ट्स रेंडर करें
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

// वीडियो फिल्टर करें
window.filterVideos = (filter) => {
    let filtered = [...AppState.videos];
    
    switch(filter) {
        case 'today':
            // डेमो के लिए रैंडम
            filtered = filtered.slice(0, 3);
            break;
        case 'week':
            filtered = filtered.slice(2, 5);
            break;
    }
    
    AppState.filteredVideos = filtered;
    renderVideos();
};

// कैटेगरी के हिसाब से फिल्टर
window.filterByCategory = (category) => {
    AppState.filteredVideos = AppState.videos.filter(v => v.category === category);
    renderVideos();
    showPage('home');
};

// और वीडियो लोड करें
function loadMoreVideos() {
    // डेमो के लिए नए वीडियो जोड़ें
    const newVideos = [
        {
            id: AppState.videos.length + 1,
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
        },
        {
            id: AppState.videos.length + 2,
            title: 'टेक रिव्यू: Huawei P60 | 华为P60评测',
            description: 'नया Huawei P60 फोन की डिटेल रिव्यू। स्पेसिफिकेशन और परफॉर्मेंस।',
            duration: '28:20',
            views: 1950000,
            likes: 115000,
            dislikes: 5000,
            channel: 'Tech China',
            channelSubs: 2250000,
            category: 'education',
            uploadDate: '1 दिन पहले',
            thumbnail: 'https://picsum.photos/seed/tech1/320/180',
            videoUrl: 'assets/demo-video8.mp4',
            isOffline: true
        }
    ];
    
    AppState.videos.push(...newVideos);
    AppState.filteredVideos = [...AppState.videos];
    renderVideos();
}

// अपलोड फॉर्म सेटअप
function setupUploadForm() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('videoFileInput');
    const selectFileBtn = document.getElementById('selectFileBtn');
    const uploadForm = document.getElementById('uploadForm');
    const cancelUploadBtn = document.getElementById('cancelUploadBtn');
    const uploadSubmitBtn = document.getElementById('uploadSubmitBtn');
    
    // फाइल सेलेक्ट बटन
    selectFileBtn.addEventListener('click', () => fileInput.click());
    
    // फाइल इनपुट चेंज
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            handleFileSelect(file);
        }
    });
    
    // ड्रैग एंड ड्रॉप
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
            const file = e.dataTransfer.files[0];
            handleFileSelect(file);
        }
    });
    
    // कैंसल बटन
    cancelUploadBtn.addEventListener('click', () => {
        uploadForm.style.display = 'none';
        uploadArea.style.display = 'block';
        fileInput.value = '';
    });
    
    // अपलोड सबमिट
    uploadSubmitBtn.addEventListener('click', uploadVideo);
}

// फाइल सेलेक्ट हेंडलर
function handleFileSelect(file) {
    // फाइल वैलिडेशन
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
    
    if (!validTypes.includes(file.type)) {
        alert('कृपया वीडियो फाइल चुनें (MP4, MOV, AVI)');
        return;
    }
    
    if (file.size > maxSize) {
        alert('फाइल साइज 2GB से कम होनी चाहिए');
        return;
    }
    
    // अपलोड एरिया हाइड और फॉर्म शो
    document.getElementById('uploadArea').style.display = 'none';
    document.getElementById('uploadForm').style.display = 'block';
    
    // फाइल नाम टाइटल में सेट करें
    const fileName = file.name.replace(/\.[^/.]+$/, "");
    document.getElementById('videoTitle').value = fileName;
    
    // थंबनेल जेनरेट करें (डेमो के लिए)
    generateThumbnail(file);
}

// थंबनेल जेनरेट (डेमो)
function generateThumbnail(file) {
    // असली प्रोजेक्ट में यहाँ वीडियो से थंबनेल बनाएंगे
    const thumbPreview = document.getElementById('thumbnailPreview');
    thumbPreview.src = 'assets/default-thumbnail.jpg';
}

// वीडियो अपलोड
function uploadVideo() {
    const title = document.getElementById('videoTitle').value.trim();
    const description = document.getElementById('videoDescription').value.trim();
    const category = document.getElementById('videoCategory').value;
    
    if (!title) {
        alert('कृपया वीडियो का टाइटल दें');
        return;
    }
    
    // प्रोग्रेस बार शो
    document.getElementById('uploadProgress').style.display = 'block';
    
    // डेमो अपलोड प्रोग्रेस
    simulateUploadProgress();
}

// अपलोड प्रोग्रेस सिम्युलेट (डेमो)
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
                alert('वीडियो सफलतापूर्वक अपलोड हो गया!');
                document.getElementById('uploadForm').style.display = 'none';
                document.getElementById('uploadArea').style.display = 'block';
                document.getElementById('uploadProgress').style.display = 'none';
                document.getElementById('videoFileInput').value = '';
                
                // होम पेज पर जाएँ
                showPage('home');
            }, 500);
        }
    }, 200);
}

// वीडियो लाइक/डिसलाइक
window.likeVideo = () => {
    if (!AppState.currentVideo) return;
    
    const likeBtn = document.querySelector('.like-btn');
    const isLiked = likeBtn.classList.contains('liked');
    
    if (isLiked) {
        // Unlike
        likeBtn.classList.remove('liked');
        AppState.currentVideo.likes--;
    } else {
        // Like
        likeBtn.classList.add('liked');
        AppState.currentVideo.likes++;
    }
    
    document.getElementById('likeCount').textContent = formatNumber(AppState.currentVideo.likes);
};

window.dislikeVideo = () => {
    if (!AppState.currentVideo) return;
    AppState.currentVideo.dislikes++;
    document.getElementById('dislikeCount').textContent = formatNumber(AppState.currentVideo.dislikes);
};

// सब्सक्राइब
document.getElementById('subscribeBtn').addEventListener('click', function() {
    if (!AppState.currentVideo) return;
    
    const isSubscribed = this.classList.contains('subscribed');
    
    if (isSubscribed) {
        // Unsubscribe
        this.classList.remove('subscribed');
        this.textContent = 'सब्सक्राइब करें';
        AppState.currentVideo.channelSubs--;
        localStorage.setItem(`subscribed_${AppState.currentVideo.channel}`, 'false');
    } else {
        // Subscribe
        this.classList.add('subscribed');
        this.textContent = 'सब्सक्राइब्ड';
        AppState.currentVideo.channelSubs++;
        localStorage.setItem(`subscribed_${AppState.currentVideo.channel}`, 'true');
    }
    
    document.getElementById('channelSubs').textContent = 
        `${formatNumber(AppState.currentVideo.channelSubs)} सब्सक्राइबर्स`;
});

// शेयर वीडियो
window.shareVideo = () => {
    if (!AppState.currentVideo) return;
    
    if (navigator.share) {
        navigator.share({
            title: AppState.currentVideo.title,
            text: 'Metube पर यह वीडियो देखें',
            url: window.location.href,
        });
    } else {
        // फॉलबैक
        navigator.clipboard.writeText(window.location.href);
        alert('लिंक कॉपी हो गया! दोस्तों के साथ शेयर करें।');
    }
};

// डाउनलोड वीडियो
window.downloadVideo = () => {
    if (!AppState.currentVideo) return;
    
    if (AppState.currentVideo.isOffline) {
        alert('यह वीडियो पहले से डाउनलोड है');
        return;
    }
    
    // डेमो डाउनलोड
    const downloadLink = document.createElement('a');
    downloadLink.href = AppState.currentVideo.videoUrl;
    downloadLink.download = `${AppState.currentVideo.title}.mp4`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // ऑफलाइन मार्क करें
    AppState.currentVideo.isOffline = true;
    saveOfflineVideo(AppState.currentVideo);
    alert('वीडियो डाउनलोड शुरू हो गया!');
};

// ऑफलाइन वीडियो सेव करें
function saveOfflineVideo(video) {
    const offlineVideos = JSON.parse(localStorage.getItem('offlineVideos') || '[]');
    
    // चेक करें अगर पहले से सेव नहीं है
    if (!offlineVideos.some(v => v.id === video.id)) {
        offlineVideos.push(video);
        localStorage.setItem('offlineVideos', JSON.stringify(offlineVideos));
    }
}

// ऑफलाइन वीडियो लोड करें
function loadOfflineVideos() {
    const offlineVideos = JSON.parse(localStorage.getItem('offlineVideos') || '[]');
    console.log(`${offlineVideos.length} ऑफलाइन वीडियो मिले`);
}

// हिस्ट्री में सेव करें
function saveToHistory(video) {
    const history = JSON.parse(localStorage.getItem('watchHistory') || '[]');
    
    // डुप्लिकेट रिमूव करें
    const filteredHistory = history.filter(v => v.id !== video.id);
    
    // नया वीडियो ऐड करें
    filteredHistory.unshift({
        id: video.id,
        title: video.title,
        thumbnail: video.thumbnail,
        watchedAt: new Date().toISOString()
    });
    
    // केवल 50 आइटम्स रखें
    const limitedHistory = filteredHistory.slice(0, 50);
    localStorage.setItem('watchHistory', JSON.stringify(limitedHistory));
}

// लॉगिन ऑप्शंस शो
function showLoginOptions() {
    const loginOptions = `
        <div style="padding: 20px; text-align: center;">
            <h3>Metube में लॉगिन करें</h3>
            <p style="margin: 15px 0; color: #888;">फेज 2 में लॉगिन सिस्टम जोड़ा जाएगा</p>
            <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
                <button style="padding: 12px; background: #4285f4; color: white; border: none; border-radius: 5px;">
                    Google से लॉगिन
                </button>
                <button style="padding: 12px; background: #07c160; color: white; border: none; border-radius: 5px;">
                    WeChat से लॉगिन
                </button>
                <button style="padding: 12px; background: #ff0000; color: white; border: none; border-radius: 5px;">
                    Douyin से लॉगिन
                </button>
                <button style="padding: 12px; background: #333; color: white; border: none; border-radius: 5px;">
                    फोन नंबर से लॉगिन
                </button>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" style="margin-top: 20px; padding: 10px 20px; background: transparent; color: #888; border: 1px solid #555; border-radius: 5px;">
                बाद में
            </button>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.8); display: flex; justify-content: center; 
        align-items: center; z-index: 1000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: #212121; border-radius: 15px; padding: 0; 
        max-width: 400px; width: 90%; color: white;
    `;
    
    modalContent.innerHTML = loginOptions;
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // बाहर क्लिक करने पर क्लोज
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// नंबर फॉर्मेटिंग
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// नेटवर्क स्टेटस चेक
function checkNetworkStatus() {
    AppState.isOffline = !navigator.onLine;
    elements.offlineIndicator.style.display = AppState.isOffline ? 'block' : 'none';
}

// विंडो रिसाइज हेंडल
function handleResize() {
    if (window.innerWidth > 768) {
        closeSidebar();
    }
}

// सब्सक्रिप्शन पेज (डेमो)
window.showSubscriptions = () => {
    alert('फेज 2 में उपलब्ध होगा - सब्सक्रिप्शन पेज');
};

// लाइब्रेरी पेज (डेमो)
window.showLibrary = () => {
    alert('फेज 2 में उपलब्ध होगा - लाइब्रेरी पेज');
};

// हिस्ट्री पेज (डेमो)
window.showHistory = () => {
    alert('फेज 2 में उपलब्ध होगा - वॉच हिस्ट्री पेज');
};

// डाउनलोड्स पेज (डेमो)
window.showDownloads = () => {
    alert('फेज 2 में उपलब्ध होगा - डाउनलोड्स पेज');
};

// होम पेज जाएँ
window.goHome = () => showPage('home');

// वीडियो प्लेयर कंट्रोल्स
window.togglePlay = () => {
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

window.skipBackward = () => {
    const video = document.getElementById('videoPlayer');
    video.currentTime = Math.max(0, video.currentTime - 10);
};

window.skipForward = () => {
    const video = document.getElementById('videoPlayer');
    video.currentTime = Math.min(video.duration, video.currentTime + 10);
};

window.toggleMute = () => {
    const video = document.getElementById('videoPlayer');
    const btn = document.getElementById('muteBtn');
    
    video.muted = !video.muted;
    btn.innerHTML = video.muted ? 
        '<i class="fas fa-volume-mute"></i>' : 
        '<i class="fas fa-volume-up"></i>';
};

window.toggleFullscreen = () => {
    const videoContainer = document.querySelector('.video-wrapper');
    
    if (!document.fullscreenElement) {
        videoContainer.requestFullscreen().catch(err => {
            console.log(`Fullscreen error: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
};

// वॉल्यूम स्लाइडर
document.getElementById('volumeSlider').addEventListener('input', (e) => {
    const video = document.getElementById('videoPlayer');
    video.volume = e.target.value / 100;
});

// ऐप इनिशियलाइज़ करें जब DOM लोड हो
document.addEventListener('DOMContentLoaded', initApp);
