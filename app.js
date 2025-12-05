// app.js - Metube एप्लिकेशन का मुख्य लॉजिक

// =============================================================
// 0. FIREBASE IMPORTS (नया जोड़ें)
// =============================================================

// Firestore functions import करें
import { 
    collection, 
    query, 
    onSnapshot, 
    addDoc, 
    doc, 
    updateDoc, 
    increment 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// =============================================================
// 1. ग्लोबल वैरिएबल्स और स्टेट
// =============================================================

let METUBE_APP_ID;
let AUTH_SERVICE;
let DB_SERVICE;
let currentUser = null; 
let currentFile = null;

const VIDEOS_COLLECTION = 'videos';

// 🆕 नया स्टोरेज API कॉन्फ़िगरेशन
const NEW_STORAGE_API_KEY = 'dw1ksfmm7'; 
const NEW_STORAGE_API_ID = '43483361888786527';

// UI Elements
const videosGrid = document.getElementById('videosGrid');
const loadingVideos = document.querySelector('.loading-videos');

// Upload UI Elements
const uploadForm = document.getElementById('uploadForm');
const fileInput = document.getElementById('fileInput');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const uploadDetails = document.getElementById('uploadDetails');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const uploadSpeed = document.getElementById('uploadSpeed');

// Player UI Elements
const mainVideoPlayer = document.getElementById('mainVideoPlayer');
const playerVideoTitle = document.getElementById('playerVideoTitle');
const playerVideoStats = document.getElementById('playerVideoStats');
const playerChannelName = document.getElementById('playerChannelName');
const playerVideoDescription = document.getElementById('playerVideoDescription');

// =============================================================
// 2. यूटिलिटी फ़ंक्शंस
// =============================================================

function formatTimeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) { return Math.floor(interval) + " साल पहले"; }
    interval = seconds / 2592000;
    if (interval > 1) { return Math.floor(interval) + " महीने पहले"; }
    interval = seconds / 86400;
    if (interval > 1) { return Math.floor(interval) + " दिन पहले"; }
    interval = seconds / 3600;
    if (interval > 1) { return Math.floor(interval) + " घंटे पहले"; }
    interval = seconds / 60;
    if (interval > 1) { return Math.floor(interval) + " मिनट पहले"; }
    return Math.floor(seconds) + " सेकंड पहले";
}

function formatNumber(num) {
    if (num >= 1000000) { return (num / 1000000).toFixed(1) + 'M'; }
    if (num >= 1000) { return (num / 1000).toFixed(0) + 'K'; }
    return num;
}

// =============================================================
// 3. UI/नेविगेशन फ़ंक्शंस
// =============================================================

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
        page.classList.remove('active');
    });

    const activePage = document.getElementById(pageId);
    if (activePage) {
        activePage.style.display = 'block';
        activePage.classList.add('active');
    }
    
    // Update bottom nav
    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    if (pageId === 'homePage') {
        document.querySelector('.bottom-nav .nav-item:first-child').classList.add('active');
    }
}

// =============================================================
// 4. Firebase Auth
// =============================================================

function setupAuthListener(auth) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            console.log("User is signed in:", currentUser.uid);
            document.getElementById('loginBtn').style.display = 'none';
            document.getElementById('loggedUser').style.display = 'flex';
            document.getElementById('userAvatar').src = `https://placehold.co/36x36/888/fff?text=${user.email?.charAt(0).toUpperCase() || 'U'}`;
        } else {
            currentUser = null;
            console.log("User is signed out.");
            document.getElementById('loginBtn').style.display = 'flex';
            document.getElementById('loggedUser').style.display = 'none';
            
            document.getElementById('loginBtn').onclick = async () => {
                try {
                    await auth.signInAnonymously();
                } catch (error) {
                    console.error("Anonymous login failed:", error);
                }
            };
        }
    });
}

// =============================================================
// 5. Firestore Data Handling
// =============================================================

function createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.onclick = () => playVideo(video.id, video);
    
    const uploadDate = video.timestamp?.toDate ? video.timestamp.toDate() : new Date(video.timestamp || Date.now());
    
    card.innerHTML = `
        <div class="thumbnail-container">
            <img src="${video.thumbnailUrl || 'https://placehold.co/480x270/0f0f0f/fff?text=Metube'}" alt="${video.title}" class="thumbnail">
            <span class="video-duration">${video.duration || '10:45'}</span>
        </div>
        <div class="video-details">
            <img src="https://placehold.co/36x36/ff0000/fff?text=C" alt="चैनल" class="channel-avatar">
            <div class="details-text">
                <h3 class="video-title-card">${video.title}</h3>
                <p class="channel-name">${video.userName || `User: ${video.userId?.substring(0, 8)}...`}</p>
                <p class="video-stats">${formatNumber(video.views || 0)} दृश्य • ${formatTimeSince(uploadDate)}</p>
            </div>
        </div>
    `;
    return card;
}

function loadVideos(db, appId) {
    if (!db || !appId) {
        console.error("Firestore not initialized");
        return;
    }

    videosGrid.innerHTML = '';
    if (loadingVideos) loadingVideos.style.display = 'block';

    try {
        // Firestore से वीडियो लोड करें
        const videosRef = collection(db, 'artifacts', appId, 'public', 'data', VIDEOS_COLLECTION);
        const q = query(videosRef);
        
        onSnapshot(q, (snapshot) => {
            const videoList = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                videoList.push({ 
                    id: doc.id, 
                    views: data.views || 0,
                    title: data.title || 'Untitled',
                    description: data.description || '',
                    url: data.url || '',
                    thumbnailUrl: data.thumbnailUrl || '',
                    userId: data.userId || 'anonymous',
                    timestamp: data.timestamp || new Date(),
                    ...data 
                });
            });

            // नए वीडियो पहले दिखाएं
            videoList.sort((a, b) => {
                const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
                const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
                return dateB - dateA;
            });

            videosGrid.innerHTML = '';
            if (videoList.length === 0) {
                videosGrid.innerHTML = '<p class="no-videos">कोई वीडियो उपलब्ध नहीं है। अपलोड करने वाले पहले व्यक्ति बनें!</p>';
            } else {
                videoList.forEach(video => {
                    videosGrid.appendChild(createVideoCard(video));
                });
            }
            if (loadingVideos) loadingVideos.style.display = 'none';
        }, (error) => {
            console.error("Firestore onSnapshot failed:", error);
            if (loadingVideos) loadingVideos.textContent = 'वीडियो लोड करने में त्रुटि आई।';
        });
    } catch (error) {
        console.error("Error setting up Firestore listener:", error);
    }
}

// =============================================================
// 6. VIDEO UPLOAD लॉजिक
// =============================================================

// नए API के लिए अपलोड फ़ंक्शन
function simulateNewAPIUpload(file, onProgress, onError, onSuccess) {
    let progress = 0;
    let startTime = Date.now();
    
    const interval = setInterval(() => {
        progress += 5;
        if (progress >= 100) {
            clearInterval(interval);
            
            // अंतिम अपडेट
            const transferred = file.size;
            onProgress(100, transferred, transferred);

            // ⚠️ ध्यान दें: असली API का उपयोग करते समय यह URL बदलना होगा
            const dummyDownloadURL = `https://new-storage-service.com/video/${NEW_STORAGE_API_ID}/${file.name}`; 
            onSuccess(dummyDownloadURL);
        } else {
            const transferred = (file.size * progress) / 100;
            onProgress(progress, transferred, file.size);
        }
    }, 200);
}

function handleFileInputChange(e) {
    const file = e.target.files[0];
    if (file) {
        currentFile = file;
        fileNameDisplay.textContent = `चुनी गई फ़ाइल: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
        uploadDetails.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = 'प्रगति: 0%';
        uploadSpeed.textContent = '0 KB/s';
    } else {
        currentFile = null;
        fileNameDisplay.textContent = 'कोई फ़ाइल नहीं चुनी गई।';
        uploadDetails.style.display = 'none';
    }
}

async function uploadVideo(e, db, storage, appId) { 
    e.preventDefault();
    
    if (!currentFile) {
        alert('कृपया अपलोड करने के लिए एक वीडियो फ़ाइल चुनें!');
        return;
    }

    if (currentFile.size > 100 * 1024 * 1024) {
        alert('फ़ाइल का आकार 100MB से अधिक है।');
        return;
    }

    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const category = document.getElementById('category').value;
    
    const userId = currentUser ? currentUser.uid : 'anonymous';
    const userName = currentUser?.email || 'Anonymous User';
    
    let startTime = Date.now();
    
    // नए API से अपलोड करें
    simulateNewAPIUpload(
        currentFile,
        (progress, transferredBytes, totalBytes) => {
            // UI अपडेट
            const transferredMB = (transferredBytes / 1024 / 1024).toFixed(2);
            const totalMB = (totalBytes / 1024 / 1024).toFixed(2);
            const elapsedSeconds = (Date.now() - startTime) / 1000;
            const speedKBps = (transferredBytes / elapsedSeconds / 1024).toFixed(1);

            progressFill.style.width = progress + '%';
            progressText.textContent = `अपलोड हो रहा है: ${progress.toFixed(0)}% (${transferredMB} MB of ${totalMB} MB)`;
            uploadSpeed.textContent = `${speedKBps} KB/s`;
        },
        (error) => {
            console.error("Upload failed:", error);
            progressText.textContent = 'अपलोड विफल: ' + error.message;
            progressFill.style.width = '0%';
            uploadSpeed.textContent = '';
        },
        async (downloadURL) => {
            // Firestore में metadata सहेजें
            try {
                await addDoc(collection(db, 'artifacts', appId, 'public', 'data', VIDEOS_COLLECTION), {
                    userId: userId,
                    userName: userName,
                    title: title,
                    description: description,
                    category: category,
                    url: downloadURL, // नए API से मिला URL
                    thumbnailUrl: `https://placehold.co/480x270/ff0000/fff?text=${title.substring(0, 10)}`,
                    views: 0,
                    likes: 0,
                    timestamp: new Date()
                });

                console.log('वीडियो सफलतापूर्वक अपलोड और प्रकाशित हो गया!');
                
                // UI रीसेट करें
                uploadForm.reset();
                currentFile = null;
                progressFill.style.width = '100%';
                progressText.textContent = 'अपलोड सफल!';
                uploadSpeed.textContent = 'डेटाबेस में सहेजा गया।';
                
                fileNameDisplay.textContent = 'कोई फ़ाइल नहीं चुनी गई।';
                uploadDetails.style.display = 'none';

                // 2 सेकंड बाद home page पर जाएं
                setTimeout(() => {
                    showPage('homePage');
                    // नए वीडियो लोड करें
                    loadVideos(db, appId);
                }, 2000);
                
            } catch (firestoreError) {
                console.error("Failed to save metadata to Firestore:", firestoreError);
                progressText.textContent = 'अपलोड सफल, पर डेटाबेस त्रुटि: ' + firestoreError.message;
            }
        }
    );
}

// =============================================================
// 7. VIDEO PLAYER लॉजिक
// =============================================================

async function playVideo(videoId, videoData) {
    if (!DB_SERVICE || !METUBE_APP_ID) return;

    try {
        // दृश्य गणना बढ़ाएं
        const videoDocRef = doc(DB_SERVICE, 'artifacts', METUBE_APP_ID, 'public', 'data', VIDEOS_COLLECTION, videoId);
        await updateDoc(videoDocRef, {
            views: increment(1)
        });
        videoData.views = (videoData.views || 0) + 1;
    } catch (e) {
        console.error("Error updating view count:", e);
    }
    
    // वीडियो प्लेयर सेट करें
    mainVideoPlayer.src = videoData.url;
    playerVideoTitle.textContent = videoData.title;
    playerVideoDescription.textContent = videoData.description;
    
    const uploadDate = videoData.timestamp?.toDate ? videoData.timestamp.toDate() : new Date(videoData.timestamp);
    playerVideoStats.textContent = `${formatNumber(videoData.views || 0)} दृश्य • ${formatTimeSince(uploadDate)}`;
    playerChannelName.textContent = videoData.userName || `User: ${videoData.userId?.substring(0, 10)}...`;

    // प्लेयर पेज दिखाएं
    showPage('playerPage');
    
    // वीडियो ऑटो-प्ले शुरू करें
    setTimeout(() => {
        mainVideoPlayer.play().catch(e => console.log("Auto-play blocked:", e));
    }, 500);
}

function searchVideos() {
    const query = document.getElementById('searchInput').value;
    console.log(`Searching for: ${query}`);
    // यहाँ आप search functionality जोड़ सकते हैं
    showPage('homePage');
}

// =============================================================
// 8. Initialization
// =============================================================

function initMetubeApp(appId, auth, db, storage) { 
    METUBE_APP_ID = appId;
    AUTH_SERVICE = auth;
    DB_SERVICE = db;

    // Auth listener सेट करें
    setupAuthListener(auth);
    
    // वीडियो लोड करें
    loadVideos(db, appId);
    
    // Event listeners सेट करें
    document.getElementById('selectFileBtn').addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', handleFileInputChange);

    if (uploadForm) {
        uploadForm.addEventListener('submit', (e) => uploadVideo(e, db, null, appId));
    }

    // Drag and drop functionality
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
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
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                handleFileInputChange({ target: fileInput });
            }
        });
    }

    // Global functions export
    window.playVideo = playVideo;
    window.showPage = showPage;
    window.toggleSidebar = toggleSidebar;
    window.searchVideos = searchVideos;
}

// Export functions
export { initMetubeApp, showPage, toggleSidebar, searchVideos };
