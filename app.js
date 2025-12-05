// app.js - Metube एप्लिकेशन का मुख्य लॉजिक

// =============================================================
// 1. ग्लोबल वैरिएबल्स और स्टेट
// =============================================================

// 🔥 ये ऑब्जेक्ट्स index.html से ग्लोबल रूप से उपलब्ध हैं: auth, db, storage
let currentUser = null; // वर्तमान लॉग इन उपयोगकर्ता (Firebase User Object)
let currentPage = 'homePage'; // वर्तमान सक्रिय पेज
let currentVideoData = null; // वर्तमान में चल रहे वीडियो का डेटा ऑब्जेक्ट
const VIDEOS_COLLECTION = 'videos'; // Firestore कलेक्शन का नाम
const PAGE_SIZE = 10; // एक बार में लोड होने वाले वीडियो की संख्या
let lastVisible = null; // Pagination के लिए अंतिम डॉक्यूमेंट

// UI Elements
const appContainer = document.getElementById('app');
const loadingScreen = document.getElementById('loading');
const mainContent = document.querySelector('.main-content');
const videosGrid = document.getElementById('videosGrid');

// सभी पेज एलिमेंट्स
const pages = {
    homePage: document.getElementById('homePage'),
    trendingPage: document.getElementById('trendingPage'),
    uploadPage: document.getElementById('uploadPage'),
    videoPlayerPage: document.getElementById('videoPlayerPage'),
    searchPage: document.getElementById('searchPage'),
};

// =============================================================
// 2. यूटिलिटी फ़ंक्शंस (मददगार फ़ंक्शंस)
// =============================================================

/**
 * दिनांक को पढ़ने में आसान प्रारूप में बदलता है।
 * @param {Date} date - JS Date ऑब्जेक्ट।
 * @returns {string} - प्रारूपित स्ट्रिंग (जैसे: "2 दिन पहले")।
 */
function formatDate(date) {
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
    return "कुछ सेकंड पहले";
}

/**
 * संख्या को छोटे प्रारूप में बदलता है (जैसे 12345 को 12K में)।
 * @param {number} num - संख्या।
 * @returns {string} - प्रारूपित संख्या।
 */
function formatCount(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num.toString();
}


// =============================================================
// 3. UI और नेविगेशन फ़ंक्शंस
// =============================================================

/**
 * किसी विशिष्ट पेज को दिखाता है और अन्य सभी को छुपाता है।
 * @param {string} pageId - वह पेज ID जिसे दिखाना है।
 */
function showPage(pageId) {
    if (!pages[pageId]) return;

    // पुराने सक्रिय पेज को छुपाएँ
    if (pages[currentPage]) {
        pages[currentPage].style.display = 'none';
        
        // साइडबार/बॉटम नेव में सक्रिय वर्ग हटाएँ
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
    }

    // नया सक्रिय पेज दिखाएँ
    currentPage = pageId;
    pages[pageId].style.display = 'block';
    
    // सक्रिय नेविगेशन आइटम को हाइलाइट करें
    document.querySelector(`.nav-item[onclick*="${pageId.replace('Page', '')}"]`)?.classList.add('active');
    
    // वीडियो प्लेयर को रोकें जब पेज बदल जाए
    const player = document.getElementById('videoPlayer');
    if (player && pageId !== 'videoPlayerPage') {
        player.pause();
    }
    
    // साइडबार को मोबाइल पर बंद करें (अगर वह सक्रिय है)
    document.getElementById('sidebar').classList.remove('active');
    
    // मुख्य कंटेंट को स्क्रॉल करने के लिए ऊपर ले जाएँ
    mainContent.scrollTop = 0;
}

function goHome() {
    showPage('homePage');
    // वीडियो डेटा लोड करने की ज़रूरत नहीं है क्योंकि onSnapshot पहले से चल रहा होगा
}

function goBack() {
    // अगर हम प्लेयर पेज पर हैं, तो होम पर वापस जाएँ
    if (currentPage === 'videoPlayerPage') {
        goHome();
    } else {
        // यहाँ अतिरिक्त बैक लॉजिक जोड़ा जा सकता है
        goHome();
    }
}

// =============================================================
// 4. ऑथेंटिकेशन और यूज़र मैनेजमेंट
// =============================================================

/**
 * अतिथि (Guest) के रूप में उपयोगकर्ता को साइन इन करता है।
 */
async function signInAnonymously() {
    try {
        await auth.signInAnonymously();
        console.log("अतिथि के रूप में साइन इन सफल!");
    } catch (error) {
        console.error("अतिथि साइन इन में त्रुटि:", error);
    }
}

/**
 * ऑथेंटिकेशन की स्थिति को ट्रैक करता है और UI को अपडेट करता है।
 */
function setupAuthListener() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            console.log("उपयोगकर्ता लॉग इन है:", currentUser.uid);

            // UI अपडेट करें
            document.getElementById('guestLoginBtn').style.display = 'none';
            document.getElementById('loggedUser').style.display = 'flex';
        } else {
            currentUser = null;
            console.log("उपयोगकर्ता लॉग आउट है।");

            // UI अपडेट करें
            document.getElementById('guestLoginBtn').style.display = 'flex';
            document.getElementById('loggedUser').style.display = 'none';
        }
    });
}

// =============================================================
// 5. वीडियो डेटा लोडिंग और रेंडरिंग (होम पेज)
// =============================================================

/**
 * वीडियो कार्ड के लिए HTML बनाता है।
 * @param {Object} video - Firestore से वीडियो डेटा।
 * @returns {string} - वीडियो कार्ड HTML स्ट्रिंग।
 */
function renderVideoCard(video) {
    const uploadTime = formatDate(video.timestamp.toDate());
    const views = formatCount(video.views);
    const likes = formatCount(video.likes);

    return `
        <div class="video-card" onclick="playVideo('${video.id}')">
            <div class="thumbnail-container">
                <img src="${video.thumbnailUrl || 'https://placehold.co/320x180/ff0000/fff?text=Metube+Video'}" 
                     alt="${video.title}" 
                     class="video-thumbnail">
                <span class="video-duration">12:34</span> <!-- यह डायनामिक नहीं है, सिर्फ़ UI के लिए -->
            </div>
            <div class="video-details">
                <img src="assets/default-avatar.jpg" alt="Channel Avatar" class="channel-avatar-sm">
                <div class="meta-info">
                    <h3 class="video-title-sm">${video.title}</h3>
                    <p class="channel-name-sm">${video.channelName || 'Metube Channel'}</p>
                    <p class="stats-sm">
                        ${views} व्यूज़ 
                        <span class="dot">·</span> 
                        ${uploadTime} 
                        <span class="dot">·</span> 
                        ${likes} लाइक्स
                    </p>
                </div>
            </div>
        </div>
    `;
}

/**
 * Firestore से वीडियो डेटा को रियल-टाइम में लोड करता है।
 * यह onSnapshot का उपयोग करता है, इसलिए डेटा बदलने पर होम पेज अपने आप अपडेट हो जाएगा।
 */
function loadVideos() {
    // 'timestamp' के आधार पर सबसे नए वीडियो को ऑर्डर करें
    const videosQuery = db.collection(VIDEOS_COLLECTION)
        .orderBy('timestamp', 'desc');

    // onSnapshot डेटा में रियल-टाइम बदलावों को सुनता है
    videosQuery.onSnapshot((snapshot) => {
        // अगर यह पहली बार लोड हो रहा है, तो grid को साफ़ करें
        if (videosGrid.innerHTML.includes("वीडियो लोड करने का लॉजिक")) {
             videosGrid.innerHTML = '';
        }
        
        if (snapshot.empty) {
            videosGrid.innerHTML = '<p class="text-center w-full text-lg text-gray-500 mt-10">अभी कोई वीडियो उपलब्ध नहीं है। अपलोड करने वाले पहले बनें!</p>';
            return;
        }

        // हम केवल उन डॉक्यूमेंट्स में बदलावों को प्रोसेस करते हैं जो बदल गए हैं
        snapshot.docChanges().forEach((change) => {
            const videoData = { id: change.doc.id, ...change.doc.data() };
            const videoElementId = `video-${videoData.id}`;
            let videoElement = document.getElementById(videoElementId);

            if (change.type === 'added') {
                // नया वीडियो जोड़ा गया
                const newCard = document.createElement('div');
                newCard.id = videoElementId;
                newCard.innerHTML = renderVideoCard(videoData);
                // इसे ग्रिड में सबसे ऊपर जोड़ें (क्योंकि यह नया है और 'desc' ऑर्डर में है)
                videosGrid.prepend(newCard); 
            } else if (change.type === 'modified') {
                // वीडियो अपडेट हुआ (जैसे लाइक काउंट)
                if (videoElement) {
                    videoElement.innerHTML = renderVideoCard(videoData);
                }
            } else if (change.type === 'removed') {
                // वीडियो हटा दिया गया
                if (videoElement) {
                    videoElement.remove();
                }
            }
        });
        
        // लोडिंग मैसेज को हटा दें यदि कोई हो
        document.querySelector('.loading-videos')?.remove();
    }, (error) => {
        console.error("वीडियो लोड करने में त्रुटि:", error);
        videosGrid.innerHTML = '<p class="text-center w-full text-red-500 mt-10">वीडियो लोड करने में त्रुटि आई।</p>';
    });
}


// =============================================================
// 6. वीडियो अपलोड लॉजिक (Storage & Firestore)
// =============================================================

const videoFileInput = document.getElementById('videoFileInput');
const selectFileBtn = document.getElementById('selectFileBtn');
const uploadForm = document.getElementById('uploadForm');
const uploadArea = document.getElementById('uploadArea');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const uploadSubmitBtn = document.getElementById('uploadSubmitBtn');

let selectedVideoFile = null;

// फ़ाइल चुनने के लिए बटन क्लिक
selectFileBtn.addEventListener('click', () => {
    videoFileInput.click();
});

// जब फ़ाइल चुनी जाती है
videoFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('video/')) {
        selectedVideoFile = file;
        // अपलोड एरिया को छुपाएँ और फॉर्म दिखाएँ
        uploadArea.style.display = 'none';
        uploadForm.style.display = 'block';
        document.getElementById('videoTitle').value = file.name.split('.')[0];
        console.log(`वीडियो चुना गया: ${file.name}`);
    } else {
        alert("कृपया एक वैध वीडियो फ़ाइल चुनें।");
        selectedVideoFile = null;
    }
});

// अपलोड शुरू करने के लिए बटन
uploadSubmitBtn.addEventListener('click', uploadVideo);

/**
 * वीडियो को Firebase Storage में अपलोड करता है और डेटा को Firestore में सेव करता है।
 */
async function uploadVideo() {
    if (!selectedVideoFile || !currentUser) {
        alert("अपलोड करने से पहले एक वीडियो चुनें और सुनिश्चित करें कि आप लॉग इन हैं।");
        return;
    }

    const title = document.getElementById('videoTitle').value.trim();
    const description = document.getElementById('videoDescription').value.trim();
    const category = document.getElementById('videoCategory').value;

    if (!title) {
        alert("कृपया वीडियो का टाइटल भरें।");
        return;
    }
    
    // UI अपडेट: फॉर्म को छुपाएँ और प्रोग्रेस बार दिखाएँ
    uploadForm.style.display = 'none';
    uploadProgress.style.display = 'block';
    
    // 1. Storage में वीडियो अपलोड करें
    const videoRef = storage.ref(`videos/${currentUser.uid}/${Date.now()}_${selectedVideoFile.name}`);
    const uploadTask = videoRef.put(selectedVideoFile);

    // प्रोग्रेस को ट्रैक करें
    uploadTask.on('state_changed', 
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            progressFill.style.width = progress + '%';
            progressText.textContent = `${Math.round(progress)}% अपलोड हुआ`;
        }, 
        (error) => {
            // अपलोड में त्रुटि
            console.error("वीडियो अपलोड में त्रुटि:", error);
            alert("अपलोड असफल रहा: " + error.message);
            // UI को वापस फॉर्म पर लाएँ
            uploadProgress.style.display = 'none';
            uploadForm.style.display = 'block';
        }, 
        async () => {
            // अपलोड सफल
            try {
                // 2. वीडियो का डाउनलोड URL प्राप्त करें
                const videoURL = await uploadTask.snapshot.ref.getDownloadURL();
                
                // 3. (Demo) थंबनेल URL सेट करें
                // वास्तविक ऐप में, आपको थंबनेल अपलोड करना होगा। यहाँ हम एक प्लेसहोल्डर URL का उपयोग कर रहे हैं।
                const thumbnailUrl = `https://placehold.co/320x180/ff0000/fff?text=${encodeURIComponent(title)}`;

                // 4. Firestore में वीडियो डेटा सेव करें
                await db.collection(VIDEOS_COLLECTION).add({
                    title: title,
                    description: description,
                    category: category,
                    videoUrl: videoURL,
                    thumbnailUrl: thumbnailUrl,
                    channelId: currentUser.uid,
                    channelName: 'Metube User ' + currentUser.uid.substring(0, 5), // डेमो नाम
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    views: 0,
                    likes: 0,
                    dislikes: 0,
                });

                console.log("वीडियो डेटा Firestore में सेव किया गया!");
                alert("वीडियो सफलतापूर्वक अपलोड किया गया!");
                
                // UI रीसेट करें और होम पर वापस जाएँ
                goHome();
                resetUploadForm();

            } catch (error) {
                console.error("Firestore में डेटा सेव करने में त्रुटि:", error);
                alert("वीडियो अपलोड हो गया, लेकिन डेटा सेव करने में त्रुटि आई।");
                resetUploadForm();
            }
        }
    );
}

/**
 * अपलोड फॉर्म को उसकी मूल स्थिति में रीसेट करता है।
 */
function resetUploadForm() {
    selectedVideoFile = null;
    videoFileInput.value = '';
    document.getElementById('videoTitle').value = '';
    document.getElementById('videoDescription').value = '';
    
    uploadForm.style.display = 'none';
    uploadProgress.style.display = 'none';
    uploadArea.style.display = 'flex';
    progressFill.style.width = '0%';
    progressText.textContent = '0% अपलोड हुआ';
}

// अपलोड रद्द करने के लिए बटन
document.getElementById('cancelUploadBtn').addEventListener('click', resetUploadForm);


// =============================================================
// 7. वीडियो प्लेयर और इंटरैक्शन लॉजिक
// =============================================================

/**
 * वीडियो प्लेयर पेज पर नेविगेट करता है और वीडियो डेटा लोड करता है।
 * @param {string} videoId - वह वीडियो ID जिसे प्ले करना है।
 */
async function playVideo(videoId) {
    if (!videoId) return;

    try {
        const videoDoc = await db.collection(VIDEOS_COLLECTION).doc(videoId).get();
        if (!videoDoc.exists) {
            alert("क्षमा करें, यह वीडियो अब उपलब्ध नहीं है।");
            return;
        }

        currentVideoData = { id: videoDoc.id, ...videoDoc.data() };
        
        // 1. UI को अपडेट करें और पेज दिखाएँ
        showPage('videoPlayerPage');

        // 2. वीडियो प्लेयर अपडेट करें
        const player = document.getElementById('videoPlayer');
        player.src = currentVideoData.videoUrl;
        player.load(); // नया वीडियो लोड करें
        player.play(); // ऑटो प्ले (अगर ब्राउज़र अनुमति देता है)

        // 3. जानकारी अपडेट करें
        document.getElementById('playerVideoTitle').textContent = currentVideoData.title;
        document.getElementById('viewsCount').textContent = formatCount(currentVideoData.views || 0) + ' व्यूज़';
        document.getElementById('uploadDate').textContent = formatDate(currentVideoData.timestamp.toDate());
        document.getElementById('likeCount').textContent = formatCount(currentVideoData.likes || 0);
        document.getElementById('dislikeCount').textContent = formatCount(currentVideoData.dislikes || 0);
        document.getElementById('channelName').textContent = currentVideoData.channelName;
        document.getElementById('videoDescriptionText').textContent = currentVideoData.description || 'कोई विवरण नहीं दिया गया है।';

        // 4. व्यू काउंट को अपडेट करें (Firestore में)
        // हम हर बार पेज लोड होने पर व्यूज को 1 से बढ़ाते हैं
        db.collection(VIDEOS_COLLECTION).doc(videoId).update({
            views: firebase.firestore.FieldValue.increment(1)
        });

    } catch (error) {
        console.error("वीडियो प्ले करने में त्रुटि:", error);
        alert("वीडियो लोड करने में समस्या आई।");
        goHome();
    }
}

/**
 * वीडियो पर 'लाइक' अपडेट करता है।
 */
async function likeVideo() {
    if (!currentVideoData) return;
    if (!currentUser) {
        alert("लाइक करने के लिए पहले लॉगिन (अतिथि के रूप में) करें!");
        return;
    }

    const videoRef = db.collection(VIDEOS_COLLECTION).doc(currentVideoData.id);

    try {
        // Firestore ट्रांजैक्शन का उपयोग करें ताकि मल्टीपल लाइक्स एक साथ न हों
        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(videoRef);
            if (!doc.exists) {
                throw "वीडियो मौजूद नहीं है!";
            }
            
            // लाइक की संख्या को 1 से बढ़ाएँ
            const newLikes = (doc.data().likes || 0) + 1;
            transaction.update(videoRef, { likes: newLikes });

            // UI में तुरंत अपडेट करें (Real-time update onSnapshot से भी आएगा)
            document.getElementById('likeCount').textContent = formatCount(newLikes);
        });

        console.log("वीडियो लाइक किया गया!");

    } catch (error) {
        console.error("लाइक अपडेट करने में त्रुटि:", error);
        alert("लाइक अपडेट करने में समस्या आई।");
    }
}

// Like बटन पर इवेंट लिसनर जोड़ें (अगर यह वीडियो प्लेयर पेज पर है)
document.querySelector('.like-btn')?.addEventListener('click', likeVideo);

// (Demo) Dislike, Share, Download फ़ंक्शंस
function dislikeVideo() { console.log("डिसलाइक फ़ंक्शन (कार्यान्वयन बाकी)"); }
function shareVideo() { alert("लिंक कॉपी हो गया! (डेमो)"); }
function downloadVideo() { alert("डाउनलोड फ़ंक्शन (कार्यान्वयन बाकी)"); }


// =============================================================
// 8. Initialization (एप्लिकेशन शुरू करना)
// =============================================================

/**
 * एप्लिकेशन को शुरू करने के लिए मुख्य फ़ंक्शन
 */
function initializeApp() {
    // 1. ऑथेंटिकेशन लिसनर सेट करें
    setupAuthListener();

    // 2. होम पेज के वीडियो लोड करें (onSnapshot इसे रियल-टाइम में हैंडल करेगा)
    loadVideos(); 

    // 3. लोडिंग स्क्रीन को छुपाएँ और ऐप दिखाएँ
    loadingScreen.style.display = 'none';
    appContainer.style.display = 'grid'; // CSS ग्रिड लेआउट के लिए

    // 4. बटन इवेंट्स जोड़ें (जो HTML में सीधे नहीं जुड़े हैं)
    document.getElementById('guestLoginBtn').addEventListener('click', signInAnonymously);
    document.getElementById('uploadBtn').addEventListener('click', showUpload);

    // अन्य नेविगेशन बटन इवेंट्स
    document.getElementById('menuBtn').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('active');
    });
}

// यह सुनिश्चित करता है कि DOM पूरी तरह से लोड हो जाने पर `initializeApp` को कॉल किया जाए
window.onload = initializeApp;

