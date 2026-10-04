// @ts-nocheck

// --- THEME TOGGLE LOGIC (TERANG / GELAP) ---  
document.addEventListener("DOMContentLoaded", () => {
    const themeBtn = document.getElementById("themeToggleBtn");
    const body = document.body;

    const currentTheme = localStorage.getItem("app_theme");
    if (currentTheme === "light") {
        body.classList.add("light-theme");
        if (themeBtn) themeBtn.innerHTML = "🌙 Beralih ke Mode Gelap";
    }

    if (themeBtn) {
        themeBtn.addEventListener("click", () => {
            body.classList.toggle("light-theme");
            
            if (body.classList.contains("light-theme")) {
                themeBtn.innerHTML = "🌙 Beralih ke Mode Gelap";
                localStorage.setItem("app_theme", "light");
            } else {
                themeBtn.innerHTML = "☀️ Beralih ke Mode Terang";
                localStorage.setItem("app_theme", "dark");
            }
        });
    }
});

// --- VARIABEL CHAT & STATE ---
let activeChatUser = null;
let activeGroup = null; 
let currentChatInterval = null;
let chatListInterval = null; 
let lastPrivateChatDataJson = "";
let lastOtherReadTime = 0;
let lastGroupChatDataJson = "";
let lastGroupReadTimestampsStr = "";

// --- WHATSAPP CHECKMARK HELPER (Rapat & Kontras) ---
function getWhatsAppCheckmark(isRead, isInsideBlueBubble = false) {
    let color;
    if (isInsideBlueBubble) {
        color = isRead ? "#53bdeb" : "rgba(255, 255, 255, 0.6)"; 
    } else {
        color = isRead ? "#53bdeb" : "#8696a7"; 
    }
    return `<span style="display: inline-block; position: relative; width: 13px; height: 10px; margin-left: 4px; vertical-align: baseline;">
        <i class="fa-solid fa-check" style="position: absolute; left: 0; top: 0; font-size: 0.75em; color: ${color};"></i>
        <i class="fa-solid fa-check" style="position: absolute; left: 4px; top: 0; font-size: 0.75em; color: ${color};"></i>
    </span>`;
}

// --- NAVIGATION LOGIC (DROPDOWN MENU) ---  
function toggleMenu() {
    document.getElementById('dropdown-menu').classList.toggle('active');
}

function handleMenuClick(index, viewId) {
    switchTab(index, viewId);
    toggleMenu(); // Tutup dropdown otomatis setelah menu ditekan
}

function switchTab(index, viewId) {  
    // Sembunyikan semua tampilan view
    document.querySelectorAll('.view').forEach(view => {  
        view.classList.remove('active');  
    });  

    // Munculkan tampilan yang dituju
    const targetView = document.getElementById(viewId);  
    if (targetView) {  
        targetView.classList.add('active');  
    }  

    // Sembunyikan header atas jika masuk ke layar kuis, hasil, atau chat pribadi
    if (viewId === 'view-quiz' || viewId === 'view-result' || viewId === 'view-private-room' || viewId === 'view-call') {  
        document.getElementById('top-header').style.display = 'none';  
    } else {  
        document.getElementById('top-header').style.display = 'flex';  
    }  

    // Hentikan interval chat jika keluar dari menu chat pribadi
    if (viewId !== 'view-private-room' && currentChatInterval) {
        clearInterval(currentChatInterval);
        currentChatInterval = null;
    }

    // Hentikan interval daftar kontak jika keluar dari menu chat
    if (viewId !== 'view-chat' && chatListInterval) {
        clearInterval(chatListInterval);
        chatListInterval = null;
    }

    // Jalankan pemuatan histori jika tab Histori dibuka
    if (viewId === 'view-history') {  
        loadHistoryView();  
    }  

    // Jalankan pemuatan chat jika tab Chat dibuka
    if (viewId === 'view-chat') {  
        loadChatUsersList();  
        if (!chatListInterval) {
            chatListInterval = setInterval(loadChatUsersList, 1500);
        }
    }  
}


// --- AUTHENTICATION ---  
let isRegisterMode = false; 
let currentUser = localStorage.getItem('sinau_active_user') || null;  
const FIREBASE_USERS_URL = "https://sinaubang-web-a5069-default-rtdb.asia-southeast1.firebasedatabase.app/users.json";  
const FIREBASE_SKOR_URL = "https://sinaubang-web-a5069-default-rtdb.asia-southeast1.firebasedatabase.app/skor.json";  

window.addEventListener('DOMContentLoaded', () => {  
    if (currentUser) {  
        document.getElementById('view-auth').style.display = 'none';  
        document.getElementById('profile-name-display').innerText = currentUser;  
        switchTab(0, 'view-dashboard', '<i class=\'fa-solid fa-house\'></i>');  
    } else { 
        document.getElementById('view-auth').style.display = 'flex'; 
    }  
});  

function switchAuthMode(mode) {  
    isRegisterMode = (mode === 'register');  
    document.getElementById('auth-title').innerText = isRegisterMode ? "Daftar Akun" : "Masuk Akun";  
    document.getElementById('auth-main-btn').innerText = isRegisterMode ? "Daftar & Masuk" : "Masuk";  
}  

async function handleAuth() {  
    const u = document.getElementById('auth-user').value.trim(); 
    const p = document.getElementById('auth-pass').value.trim();  
    if(!u || !p) { alert("Data tidak boleh kosong!"); return; }  
    
    let btn = document.getElementById('auth-main-btn'); 
    btn.innerText = "Memproses..."; btn.disabled = true;  
    
    try {  
        let res = await fetch(FIREBASE_USERS_URL); 
        let usersDB = await res.json() || {};  
        
        if (isRegisterMode) {  
            if (usersDB[u]) { alert("Username terpakai!"); btn.innerText = "Daftar & Masuk"; btn.disabled = false; return; }  
            await fetch(`https://sinaubang-web-a5069-default-rtdb.asia-southeast1.firebasedatabase.app/users/${u}.json`, { 
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: p }) 
            });  
        } else {  
            if (!usersDB[u] || usersDB[u].password !== p) { alert("Username/password salah!"); btn.innerText = "Masuk"; btn.disabled = false; return; }  
        }  
        
        currentUser = u; localStorage.setItem('sinau_active_user', currentUser);  

        // --- MATIKAN MUSIK LOGIN & MULAI MUSIK UTAMA ---
const loginAudio = document.getElementById('login-audio');

if (loginAudio) {
    loginAudio.pause();
    loginAudio.currentTime = 0;
}

// Mulai musik utama setelah berhasil login
if (bgMusic) {
    bgMusic.volume = 0.35;

    bgMusic.play().then(() => {
        isMusicPlaying = true;
    }).catch(error => {
        console.log("Musik utama belum bisa diputar:", error);
    });
}
// -----------------------------------------------
        // ---------------------------------

        document.getElementById('view-auth').style.display = 'none';  
        document.getElementById('profile-name-display').innerText = currentUser;  
        switchTab(0, 'view-dashboard', '<i class=\'fa-solid fa-house\'></i>');  
    } catch (error) { 
        alert("Koneksi gagal."); 
    } finally { 
        btn.innerText = isRegisterMode ? "Daftar & Masuk" : "Masuk"; btn.disabled = false; 
    }  
}  


function logoutUser() { 
    if(confirm("Keluar?")) { localStorage.removeItem('sinau_active_user'); location.reload(); } 
}  

function toggleFolder(folderId, headerElement) {
    const folder = document.getElementById(folderId);
    const chevron = headerElement.querySelector('.chevron');

    if (folder.classList.contains('active')) {
        // TUTUP
        folder.classList.remove('active');
        chevron.classList.remove('active');
        
        // Hapus batasan inline style agar kembali mengikuti max-height: 0 dari CSS
        folder.style.maxHeight = null;
    } else {
        // BUKA
        folder.classList.add('active');
        chevron.classList.add('active');
        
        // Hapus batasan statis dari JS dan biarkan CSS yang mengatur tinggi fleksibel
        folder.style.maxHeight = null;
    }
}


// --- MUSIC PLAYER LOGIC (MULTI-TRACK WITH TOGGLE) ---  
let isMusicPlaying = false; 
let currentTrackIndex = null;
const bgMusic = document.getElementById('bg-music');  

if (bgMusic) {
    bgMusic.onended = () => {
        isMusicPlaying = false;
        if (currentTrackIndex !== null) {
            const btn = document.getElementById(`btn-play-${currentTrackIndex}`);
            if (btn) btn.innerHTML = "Putar ▶";
        }
        currentTrackIndex = null;
    };
}

function playSelectedTrack(src, index) {  
    const btn = document.getElementById(`btn-play-${index}`);
    const audioSource = document.getElementById('audio-source');

    // Jika lagu yang sama sedang diputar -> jeda
    if (isMusicPlaying && currentTrackIndex === index) {
        bgMusic.pause();
        isMusicPlaying = false;
        if (btn) btn.innerHTML = "Putar ▶";
        return;
    }

    // Jika lagu lain sedang diputar -> reset tombol lagu sebelumnya
    if (currentTrackIndex !== null && currentTrackIndex !== index) {
        const prevBtn = document.getElementById(`btn-play-${currentTrackIndex}`);
        if (prevBtn) prevBtn.innerHTML = "Putar ▶";
    }

    // Ganti audio source dan putar lagu baru (dengan encodeURI agar aman)
    const encodedSrc = encodeURI(src);
    if (audioSource && (audioSource.getAttribute('src') !== encodedSrc)) {
        audioSource.src = encodedSrc; 
        bgMusic.load();  
    }

    bgMusic.play().then(() => { 
        isMusicPlaying = true; 
        currentTrackIndex = index;
        if (btn) btn.innerHTML = "Jeda ⏸"; 
    }).catch(e => {
        console.log("Audio play error:", e);
        alert(`File audio tidak ditemukan. Pastikan kamu sudah upload lagu tersebut di GitHub-mu!`);
    });  
}

// --- CALL SYSTEM (SIMULASI PANGGILAN) ---
let activeCallInterval = null;
let callDurationSeconds = 0;
let isMicMuted = false;
let isCameraOff = false;

function startCall(isVideo = false) {
    const targetName = activeGroup ? "Grup Diskusi Sinau Bang" : activeChatUser;
    if (!targetName) return;

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-call').classList.add('active');

    document.getElementById('call-target-name').innerText = targetName;
    document.getElementById('call-type-label').innerText = isVideo ? "Memanggil (Video Call)..." : "Memanggil (Voice Call)...";
    document.getElementById('call-avatar').src = activeGroup ? `https://ui-avatars.com/api/?name=Grup&background=0284c7&color=fff&bold=true` : getAvatarUrl(targetName);
    
    const videoContainer = document.getElementById('video-stream-container');
    if (isVideo) {
        videoContainer.style.display = 'block';
    } else {
        videoContainer.style.display = 'none';
    }

    callDurationSeconds = 0;
    isMicMuted = false;
    isCameraOff = false;
    document.getElementById('mic-btn-icon').className = "fa-solid fa-microphone";
    document.getElementById('video-btn-icon').className = "fa-solid fa-video";

    setTimeout(() => {
        document.getElementById('call-type-label').innerText = "Menyambungkan...";
        setTimeout(() => {
            document.getElementById('call-type-label').innerText = "00:00";
            if (activeCallInterval) clearInterval(activeCallInterval);
            activeCallInterval = setInterval(() => {
                callDurationSeconds++;
                let mins = Math.floor(callDurationSeconds / 60).toString().padStart(2, '0');
                let secs = (callDurationSeconds % 60).toString().padStart(2, '0');
                document.getElementById('call-type-label').innerText = `${mins}:${secs}`;
            }, 1000);
        }, 1500);
    }, 2000);
}

function endCall() {
    if (activeCallInterval) {
        clearInterval(activeCallInterval);
        activeCallInterval = null;
    }
    if (activeGroup) {
        openGroupChat(activeGroup, "Grup Diskusi Sinau Bang");
    } else if (activeChatUser) {
        openPrivateChat(activeChatUser);
    } else {
        switchTab(1, 'view-chat', '<i class=\'fa-solid fa-message\'></i>');
    }
}

function toggleMuteMic() {
    isMicMuted = !isMicMuted;
    const icon = document.getElementById('mic-btn-icon');
    icon.className = isMicMuted ? "fa-solid fa-microphone-slash" : "fa-solid fa-microphone";
}

function toggleVideoCamera() {
    isCameraOff = !isCameraOff;
    const icon = document.getElementById('video-btn-icon');
    icon.className = isCameraOff ? "fa-solid fa-video-slash" : "fa-solid fa-video";
    const videoBox = document.getElementById('video-stream-container');
    videoBox.style.opacity = isCameraOff ? "0.2" : "1";
}


// --- REAL-TIME PRIVATE & GROUP CHAT SYSTEM ---  
function getAvatarUrl(name) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&bold=true`;
}

function getRoomId(user1, user2) {
    return [user1, user2].sort().join('_');
}

async function loadChatUsersList() {  
    const activeUsersList = document.getElementById('active-users-list');  
    const recentChatList = document.getElementById('chat-recent-list');  
      
    if (activeUsersList && activeUsersList.innerHTML.trim() === "") {
        activeUsersList.innerHTML = `  
            <div class="active-user-item">  
                <div class="avatar-wrapper new-chat"><i class="fa-solid fa-plus"></i></div>  
                <span>New</span>  
            </div>  
        `;  
    }

    try {  
        let res = await fetch(FIREBASE_USERS_URL);  
        let usersDB = await res.json() || {};  
          
        let otherUsers = Object.keys(usersDB).filter(u => u !== currentUser);  
        let chatItems = [];
        let totalUnreadGlobal = 0;

        const groupId = "grup_diskusi_umum";
        const groupName = "Grup Diskusi Sinau Bang";
        let groupMetaRes = await fetch(`https://sinaubang-web-a5069-default-rtdb.asia-southeast1.firebasedatabase.app/group_meta/${groupId}.json`);
        let groupMeta = await groupMetaRes.json() || { lastMessage: "Ketuk untuk gabung diskusi grup...", time: "", lastSender: "", timestamp: 0 };
        
        let groupMsgRes = await fetch(`https://sinaubang-web-a5069-default-rtdb.asia-southeast1.firebasedatabase.app/group_chats/${groupId}.json`);
        let groupMsgsData = await groupMsgRes.json() || {};
        
        let groupMaxTimestamp = groupMeta.timestamp || 0;
        Object.values(groupMsgsData).forEach(m => {
            if ((m.timestamp || 0) > groupMaxTimestamp) {
                groupMaxTimestamp = m.timestamp || 0;
            }
        });

        let groupReadTimestamps = groupMeta.lastReadTimestamps || {};
        let groupLastReadUser = groupReadTimestamps[currentUser] || 0;
        let isGroupUnread = false;
        Object.values(groupMsgsData).forEach(m => {
            if (m.sender !== currentUser && (m.timestamp || 0) > groupLastReadUser) {
                isGroupUnread = true;
                totalUnreadGlobal++;
            }
        });

        let isGroupMsgRead = false;
        Object.keys(groupReadTimestamps).forEach(u => {
            if (u !== currentUser && groupReadTimestamps[u] >= (groupMeta.timestamp || 0)) {
                isGroupMsgRead = true;
            }
        });

        chatItems.push({
            isGroup: true,
            groupId,
            groupName,
            avatarPath: `https://ui-avatars.com/api/?name=Grup&background=0284c7&color=fff&bold=true`,
            meta: groupMeta,
            maxTimestamp: groupMaxTimestamp,
            unreadCount: isGroupUnread ? 1 : 0,
            isUnread: isGroupUnread,
            isRead: isGroupMsgRead
        });

        for (let user of otherUsers) {  
            const avatarPath = getAvatarUrl(user);  
            const roomId = getRoomId(currentUser, user);
            
            let metaRes = await fetch(`https://sinaubang-web-a5069-default-rtdb.asia-southeast1.firebasedatabase.app/chat_meta/${roomId}.json`);
            let meta = await metaRes.json() || { lastMessage: "Ketuk untuk mulai obrolan...", time: "", lastSender: "", timestamp: 0 };

            let msgRes = await fetch(`https://sinaubang-web-a5069-default-rtdb.asia-southeast1.firebasedatabase.app/private_chats/${roomId}.json`);
            let msgsData = await msgRes.json() || {};

            let lastReadTime = (meta.lastReadTimestamps && meta.lastReadTimestamps[currentUser]) || 0;
            let otherReadTime = (meta.lastReadTimestamps && meta.lastReadTimestamps[user]) || 0;
            let unreadCount = 0;
            let maxTimestamp = meta.timestamp || 0;

            Object.values(msgsData).forEach(m => {
                if ((m.timestamp || 0) > maxTimestamp) {
                    maxTimestamp = m.timestamp || 0;
                }
                if (m.sender !== currentUser && (m.timestamp || 0) > lastReadTime) {
                    unreadCount++;
                    totalUnreadGlobal++;
                }
            });

            let isMsgRead = (meta.timestamp || 0) <= otherReadTime;

            chatItems.push({
                isGroup: false,
                user,
                avatarPath,
                meta,
                unreadCount,
                maxTimestamp,
                isUnread: unreadCount > 0,
                isRead: isMsgRead
            });
        }  

        chatItems.sort((a, b) => b.maxTimestamp - a.maxTimestamp);

        // Update Notification Bell Badge in Header
        const bellBadge = document.getElementById('global-bell-badge');
        if (bellBadge) {
            if (totalUnreadGlobal > 0) {
                bellBadge.style.display = 'flex';
                bellBadge.innerText = totalUnreadGlobal;
            } else {
                bellBadge.style.display = 'none';
            }
        }

        let activeUsersHTML = `  
            <div class="active-user-item" onclick="openGroupChat('${groupId}', '${groupName}')">  
                <div class="avatar-wrapper online" style="border: 2px solid var(--theme-accent);">  
                    <img src="https://ui-avatars.com/api/?name=Grup&background=0284c7&color=fff&bold=true" alt="Grup">  
                </div>  
                <span>Grup</span>  
            </div>  
        `;

        for (let user of otherUsers) {
            activeUsersHTML += `  
                <div class="active-user-item" onclick="openPrivateChat('${user}')">  
                    <div class="avatar-wrapper online">  
                        <img src="${getAvatarUrl(user)}" alt="${user}">  
                        <div class="online-dot"></div>  
                    </div>  
                    <span>${user}</span>  
                </div>  
            `;  
        }

        let recentChatHTML = '';
        for (let item of chatItems) {
            let checkIcon = getWhatsAppCheckmark(item.isRead, false);
            
            if (item.isGroup) {
                let previewText = item.meta.lastMessage || "Ketuk untuk gabung diskusi grup...";
                if (item.meta.lastSender === currentUser) {
                    previewText = `${checkIcon} ${item.meta.lastMessage || ''}`; 
                }
                let badgeHTML = item.isUnread ? `<div class="unread-badge">1</div>` : '';
                recentChatHTML += `  
                    <div class="chat-list-item" onclick="openGroupChat('${item.groupId}', '${item.groupName}')">  
                        <div class="avatar-wrapper" style="width: 50px; height: 50px; margin-bottom: 0; flex-shrink: 0;">  
                            <img src="${item.avatarPath}" alt="${item.groupName}">  
                        </div>  
                        <div class="chat-list-info">  
                            <div class="chat-list-name"><i class="fa-solid fa-users" style="color:var(--theme-accent); margin-right:5px;"></i> ${item.groupName}</div>  
                            <div class="chat-list-msg">${previewText}</div>  
                        </div>  
                        <div class="chat-list-meta">  
                            <span>${item.meta.time || ''}</span>  
                            ${badgeHTML}
                        </div>  
                    </div>  
                `;  
            } else {
                let previewText = item.meta.lastMessage || "Ketuk untuk mulai obrolan...";
                if (item.meta.lastSender === currentUser) {
                    previewText = `${checkIcon} ${item.meta.lastMessage || ''}`; 
                }
                let badgeHTML = item.isUnread ? `<div class="unread-badge">${item.unreadCount}</div>` : '';
                recentChatHTML += `  
                    <div class="chat-list-item" onclick="openPrivateChat('${item.user}')">  
                        <div class="avatar-wrapper" style="width: 50px; height: 50px; margin-bottom: 0; flex-shrink: 0;">  
                            <img src="${item.avatarPath}" alt="${item.user}">  
                        </div>  
                        <div class="chat-list-info">  
                            <div class="chat-list-name">${item.user}</div>  
                            <div class="chat-list-msg">${previewText}</div>  
                        </div>  
                        <div class="chat-list-meta">  
                            <span style="font-weight: ${item.isUnread ? '700' : 'normal'}; color: ${item.isUnread ? '#22c55e' : 'inherit'};">${item.meta.time || ''}</span>  
                            ${badgeHTML}  
                        </div>  
                    </div>  
                `;  
            }
        }  

        if (activeUsersList) activeUsersList.innerHTML = activeUsersHTML;
        if (recentChatList) recentChatList.innerHTML = recentChatHTML;

    } catch (error) {  
        console.error("Gagal memuat kontak", error);  
    }  
}  

function openPrivateChat(targetUser) {  
    activeChatUser = targetUser;  
    activeGroup = null;  
    lastPrivateChatDataJson = ""; 
    lastOtherReadTime = 0;
    
    const roomId = getRoomId(currentUser, targetUser);
    const META_URL = `https://sinaubang-web-a5069-default-rtdb.asia-southeast1.firebasedatabase.app/chat_meta/${roomId}.json`;
    
    try {
        fetch(META_URL).then(res => res.json()).then(metaData => {
            if (!metaData) metaData = {};
            if (!metaData.lastReadTimestamps) metaData.lastReadTimestamps = {};
            metaData.lastReadTimestamps[currentUser] = Date.now();
            fetch(META_URL, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(metaData)
            });
        });
    } catch(e){}

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));  
    document.getElementById('view-private-room').classList.add('active');  
      
    document.getElementById('private-chat-name').innerText = targetUser;  
    document.getElementById('private-chat-avatar').src = getAvatarUrl(targetUser);  
    document.getElementById('bottom-nav').style.display = 'none';  
      
    loadPrivateMessages();  
      
    if(currentChatInterval) clearInterval(currentChatInterval);  
    currentChatInterval = setInterval(loadPrivateMessages, 1000);  
}  

function openGroupChat(groupId, groupName) {
    activeGroup = groupId;
    activeChatUser = null;  
    lastGroupChatDataJson = "";
    lastGroupReadTimestampsStr = "";
    
    const META_URL = `https://sinaubang-web-a5069-default-rtdb.asia-southeast1.firebasedatabase.app/group_meta/${groupId}.json`;
    try {
        fetch(META_URL).then(res => res.json()).then(metaData => {
            if (!metaData) metaData = {};
            if (!metaData.lastReadTimestamps) metaData.lastReadTimestamps = {};
            metaData.lastReadTimestamps[currentUser] = Date.now();
            fetch(META_URL, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(metaData)
            });
        });
    } catch(e){}

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));  
    document.getElementById('view-private-room').classList.add('active');  
      
    document.getElementById('private-chat-name').innerText = groupName;  
    document.getElementById('private-chat-avatar').src = `https://ui-avatars.com/api/?name=Grup&background=0284c7&color=fff&bold=true`;  
    document.getElementById('bottom-nav').style.display = 'none';  
      
    loadPrivateMessages();  
      
    if(currentChatInterval) clearInterval(currentChatInterval);  
    currentChatInterval = setInterval(loadPrivateMessages, 1000);  
}

async function loadPrivateMessages() {  
    if (activeGroup) {
        await loadGroupMessages();
    } else if (activeChatUser) {
        await loadUserPrivateMessages();
    }
}  

async function loadUserPrivateMessages() {
    const roomId = getRoomId(currentUser, activeChatUser);
    const PRIVATE_URL = `https://sinaubang-web-a5069-default-rtdb.asia-southeast1.firebasedatabase.app/private_chats/${roomId}.json`;  
    const META_URL = `https://sinaubang-web-a5069-default-rtdb.asia-southeast1.firebasedatabase.app/chat_meta/${roomId}.json`;
    const chatBox = document.getElementById('private-messages-box');  
    
    try {  
        let [resMsg, resMeta] = await Promise.all([
            fetch(PRIVATE_URL),
            fetch(META_URL)
        ]);
        let data = await resMsg.json();  
        let meta = await resMeta.json() || {};
        let otherReadTime = (meta.lastReadTimestamps && meta.lastReadTimestamps[activeChatUser]) || 0;
        
        let dataJson = JSON.stringify(data);
        
        if (dataJson === lastPrivateChatDataJson && otherReadTime === lastOtherReadTime) return;
        lastPrivateChatDataJson = dataJson;
        lastOtherReadTime = otherReadTime;
        
        if(!data) {  
            chatBox.innerHTML = '<p style="text-align:center; color:rgba(255,255,255,0.5);">Belum ada pesan. Sapa temanmu!</p>';  
            return;  
        }  
        
        let messagesArray = Object.values(data);
        let htmlContent = '';
        messagesArray.forEach(c => {  
            let isMe = (c.sender === currentUser);  
            let bClass = isMe ? 'chat-bubble-me' : 'chat-bubble-other';  
            let isRead = (c.timestamp || 0) <= otherReadTime;
            let checkmarkHTML = isMe ? getWhatsAppCheckmark(isRead, true) : ''; 
            
            htmlContent += `  
                <div class="chat-bubble ${bClass}">  
                    ${c.message}<br><small style="opacity:0.7; font-size:0.75em; float:right; margin-left:10px; margin-top:3px;">${c.time} ${checkmarkHTML}</small>  
                </div>`;  
        });  
        
        chatBox.innerHTML = htmlContent;  
        chatBox.scrollTop = chatBox.scrollHeight;  
    } catch(e) { console.error(e); }  
}

async function loadGroupMessages() {
    const GROUP_URL = `https://sinaubang-web-a5069-default-rtdb.asia-southeast1.firebasedatabase.app/group_chats/${activeGroup}.json`;
    const META_URL = `https://sinaubang-web-a5069-default-rtdb.asia-southeast1.firebasedatabase.app/group_meta/${activeGroup}.json`;
    const chatBox = document.getElementById('private-messages-box');  
    
    try {  
        let [resMsg, resMeta] = await Promise.all([
            fetch(GROUP_URL),
            fetch(META_URL)
        ]);
        let data = await resMsg.json();  
        let meta = await resMeta.json() || {};
        let readTimestamps = meta.lastReadTimestamps || {};
        
        let dataJson = JSON.stringify(data);
        let readTimestampsStr = JSON.stringify(readTimestamps);
        
        if (dataJson === lastGroupChatDataJson && readTimestampsStr === lastGroupReadTimestampsStr) return;
        lastGroupChatDataJson = dataJson;
        lastGroupReadTimestampsStr = readTimestampsStr;
        
        if(!data) {  
            chatBox.innerHTML = '<p style="text-align:center; color:rgba(255,255,255,0.5);">Belum ada pesan di grup. Mulai diskusi!</p>';  
            return;  
        }  
        
        let messagesArray = Object.values(data);
        let htmlContent = '';
        messagesArray.forEach(c => {  
            let isMe = (c.sender === currentUser);  
            let bClass = isMe ? 'chat-bubble-me' : 'chat-bubble-other';  
            let senderLabel = !isMe ? `<b style="color:var(--theme-accent); font-size:0.85em; display:block; margin-bottom:2px;">${c.sender}</b>` : '';
            
            let isReadByAnyone = false;
            Object.keys(readTimestamps).forEach(u => {
                if (u !== currentUser && readTimestamps[u] >= (c.timestamp || 0)) {
                    isReadByAnyone = true;
                }
            });

            let checkmarkHTML = isMe ? getWhatsAppCheckmark(isReadByAnyone, true) : '';
            
            htmlContent += `  
                <div class="chat-bubble ${bClass}">  
                    ${senderLabel}${c.message}<br><small style="opacity:0.7; font-size:0.75em; float:right; margin-left:10px; margin-top:3px;">${c.time} ${checkmarkHTML}</small>  
                </div>`;  
        });  
        
        chatBox.innerHTML = htmlContent;  
        chatBox.scrollTop = chatBox.scrollHeight;  
    } catch(e) { console.error(e); }  
}

async function sendPrivateMessage() {  
    if (activeGroup) {
        await sendGroupMessage();
    } else if (activeChatUser) {
        await sendUserPrivateMessage();
    }
}  

async function sendUserPrivateMessage() {
    const inputField = document.getElementById('private-input-field');   
    const msg = inputField.value.trim();   
    if(!msg) return;  
      
    const roomId = getRoomId(currentUser, activeChatUser);  
    const PRIVATE_URL = `https://sinaubang-web-a5069-default-rtdb.asia-southeast1.firebasedatabase.app/private_chats/${roomId}.json`;  
    const META_URL = `https://sinaubang-web-a5069-default-rtdb.asia-southeast1.firebasedatabase.app/chat_meta/${roomId}.json`;
      
    let currentTime = Date.now();
    let timeString = new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});   
    inputField.value = '';  
      
    await fetch(PRIVATE_URL, {   
        method: 'POST',   
        headers: { 'Content-Type': 'application/json' },   
        body: JSON.stringify({ sender: currentUser, message: msg, time: timeString, timestamp: currentTime })   
    });  

    let resMeta = await fetch(META_URL);
    let metaData = await resMeta.json() || {};

    await fetch(META_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            ...metaData,
            lastMessage: msg, 
            time: timeString, 
            lastSender: currentUser,
            timestamp: currentTime
        })
    });
      
    loadPrivateMessages();  
}

async function sendGroupMessage() {
    const inputField = document.getElementById('private-input-field');   
    const msg = inputField.value.trim();   
    if(!msg) return;  
      
    const GROUP_URL = `https://sinaubang-web-a5069-default-rtdb.asia-southeast1.firebasedatabase.app/group_chats/${activeGroup}.json`;  
    const META_URL = `https://sinaubang-web-a5069-default-rtdb.asia-southeast1.firebasedatabase.app/group_meta/${activeGroup}.json`;
      
    let currentTime = Date.now();
    let timeString = new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});   
    inputField.value = '';  
      
    await fetch(GROUP_URL, {   
        method: 'POST',   
        headers: { 'Content-Type': 'application/json' },   
        body: JSON.stringify({ sender: currentUser, message: msg, time: timeString, timestamp: currentTime })   
    });  

    let resMeta = await fetch(META_URL);
    let metaData = await resMeta.json() || {};

    await fetch(META_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            ...metaData,
            lastMessage: msg, 
            time: timeString, 
            lastSender: currentUser,
            timestamp: currentTime
        })
    });
      
    loadPrivateMessages();  
}

function handlePrivateKeyPress(e) {   
    if(e.key === 'Enter') sendPrivateMessage();   
}

// --- HISTORY ---  
let globalHistoryCache = [];  
async function loadHistoryView() {  
    const log = document.getElementById('main-history-log'); log.innerHTML = '<p style="text-align:center; color:rgba(255,255,255,0.5);">Memuat...</p>';  
    try {  
        let res = await fetch(FIREBASE_SKOR_URL); let data = await res.json(); log.innerHTML = '';   
        if (!data) return;  
        globalHistoryCache = Object.keys(data).map(key => ({ id: key, ...data[key] }));  
        let myHistory = globalHistoryCache.filter(item => item.nama === currentUser).reverse();  
        myHistory.forEach((item) => {  
            log.innerHTML += `<div class="log-item glass-panel" onclick="openHistoryDetail('${item.id}')"><b>${item.modul}</b><br>Skor: ${item.skor}<br><small style="color:rgba(255,255,255,0.7);">${item.waktu}</small></div>`;  
        });  
    } catch (e) {}  
}  
function openHistoryDetail(id) {  
    const record = globalHistoryCache.find(x => x.id === id); if(!record) return;  
    const modalBody = document.getElementById('modal-body-content'); modalBody.innerHTML = '';  
    if (record.detailJawaban) {  
        record.detailJawaban.forEach((ans, i) => {  
            let color = ans.isTrue ? "#22c55e" : "#ef4444";  
            modalBody.innerHTML += `<div class="detail-soal-card glass-panel" style="border-color:${color}"><b>Soal ${i+1}:</b> ${ans.soal}<br>Jawab: ${ans.pilihanUser} <br>Kunci: ${ans.jawabanBenar}</div>`;  
        });  
    }  
    document.getElementById('history-modal').style.display = 'flex';  
}  
function closeModal() { document.getElementById('history-modal').style.display = 'none'; }  

// --- FULL DATABASE (120+ QUESTIONS & QUIZ LOGIC) ---  
function shuffleArray(arr) { let c = arr.length, t, r; while (c !== 0) { r = Math.floor(Math.random() * c); c -= 1; t = arr[c]; arr[c] = arr[r]; arr[r] = t; } return arr; }  
  
const readingTexts = {  
    teks1: "<strong>Teks 1 (Flood)</strong><br>A massive flood hit Jakarta on Monday, Sept 14. It started at 02.00 AM. 500 refugees fled to safer places. The water reached 2 meters. The Mayor stated, 'We are sending boats.' Sadly, there were 3 casualties.",  
    teks2: "<strong>Teks 2 (Robbery)</strong><br>An armed robbery occurred at a local bank at 14.00. 3 men stole $50,000. It lasted 10 minutes. The police arrived 5 minutes later. Chief Inspector Budi reported the arrest of one suspect.",  
    teks3: "<strong>Teks 3 (Bus Crash)</strong><br>A fatal bus crash happened on Sunday, Oct 10 at 06.00. The bus carried 40 passengers. 5 died and 10 were heavily injured due to brake failure.",  
    teks4: "<strong>Teks 4 (Fire)</strong><br>A fire destroyed 20 houses last night. The government provided Rp100.000.000 in cash aid for the victims."  
};  

const psts_indo_questions = [
    { q: "Surat lamaran pekerjaan termasuk jenis surat ...", o: ["dinas", "niaga", "pribadi yang bersifat resmi", "pribadi yang bersifat kekeluargaan", "edaran"], c: 2, exp: "Surat lamaran kerja ditulis oleh individu ke instansi/lembaga resmi, sehingga termasuk surat pribadi yang bersifat resmi." },
    { q: "Sebagai petugas bagian personalia PT Bintang Sejahtera, Anda harus membalas surat lamaran Dewi yang belum dapat diterima karena kualifikasinya belum sesuai. Kalimat penolakan yang paling tepat dan santun adalah ...", o: ["Lamaran Anda kami tolak karena Anda tidak pantas bekerja di perusahaan ini.", "Kami tidak tertarik dengan lamaran Anda, jadi jangan mengirim surat lagi kepada kami.", "Lamaran kamu nggak bisa kami terima soalnya kamu kurang pintar.", "Kami menerima lamaran Saudari, tetapi Saudari harus bersedia bekerja tanpa digaji.", "Mohon maaf, setelah melalui proses seleksi, lamaran Saudari belum dapat kami terima karena belum sesuai dengan kualifikasi yang kami butuhkan saat ini."], c: 4, exp: "Penolakan harus menggunakan bahasa yang santun, halus, dan tidak menyinggung perasaan pelamar." },
    { q: "Bacalah iklan berikut!<br><em>LOWONGAN KERJA<br>Bengkel Resmi Sinar Motor membutuhkan: MEKANIK SEPEDA MOTOR... (Harian Radar Pati, 8 September 2026)</em><br><br>Alinea pembuka surat lamaran yang sesuai dengan iklan tersebut adalah ...", o: ["Berdasarkan iklan lowongan kerja di Harian Radar Pati tanggal 8 September 2026, saya bermaksud mengajukan lamaran sebagai mekanik sepeda motor di Bengkel Resmi Sinar Motor.", "Saya sangat membutuhkan pekerjaan sebagai mekanik sepeda motor sehingga saya mohon Bapak menerima saya.", "Berdasarkan iklan di Harian Radar Pati tanggal 8 September 2026, saya bermaksud melamar sebagai staf administrasi di Bengkel Resmi Sinar Motor.", "Berdasarkan informasi dari teman saya, Bengkel Resmi Sinar Motor membutuhkan mekanik sepeda motor, sehingga saya mengajukan lamaran.", "Bersama surat ini saya kirimkan daftar riwayat hidup, fotokopi ijazah, dan pas foto terbaru saya."], c: 0, exp: "Alinea pembuka harus mencantumkan sumber informasi (Harian Radar Pati), tanggal terbit, dan posisi yang dilamar (Mekanik Sepeda Motor) secara jelas." },
    { q: "Berdasarkan iklan lowongan Bengkel Resmi Sinar Motor di Harian Radar Pati (8 September 2026), kutipan berikut yang merupakan alinea pembuka surat lamaran adalah ...", o: ["Saya lulusan SMK Teknik Sepeda Motor, jujur, disiplin, dan pernah melaksanakan praktik kerja lapangan di bengkel sepeda motor.", "Demikian surat lamaran ini saya buat dengan sebenarnya. Atas perhatian Bapak/Ibu, saya ucapkan terima kasih.", "Sebagai bahan pertimbangan, saya lampirkan daftar riwayat hidup, fotokopi ijazah, dan pas foto terbaru.", "Sehubungan dengan iklan lowongan kerja Bengkel Resmi Sinar Motor yang dimuat di Harian Radar Pati tanggal 8 September 2026, saya mengajukan diri sebagai mekanik sepeda motor.", "Hormat saya, Dina Aprilia"], c: 3, exp: "Alinea pembuka menguraikan dari mana informasi didapat dan apa maksud pelamar (mengajukan diri sebagai posisi tertentu)." },
    { q: "Penulisan alamat surat lamaran yang sesuai dengan ejaan yang benar adalah ...", o: ["Kepada Yth. Direktur PT. Sumber Jaya, Jl. Pemuda No. 8, Semarang.", "Yth. Direktur PT Sumber Jaya<br>Jalan Pemuda Nomor 8<br>Semarang 50131", "yth. direktur pt sumber jaya<br>jalan pemuda nomor 8<br>semarang 50131", "Yth Direktur PT Sumber Jaya<br>Jalan Pemuda Nomor 8<br>Semarang 50131", "Yth. Direktur PT Sumber Jaya;<br>Jalan Pemuda Nomor 8;<br>Semarang 50131."], c: 1, exp: "Penulisan yang benar tidak menggunakan kata 'Kepada', 'Jalan' tidak disingkat, tidak ada titik setelah 'PT', dan tidak diakhiri tanda titik pada baris akhir alamat." },
    { q: "Kalimat penutup surat lamaran pekerjaan yang tepat adalah ...", o: ["Sekian dulu ya, Pak. Semoga lamaran saya langsung diterima.", "Pokoknya saya mau bekerja di perusahaan Bapak, titik.", "Demikian surat lamaran ini saya buat dengan sebenarnya. Atas perhatian dan kebijaksanaan Bapak/Ibu, saya ucapkan terima kasih.", "Saya berharap Bapak membalas surat ini secepatnya karena saya sedang butuh uang.", "Semoga surat ini sampai. Terima kasih banyak, Bos."], c: 2, exp: "Penutup surat harus menggunakan kalimat yang efektif, formal, dan santun." },
    { q: "Surat lamaran pekerjaan memiliki struktur sebagai berikut, kecuali ...", o: ["kop surat", "tempat dan tanggal pembuatan surat", "salam pembuka", "alamat tujuan surat", "tanda tangan dan nama terang"], c: 0, exp: "Surat lamaran kerja bersifat pribadi yang ditujukan ke instansi, sehingga tidak menggunakan kop surat (kepala surat) seperti surat dinas." },
    { q: "Rizal mengetahui bahwa PT Mandiri Motor di Kudus membutuhkan tenaga mekanik mobil dari temannya, Andi, yang bekerja di perusahaan tersebut. Alinea pembuka surat lamaran Rizal yang tepat adalah ...", o: ["Berdasarkan iklan di surat kabar, PT Mandiri Motor membutuhkan tenaga mekanik mobil sehingga saya mengajukan lamaran.", "Saya mengajukan lamaran pekerjaan di perusahaan Bapak sebagai tenaga administrasi.", "Saya sangat ingin bekerja di perusahaan Bapak karena gajinya besar.", "Bersama ini saya lampirkan fotokopi ijazah dan daftar riwayat hidup saya.", "Berdasarkan informasi dari teman saya, Saudara Andi, bahwa PT Mandiri Motor membutuhkan tenaga mekanik mobil, saya bermaksud mengajukan lamaran pekerjaan."], c: 4, exp: "Jika informasi lowongan berasal dari seseorang/teman, harus disebutkan nama narasumbernya pada alinea pembuka." },
    { q: "Perhatikan penulisan tempat dan tanggal pembuatan surat berikut!<br><em>pati 8 september 2026.</em><br>Kesalahan penulisan tersebut ditunjukkan oleh pernyataan berikut:<br>1) Nama kota tidak diawali huruf kapital.<br>2) Tidak ada tanda koma setelah nama kota.<br>3) Nama bulan tidak diawali huruf kapital.<br>4) Tanggal harus ditulis dengan kata 'tanggal'.<br>5) Terdapat tanda titik di akhir penulisan.<br>Pernyataan yang benar tentang kesalahan penulisan tersebut adalah ...", o: ["1), 2), dan 3)", "1), 2), 3), dan 5)", "2), 3), 4), dan 5)", "1), 3), 4), dan 5)", "1), 2), 4), dan 5)"], c: 1, exp: "Kesalahan: p kecil, tidak ada koma setelah nama kota, s kecil pada nama bulan, dan diakhiri dengan titik. (Format yang benar: Pati, 8 September 2026)" },
    { q: "Perhatikan bagian surat berikut!<br><em>Lampiran : 1 (satu) berkas<br>Hal : Lamaran pekerjaan</em><br>Bagian surat tersebut disebut ...", o: ["kepala surat dan alamat surat", "alamat tujuan dan salam pembuka", "paragraf pembuka dan paragraf isi", "lampiran dan perihal", "identitas pengirim dan penerima"], c: 3, exp: "Bagian tersebut merupakan Lampiran (berisi jumlah dokumen yang disertakan) dan Hal/Perihal (maksud surat)." },
    { q: "Bagian surat lamaran yang terletak di antara paragraf penutup dan tanda tangan adalah ...", o: ["salam pembuka", "paragraf isi", "salam penutup", "alamat tujuan surat", "tempat dan tanggal pembuatan surat"], c: 2, exp: "Struktur di akhir surat lamaran: Paragraf penutup -> Salam penutup (Hormat saya,) -> Tanda tangan dan nama terang." },
    { q: "Tujuan utama dibuatnya surat lamaran pekerjaan adalah ...", o: ["menawarkan diri dan kemampuan kepada perusahaan agar diterima bekerja", "memberitahukan adanya lowongan pekerjaan kepada masyarakat", "mengundang pimpinan perusahaan untuk menghadiri suatu acara", "menawarkan barang dan jasa kepada perusahaan", "memberikan laporan kegiatan kepada pimpinan perusahaan"], c: 0, exp: "Fungsi utama surat lamaran adalah permohonan agar diterima bekerja di sebuah instansi/perusahaan." },
    { q: "Argumen yang dikemukakan pelamar dalam isi surat lamaran pekerjaan berupa ...", o: ["tuntutan gaji yang diinginkan pelamar", "keluhan terhadap tempat bekerja sebelumnya", "penjelasan tentang sejarah berdirinya perusahaan", "daftar kekurangan perusahaan yang dilamar", "alasan atau keyakinan bahwa pelamar memiliki kemampuan yang sesuai dengan kebutuhan perusahaan"], c: 4, exp: "Argumen dalam surat lamaran berisi kualifikasi, pengalaman, atau keahlian untuk meyakinkan perusahaan." },
    { q: "Hal yang perlu diperhatikan dalam pembuatan surat lamaran pekerjaan adalah ...", o: ["menggunakan bahasa gaul agar terlihat akrab dengan pimpinan", "menggunakan bahasa baku, sopan, dan ringkas, serta ditulis rapi tanpa banyak coretan", "menulis sepanjang mungkin agar semua pengalaman terbaca", "menggunakan singkatan seperti pada pesan singkat agar hemat kertas", "mencantumkan permintaan gaji yang tinggi pada alinea pembuka"], c: 1, exp: "Surat resmi harus ditulis dengan format yang rapi, bersih, dan menggunakan bahasa baku serta sopan." },
    { q: "Bacalah iklan berikut!<br><em>LOWONGAN KERJA CV Pratama Computer membutuhkan: TEKNISI JARINGAN KOMPUTER ... (Sumber: Instagram resmi @pratamacomputer, 3 September 2026)</em><br><br>Alinea pembuka surat lamaran yang tepat berdasarkan iklan tersebut adalah ...", o: ["Berdasarkan iklan di surat kabar tanggal 3 September 2026, saya mengajukan lamaran sebagai teknisi jaringan komputer di CV Pratama Computer.", "Sehubungan dengan informasi di Instagram resmi CV Pratama Computer tanggal 3 September 2026, saya mengajukan lamaran sebagai staf administrasi.", "Saya sangat tertarik bekerja di CV Pratama Computer karena perusahaan tersebut terkenal di Jepara.", "Sehubungan dengan informasi lowongan kerja yang saya baca di Instagram resmi CV Pratama Computer tanggal 3 September 2026, saya mengajukan lamaran sebagai teknisi jaringan komputer.", "Saya membaca informasi lowongan kerja dan ingin menjadi teknisi jaringan komputer di perusahaan Bapak."], c: 3, exp: "Sumber informasi dari media sosial (Instagram) harus disebutkan secara spesifik beserta tanggal dan posisi yang dilamar (teknisi jaringan komputer)." },
    { q: "Ragam bahasa yang digunakan dalam surat lamaran pekerjaan adalah ...", o: ["ragam bahasa baku (resmi)", "ragam bahasa gaul", "ragam bahasa daerah", "ragam bahasa akrab", "ragam bahasa percakapan sehari-hari"], c: 0, exp: "Surat lamaran pekerjaan menggunakan ragam bahasa resmi atau baku sesuai PUEBI." },
    { q: "Hal yang perlu dikemukakan pelamar dalam isi surat lamaran pekerjaan adalah ...", o: ["kelemahan perusahaan beserta saran perbaikannya", "keinginan pelamar untuk langsung menduduki jabatan tertinggi", "identitas diri, pendidikan, pengalaman, dan keterampilan pelamar", "kisah pribadi pelamar sejak masa kecil", "kondisi keuangan keluarga pelamar"], c: 2, exp: "Isi surat lamaran pekerjaan memuat data yang mendukung kualifikasi seperti biodata, riwayat pendidikan, dan keahlian." },
    { q: "Kelengkapan yang perlu dilampirkan dalam surat lamaran pekerjaan adalah ...", o: ["daftar harga barang, brosur, dan kartu nama", "surat undangan, surat edaran, dan proposal", "surat tagihan listrik, kuitansi, dan faktur", "foto keluarga, rapor SD, dan akta nikah orang tua", "daftar riwayat hidup, fotokopi ijazah, dan pas foto terbaru"], c: 4, exp: "Lampiran standar untuk lamaran pekerjaan adalah CV/Daftar Riwayat Hidup, ijazah, dan foto." },
    { q: "Salam pembuka yang tepat dalam surat lamaran pekerjaan adalah ...", o: ["Hai, Bapak/Ibu Pimpinan!", "Dengan hormat,", "Hormat saya,", "Wassalam,", "Halo, apa kabar, Pak?"], c: 1, exp: "Salam pembuka paling lazim dan formal untuk surat lamaran adalah 'Dengan hormat,'." },
    { q: "Berikut ini yang tidak perlu dilampirkan dalam surat lamaran pekerjaan adalah ...", o: ["fotokopi ijazah terakhir", "daftar riwayat hidup", "pas foto terbaru", "foto keluarga besar", "fotokopi sertifikat keahlian"], c: 3, exp: "Foto keluarga besar tidak relevan dengan kualifikasi lamaran kerja." },
    { q: "Kalimat <em>'Saya lulusan SMK Kesuma Margoyoso Kompetensi Keahlian Akuntansi dan terampil mengoperasikan komputer.'</em> merupakan bagian dari ... surat lamaran.", o: ["paragraf isi", "paragraf pembuka", "paragraf penutup", "salam pembuka", "alamat tujuan"], c: 0, exp: "Penjelasan kualifikasi, keahlian, dan riwayat pendidikan termasuk dalam paragraf isi (argumen pelamar)." },
    { q: "Alinea pembuka surat lamaran yang menggunakan bahasa santun dan sesuai kaidah adalah ...", o: ["Saya lagi cari kerja, jadi saya kirim surat ini biar Bapak kasih saya pekerjaan.", "Hai, Pak! Saya lihat iklan di koran, saya mau kerja di tempat Bapak, titik!", "Setelah membaca iklan lowongan kerja di Harian Suara Merdeka tanggal 4 September 2026, dengan hormat saya mengajukan lamaran sebagai staf administrasi di perusahaan yang Bapak pimpin.", "Terimalah saya bekerja di perusahaan ini sekarang juga karena saya sudah lama menganggur.", "Perusahaan Bapak pasti butuh orang pintar seperti saya, jadi cepat terima lamaran saya."], c: 2, exp: "Kalimat C lengkap mencantumkan sumber dan tujuan, serta dirangkai dengan bahasa formal dan santun." },
    { q: "Surat lamaran dibuat di Kudus pada tanggal 12 September 2026. Penulisan tempat dan tanggal pembuatan surat yang sesuai dengan kaidah kebahasaan adalah ...", o: ["Kudus 12 September 2026", "Kudus, 12 september 2026", "Kudus, tgl 12-9-2026", "Kudus, 12 September 2026", "kudus, 12 September 2026."], c: 3, exp: "Nama kota diawali huruf kapital, diikuti koma, tanggal berupa angka, bulan berupa huruf kapital di awal, tahun angka, dan tanpa titik di akhir." },
    { q: "Berikut ini yang termasuk surat pribadi bersifat resmi adalah ...", o: ["surat Andi kepada sahabatnya tentang rencana liburan", "surat edaran kepala sekolah kepada seluruh guru", "surat penawaran barang dari toko kepada pelanggan", "surat undangan rapat dari OSIS kepada pengurus ekstrakurikuler", "surat izin tidak masuk sekolah yang ditulis Dina kepada wali kelasnya"], c: 4, exp: "Surat dari individu (Dina) yang ditujukan ke instansi/lembaga (sekolah) masuk ke dalam kategori surat pribadi resmi (seperti halnya lamaran kerja)." },
    { q: "Perhatikan urutan sistematika surat lamaran pekerjaan berikut!<br>1) Tempat dan tanggal<br>2) Salam pembuka<br>3) Alamat tujuan surat<br>4) Paragraf pembuka<br>5) Paragraf isi<br>6) Paragraf penutup<br>7) Salam penutup, tanda tangan, nama terang<br>Kesalahan urutan sistematika tersebut terdapat pada nomor ...", o: ["1) dan 2)", "2) dan 3)", "3) dan 4)", "4) dan 5)", "6) dan 7)"], c: 1, exp: "Urutan yang benar seharusnya 'Alamat tujuan surat' ditulis lebih dahulu sebelum 'Salam pembuka'." },
    { q: "Bacalah iklan berikut!<br><em>LOWONGAN KERJA PT Kreasi Otomotif membutuhkan: STAF ADMINISTRASI KEUANGAN... (Harian Suara Merdeka, 4 September 2026)</em><br><br>Alinea pembuka surat lamaran yang sesuai dengan seluruh informasi dalam iklan tersebut adalah ...", o: ["Menanggapi iklan lowongan kerja di Harian Suara Merdeka tanggal 4 September 2026, saya mengajukan lamaran sebagai staf administrasi keuangan pada PT Kreasi Otomotif.", "Menanggapi iklan lowongan kerja di Harian Suara Merdeka tanggal 5 September 2026, saya mengajukan lamaran sebagai staf administrasi keuangan pada PT Kreasi Otomotif.", "Menanggapi iklan lowongan kerja di Harian Suara Merdeka tanggal 4 September 2026, saya mengajukan lamaran sebagai kasir pada PT Kreasi Otomotif.", "Menanggapi iklan lowongan kerja di Harian Suara Merdeka tanggal 4 September 2026, saya mengajukan lamaran sebagai staf administrasi keuangan pada PT Kreasi Motor.", "Menanggapi iklan lowongan kerja di Harian Radar Kudus tanggal 4 September 2026, saya mengajukan lamaran sebagai staf administrasi keuangan pada PT Kreasi Otomotif."], c: 0, exp: "Pilihan A merujuk tepat pada surat kabar yang benar, tanggal yang benar, serta lowongan staf administrasi keuangan pada PT Kreasi Otomotif." },
    { q: "Dewi Lestari lahir di Pati pada 14 Mei 2008. Pendidikan SMK Kesuma Margoyoso, alamat Jl Kartini 7. Penulisan identitas pelamar dalam surat lamaran yang sesuai dengan kaidah kebahasaan adalah ...", o: ["Nama : dewi lestari<br>Tempat, tanggal lahir : Pati, 14 Mei 2008<br>...", "Nama : Dewi Lestari<br>Tempat, tanggal lahir : Pati 14 mei 2008<br>...", "Nama : Dewi Lestari<br>Tempat, tanggal lahir : Pati, 14 Mei 2008<br>Pendidikan terakhir : smk kesuma margoyoso<br>...", "Nama : Dewi Lestari.<br>Tempat, tanggal lahir : Pati, 14 Mei 2008.<br>...", "Nama : Dewi Lestari<br>Tempat, tanggal lahir : Pati, 14 Mei 2008<br>Pendidikan terakhir : SMK Kesuma Margoyoso<br>Alamat : Jalan Kartini Nomor 7, Margoyoso, Pati"], c: 4, exp: "Rincian identitas ditulis huruf awal kapital untuk data diri (Dewi, Pati), dan tidak diakhiri tanda titik pada setiap baris." },
    { q: "Sistematika surat lamaran pekerjaan yang benar adalah ...", o: ["alamat tujuan – tempat dan tanggal – lampiran dan hal – salam pembuka...", "tempat dan tanggal – salam pembuka – alamat tujuan – lampiran dan hal...", "tempat dan tanggal – lampiran dan hal – alamat tujuan – salam pembuka – paragraf pembuka – paragraf isi – paragraf penutup – salam penutup – tanda tangan dan nama terang", "tempat dan tanggal – lampiran dan hal – alamat tujuan – paragraf pembuka – salam pembuka...", "tempat dan tanggal – lampiran dan hal – alamat tujuan – salam pembuka – paragraf isi – paragraf pembuka..."], c: 2, exp: "Urutan standar: 1. Tempat/tanggal, 2. Hal/Lampiran, 3. Alamat, 4. Salam Pembuka, 5. Isi (pembuka, inti, penutup), 6. Salam Penutup & TTD." },
    { q: "Kepala SMK Kesuma Margoyoso mengirim surat kepada orang tua siswa perihal pengambilan rapor. Surat tersebut termasuk jenis surat ...", o: ["pribadi yang bersifat kekeluargaan", "pribadi yang bersifat resmi", "niaga", "dinas", "sahabat pena"], c: 3, exp: "Surat resmi dari instansi/organisasi (sekolah) kepada pihak luar (orang tua wali) dikategorikan sebagai surat dinas." },
    { q: "Bacalah iklan berikut!<br><em>LOWONGAN KERJA PT Alat Berat Perkasa membutuhkan: MEKANIK ALAT BERAT... (Laman resmi BKK SMK Kesuma Margoyoso, 6 September 2026)</em><br><br>Alinea pembuka surat lamaran yang tepat berdasarkan iklan tersebut adalah ...", o: ["Berdasarkan iklan di surat kabar tanggal 6 September 2026, saya mengajukan lamaran sebagai mekanik alat berat di PT Alat Berat Perkasa.", "Berdasarkan informasi lowongan kerja yang saya peroleh dari laman resmi BKK SMK Kesuma Margoyoso tanggal 6 September 2026, saya mengajukan lamaran sebagai mekanik alat berat di PT Alat Berat Perkasa.", "Berdasarkan informasi dari laman resmi BKK SMK Kesuma Margoyoso tanggal 6 September 2026, saya mengajukan lamaran sebagai operator forklift.", "Saya mengajukan lamaran sebagai mekanik alat berat karena saya menyukai dunia otomotif sejak kecil.", "Berdasarkan informasi dari laman resmi BKK SMK Kesuma Margoyoso, saya mengajukan lamaran sebagai mekanik alat berat di PT Perkasa Motor."], c: 1, exp: "Mencantumkan dengan tepat sumber informasi internet (laman web), posisi mekanik, dan nama PT yang sesuai." },
    { q: "Hal yang ditulis dalam daftar riwayat hidup adalah ...", o: ["alasan melamar dan tuntutan gaji", "daftar harga dan spesifikasi barang", "sumber informasi lowongan dan maksud melamar", "kegiatan harian dan hobi orang tua", "data pribadi, riwayat pendidikan, pengalaman, dan keterampilan"], c: 4, exp: "Daftar Riwayat Hidup (CV) berisi biodata atau data diri lengkap, latar belakang pendidikan, hingga pengalaman kerja." },
    { q: "Surat yang dibuat untuk keperluan bisnis, misalnya penawaran dan pemesanan barang, disebut surat ...", o: ["niaga", "dinas", "pribadi yang bersifat kekeluargaan", "edaran", "sosial"], c: 0, exp: "Surat yang terkait dengan kegiatan jual beli, perdagangan, atau bisnis disebut surat niaga." },
    { q: "Surat lamaran akan dikirim kepada Manajer Personalia PT Mitra Sejahtera, Jalan Gatot Subroto Nomor 45, Kudus 59312. Penulisan alamat surat yang sesuai dengan kaidah kebahasaan adalah ...", o: ["Yth. Manajer personalia pt mitra sejahtera<br>jalan gatot subroto nomor 45<br>kudus 59312", "Yth. Manajer Personalia PT. Mitra Sejahtera,<br>Jalan Gatot Subroto Nomor 45,<br>Kudus 59312.", "Yth. Manajer Personalia PT Mitra Sejahtera<br>Jalan Gatot Subroto Nomor 45<br>Kudus 59312", "Yth. Manajer Personalia PT Mitra Sejahtera<br>Jalan Gatot Subroto Nomor 45<br>kudus 59312", "Yth. Manajer Personalia PT Mitra Sejahtera<br>Jalan Gatot Subroto Nomor 45<br>Kudus 59312."], c: 2, exp: "Format benar: Yth. ditulis kapital awal + titik, PT tanpa titik, setiap baris tidak diakhiri tanda baca, dan menggunakan huruf kapital di awal setiap kata penting." },
    { q: "Rani akan mengirim surat lamaran kepada Bapak Hendra Wijaya, HRD CV Bintang Terang, yang beralamat di Jalan Sudirman Nomor 5, Jepara. Penulisan alamat surat yang benar adalah ...", o: ["Yth. Jepara<br>Jalan Sudirman Nomor 5<br>HRD CV Bintang Terang<br>Bapak Hendra Wijaya", "Yth. Bapak Hendra Wijaya<br>HRD CV Bintang Terang<br>Jalan Sudirman Nomor 5<br>Jepara", "Yth. Bapak Hendra Wijaya<br>Jalan Sudirman Nomor 5<br>HRD CV Bintang Terang<br>Jepara", "Yth. Bapak Hendra Wijaya di Jepara<br>HRD CV Bintang Terang<br>Jalan Sudirman Nomor 5", "Yth. HRD CV Bintang Terang<br>Jepara<br>Jalan Sudirman Nomor 5<br>Bapak Hendra Wijaya"], c: 1, exp: "Urutan dari spesifik ke luas: Nama penerima -> Jabatan/Instansi -> Nama Jalan -> Nama Kota." },
    { q: "Perhatikan bagian-bagian surat berikut!<br><em>Pati, 10 September 2026<br>Lampiran : 1 (satu) berkas<br>Hal : Lamaran pekerjaan<br>Yth. Pimpinan PT Maju Jaya<br>Jalan Merdeka Nomor 10<br>Kudus<br>Dengan hormat.</em><br><br>Bagian surat yang penulisannya salah adalah ...", o: ["tempat dan tanggal", "lampiran", "perihal", "salam pembuka", "alamat tujuan"], c: 3, exp: "Salam pembuka 'Dengan hormat.' salah karena diakhiri tanda titik, seharusnya tanda koma (Dengan hormat,)." },
    { q: "Bacalah surat lamaran berikut untuk menjawab soal!<br><em>(1) Pati, 12 Sept 2026 ... (3) Yth. Manajer Personalia ... (4) Dengan hormat, (5) Berdasarkan iklan... (6) Saya Rizky Ramadhan, lulusan SMK... (7) Demikian surat...</em><br><br>Sumber informasi lowongan pekerjaan dikemukakan pelamar pada bagian bernomor ...", o: ["(2)", "(3)", "(4)", "(5)", "(6)"], c: 3, exp: "Sumber informasi terletak di kalimat pembuka (paragraf pembuka), yang ditunjukkan oleh nomor (5)." },
    { q: "Keterampilan dan pengalaman pelamar dituliskan pada bagian bernomor ...", o: ["(6)", "(5)", "(7)", "(8)", "(9)"], c: 0, exp: "Keterampilan (merawat/memperbaiki mesin mobil) dan pendidikan berada di paragraf isi/argumen, yaitu nomor (6)." },
    { q: "Ucapan terima kasih pelamar terdapat pada bagian bernomor ...", o: ["(3)", "(4)", "(5)", "(6)", "(7)"], c: 4, exp: "Ucapan terima kasih ('Atas perhatian Bapak/Ibu, saya ucapkan terima kasih.') berada pada paragraf penutup di nomor (7)." },
    { q: "Jabatan orang yang dituju oleh surat tersebut tertulis pada bagian bernomor ...", o: ["(1)", "(3)", "(2)", "(4)", "(5)"], c: 1, exp: "Jabatan penerima ('Manajer Personalia') berada pada alamat tujuan surat, yang ditunjukkan oleh nomor (3)." },
    { q: "Salam penutup surat lamaran tersebut terdapat pada bagian bernomor ...", o: ["(6)", "(7)", "(8)", "(9)", "(1)"], c: 2, exp: "Salam penutup surat adalah frasa 'Hormat saya,' yang ditunjukkan pada nomor (8)." }
];  

const psts_bing_questions = [  
    { q: "What is the social function / purpose of a News Item text?", o: ["To entertain the readers", "To persuade people", "To inform readers about newsworthy events", "To describe a specific place"], c: 2, exp: "Tujuan News Item adalah menginformasikan berita harian (newsworthy events)." },  
    { q: "Which one is NOT a generic structure of News Item?", o: ["Newsworthy Event", "Background Events", "Sources", "Resolution"], c: 3, exp: "Resolution adalah struktur teks Narrative, bukan News Item." },  
    { q: "The part of the structure that contains the summary of the main event is called...", o: ["Orientation", "Newsworthy Event", "Sources", "Background Events"], c: 1, exp: "Newsworthy event/Main event berisi ringkasan atau inti dari kejadian berita." },  
    { q: "The term for witnesses or experts who provide quotes in the news is...", o: ["Headline", "Background", "Event", "Sources"], c: 3, exp: "Sources (Sumber) adalah pernyataan saksi, ahli, atau pihak terkait dalam berita." },  
    { q: "What is the main tense used to retell the past events in a news item?", o: ["Simple Present Tense", "Simple Future Tense", "Simple Past Tense", "Present Continuous Tense"], c: 2, exp: "Kejadian berita sudah terjadi di masa lalu, sehingga menggunakan Simple Past Tense." },  
    { q: "Which of the following belongs to 'Saying Verbs'?", o: ["Walked, ran", "Said, stated, reported", "Beautiful, tall", "In, on, at"], c: 1, exp: "Saying verbs adalah kata kerja pelapor (berkata, menyatakan)." },  
    { q: "Where can we usually find a News Item text?", o: ["Fairy tale books", "Newspaper or news websites", "Personal diaries", "Poetry books"], c: 1, exp: "Teks berita (News Item) ditemukan di koran atau portal berita." },  
    { q: "To gather complete details of a news story, journalists use the formula...", o: ["SWOT", "5W + 1H", "SPOK", "ABC"], c: 1, exp: "Wartawan menggunakan rumus 5W (Who, What, Where, When, Why) + 1H (How)." },  
    { q: "Which of the following is a Past Tense verb (Verb 2)?", o: ["Go", "Went", "Going", "Goes"], c: 1, exp: "'Went' adalah bentuk past (V2) dari kata kerja 'go'." },  
    { q: "The title of a news article printed in large letters is called...", o: ["Footnote", "Headline", "Source", "Quote"], c: 1, exp: "Headline adalah judul artikel berita." },  
    { q: "The section that elaborates what happened, to whom, and in what circumstances is...", o: ["Background Events", "Sources", "Headline", "Newsworthy Event"], c: 0, exp: "Background events menceritakan latar belakang kronologi kejadian." },  
    { q: "Identify the main event: 'An earthquake measuring 5.6 magnitude struck Cianjur today.'", o: ["A festival in Cianjur", "An earthquake in Cianjur", "A speech by the mayor", "A robbery"], c: 1, exp: "Peristiwa utamanya adalah gempa bumi di Cianjur." },  
    { q: "Choose the correct sentence using a saying verb:", o: ["The police jumped quickly.", "The building was very tall.", "The witness said that he saw the thief.", "She is eating an apple."], c: 2, exp: "Kata 'said' adalah saying verb." },  
    { q: "What kind of information is included in the 'Sources' section?", o: ["The writer's opinion", "The weather forecast", "Comments from witnesses or authorities", "A fairy tale story"], c: 2, exp: "Sources berisi komentar dari pihak berwenang atau saksi mata." },  
    { q: "The information presented in a News Item must be...", o: ["Fictional and imaginary", "Factual and real", "Subjective opinions", "Funny and joking"], c: 1, exp: "Berita harus berdasarkan fakta yang nyata." },  
      
    { q: "(Teks 1) What is the main topic?", o: ["A natural disaster / flood", "A traffic jam", "A car accident", "A political debate"], c: 0, passage: readingTexts.teks1, exp: "Teks membahas tentang 'massive flood' (banjir besar)." },  
    { q: "(Teks 1) On what day and date did the flood happen?", o: ["Sunday, Sept 13", "Monday, Sept 14", "Tuesday, Sept 15", "Friday, Sept 14"], c: 1, passage: readingTexts.teks1, exp: "Tertulis dengan jelas 'Monday, Sept 14'." },  
    { q: "(Teks 1) What time did the flood start?", o: ["12.00 PM", "02.00 AM", "04.00 AM", "08.00 PM"], c: 1, passage: readingTexts.teks1, exp: "Tertulis 'It started at 02.00 AM'." },  
    { q: "(Teks 1) How many refugees fled from the flood?", o: ["100 people", "200 people", "500 people", "1000 people"], c: 2, passage: readingTexts.teks1, exp: "Informasi rinci menyebutkan '500 refugees'." },  
    { q: "(Teks 1) What was the maximum height of the flood water?", o: ["1 meter", "1.5 meters", "2 meters", "3 meters"], c: 2, passage: readingTexts.teks1, exp: "Teks menyebutkan 'Water reached 2 meters'." },  
    { q: "(Teks 1) The Mayor stated, 'We are sending boats.' Who is the source of this statement?", o: ["The reporter", "The Mayor", "The victim", "The President"], c: 1, passage: readingTexts.teks1, exp: "Pernyataan (quote) diberikan oleh The Mayor (Wali Kota)." },  
    { q: "(Teks 1) How many casualties were there?", o: ["None", "3 people", "13 people", "30 people"], c: 1, passage: readingTexts.teks1, exp: "Casualties dalam konteks bencana merujuk pada korban jiwa (3 orang)." },  
      
    { q: "(Teks 2) The main topic is...", o: ["Bank promotion", "A crime / robbery", "A new bank opening", "A security training"], c: 1, passage: readingTexts.teks2, exp: "Teks membahas 'armed robbery' (perampokan bersenjata)." },  
    { q: "(Teks 2) What time did the robbery occur?", o: ["10.00", "12.00", "14.00", "16.00"], c: 2, passage: readingTexts.teks2, exp: "Tertulis 'occurred at a local bank at 14.00'." },  
    { q: "(Teks 2) How many criminals/robbers were involved?", o: ["1 man", "2 men", "3 men", "4 men"], c: 2, passage: readingTexts.teks2, exp: "Tertulis '3 men stole...'." },  
    { q: "(Teks 2) What was the estimated money lost?", o: ["$5,000", "$15,000", "$50,000", "$500,000"], c: 2, passage: readingTexts.teks2, exp: "Tertulis mereka mencuri '$50,000'." },  
    { q: "(Teks 2) How long did the robbery incident last?", o: ["5 minutes", "10 minutes", "30 minutes", "1 hour"], c: 1, passage: readingTexts.teks2, exp: "Tertulis 'It lasted 10 minutes'." },  
    { q: "(Teks 2) When did the police arrive?", o: ["Before the robbery", "Exactly at 14.00", "At 14.05", "At 15.00"], c: 2, passage: readingTexts.teks2, exp: "Perampokan jam 14.00, polisi datang 5 menit kemudian, berarti 14.05." },  
    { q: "(Teks 2) Who is the authority giving information?", o: ["The bank teller", "Chief Inspector Budi", "The robber", "The manager"], c: 1, passage: readingTexts.teks2, exp: "Narasumber resminya adalah Chief Inspector Budi." },  
      
    { q: "(Teks 3) The topic is...", o: ["A bus tour", "A traffic accident / bus crash", "Buying a new bus", "Road construction"], c: 1, passage: readingTexts.teks3, exp: "Topik membahas kecelakaan lalu lintas (bus crash)." },  
    { q: "(Teks 3) On what day and date did the bus crash occur?", o: ["Sunday, Oct 9", "Sunday, Oct 10", "Monday, Oct 11", "Sunday, Nov 10"], c: 1, passage: readingTexts.teks3, exp: "Tertulis 'Sunday, Oct 10'." },  
    { q: "(Teks 3) What time did the accident happen?", o: ["05.00", "06.00", "07.00", "08.00"], c: 1, passage: readingTexts.teks3, exp: "Tertulis kejadian pada '06.00'." },  
    { q: "(Teks 3) What was the total number of passengers?", o: ["10", "15", "30", "40"], c: 3, passage: readingTexts.teks3, exp: "Bus membawa '40 passengers'." },  
    { q: "(Teks 3) How many victims died in the accident?", o: ["2", "5", "10", "40"], c: 1, passage: readingTexts.teks3, exp: "Tertulis '5 died'." },  
    { q: "(Teks 3) How many victims were heavily injured?", o: ["5", "10", "15", "35"], c: 1, passage: readingTexts.teks3, exp: "Tertulis '10 were heavily injured'." },  
    { q: "(Teks 3) What was the main cause of the crash?", o: ["Sleepy driver", "Bad weather", "Brake failure", "Speeding"], c: 2, passage: readingTexts.teks3, exp: "Tertulis penyebabnya adalah 'due to brake failure' (rem blong)." },  
      
    { q: "(Teks 4) The main topic is...", o: ["House renovation", "Government aid for fire victims", "Buying a new house", "Firefighter training"], c: 1, passage: readingTexts.teks4, exp: "Topik berfokus pada bantuan pemerintah pasca kebakaran." },  
    { q: "(Teks 4) How much cash aid did the government provide?", o: ["Rp10.000.000", "Rp50.000.000", "Rp100.000.000", "Rp200.000.000"], c: 2, passage: readingTexts.teks4, exp: "Dana bantuan sebesar 'Rp100.000.000'." },  
    { q: "(Teks 4) When did the fire happen?", o: ["This morning", "Yesterday afternoon", "Last night", "Two days ago"], c: 2, passage: readingTexts.teks4, exp: "Tertulis kejadian 'last night' (tadi malam)." },  
    { q: "(Teks 4) How many houses were destroyed?", o: ["10 houses", "15 houses", "20 houses", "25 houses"], c: 2, passage: readingTexts.teks4, exp: "Tertulis api menghancurkan '20 houses'." }  
];  

const psts_jawa_questions = [  
    { q: "Tembung sandiwara asale saka basa Jawa, yaiku sandi lan wara. Sandi tegese wadi utawa rahasia, dene wara tegese...", o: ["Wewarah utawa ajaran", "Panggonan", "Tontonan", "Guyonan"], c: 0, exp: "Sandi tegese rahasia/wadi, wara (wewarah) tegese ajaran. Dadi sandiwara iku ajaran sing disandikake sajroning tontonan." },  
    { q: "Rerangkening crita utawa urut-urutane kedadeyan ing sandiwara wiwit awal nganti pungkasan diarani...", o: ["Tema", "Alur (Plot)", "Amanat", "Latar"], c: 1, exp: "Alur utawa plot yaiku urutaning kedadeyan ing sajroning crita sandiwara." },  
    { q: "Piwulang luhur utawa pesen moral sing pengin diandharake pangripta (penulis) marang pamirsa diarani...", o: ["Tema", "Amanat", "Sudut pandang", "Konflik"], c: 1, exp: "Amanat yaiku pesen moral utawa nasehat sing bisa dijupuk saka pementasan sandiwara." },  
    { q: "Teks utawa buku sing isine pacelathon lan pituduh tingkah lakune paraga sandiwara diarani...", o: ["Naskah/Skenario", "Brosur", "Notulen", "Prosa"], c: 0, exp: "Naskah utawa skenario dadi paugeran utama paraga sadurunge main sandiwara." },  
    { q: "Wong sing tugase mimpin, ngatur, lan menehi arahan lumakune pementasan sandiwara diarani...", o: ["Aktor", "Sutradara", "Figuran", "Koreografer"], c: 1, exp: "Sutradara iku pemimpine pementasan sing ngatur kabeh paraga lan kru." },  
    { q: "Paraga sing duweni wewatak becik, jujur, lan biasane disenengi dening pamirsa diarani paraga...", o: ["Antagonis", "Protagonis", "Tritagonis", "Figuran"], c: 1, exp: "Protagonis yaiku tokoh utama sing duwe watak apik (wong sing bener)." },  
    { q: "Paraga sing tansah pasulayan (berkonflik) karo paraga utama, lan biasane duwe watak ala diarani...", o: ["Tritagonis", "Protagonis", "Antagonis", "Pembantu"], c: 2, exp: "Antagonis yaiku tokoh lawan sing biasane nggawa watak ala utawa jahat." },  
    { q: "Pirembugan utawa omong-omongan antarane paraga siji lan paraga liyane ing sandiwara diarani...", o: ["Prolog", "Epilog", "Monolog", "Dialog (Pacelathon)"], c: 3, exp: "Dialog utawa pacelathon yaiku komunikasi antarane rong paraga utawa luwih." },  
    { q: "Paraga sing guneman (ngomong) ijen ing panggung tanpa ana paraga liyane sing nemoni diarani...", o: ["Monolog", "Prolog", "Epilog", "Kramagung"], c: 0, exp: "Monolog asale saka tembung mono (siji). Yaiku paraga sing ngomong dhewe." },  
    { q: "Bagean pambuka ing sandiwara sing isine ngandharake kahanan utawa gambaran awal crita diarani...", o: ["Epilog", "Dialog", "Prolog", "Monolog"], c: 2, exp: "Prolog manggon ing ngarep (pambuka) kanggo menehi gambaran awal crita." },  
    { q: "Panutuping sandiwara sing biasane isine dudutan (kesimpulan) utawa pesen moral saka crita sing wis dipentasake diarani...", o: ["Prolog", "Epilog", "Klimaks", "Resolusi"], c: 1, exp: "Epilog manggon ing pungkasan crita minangka panutup sandiwara." },  
    { q: "Katrangan ing naskah sandiwara sing biasane ditulis ing njero kurung (...) minangka pituduh tingkah lakune paraga diarani...", o: ["Kramagung", "Wawancang", "Gancaran", "Tembang"], c: 0, exp: "Kramagung (petunjuk lakuan) nuntun paraga kudu kepriye obahing awake utawa perasaane." },  
    { q: "Sandiwara tradisional Jawa sing sumbere saka crita babad utawa legenda lan asale saka Jawa Tengah/Yogyakarta yaiku...", o: ["Ludruk", "Ketoprak", "Lenong", "Wayang Golek"], c: 1, exp: "Ketoprak yaiku kesenian tradisional Jawa Tengah sing asale diiringi tabuhan lesung utawa keprak." },  
    { q: "Kesenian sandiwara tradisional saka Jawa Timur sing biyen kabeh paragane wong lanang senajan maragakake wong wadon diarani...", o: ["Ludruk", "Ketoprak", "Wayang Wong", "Randai"], c: 0, exp: "Ludruk iku khas saka Jawa Timur (Surabaya/Jombang) kanthi paraga lanang kabeh ing jaman biyen." },  
    { q: "Sandiwara sing paragane ora guneman, nanging mung nggunakake obahing awak lan mimik praupan kanggo nyritakake kahanan diarani...", o: ["Pantomim", "Sendratari", "Opera", "Musikal"], c: 0, exp: "Pantomim ngandelake gerak tubuh dan ekspresi tanpa swara utawa dialog." },  
    { q: "Papan panggonan, wektu, lan swasana dumadine crita ing sandiwara diarani...", o: ["Alur", "Tema", "Latar (Setting)", "Amanat"], c: 2, exp: "Latar utawa setting kaperang dadi telu: latar panggonan, wektu, lan swasana." },  
    { q: "Pamilihan paraga (aktor/aktris) sing ditindakake sutradara supaya jumbuh karo wewatakane ing naskah diarani...", o: ["Blocking", "Casting", "Acting", "Directing"], c: 1, exp: "Casting yaiku proses milih paraga sing pas karo karakter ing naskah." },  
    { q: "Pengaturan obahing paraga ing panggung supaya ora nutupi paraga liyane saka pandelenge pamirsa diarani...", o: ["Blocking", "Casting", "Editing", "Dubbing"], c: 0, exp: "Blocking penting supaya posisi paraga ing panggung katon endah lan ora tumpang tindih." },  
    { q: "Yen ana paraga lali naskah, nanging tetep nerusake pacelathon nganggo ukarane dhewe sing isih jumbuh karo crita, iku diarani...", o: ["Gladi resik", "Improvisasi", "Apresiasi", "Gestur"], c: 1, exp: "Improvisasi iku tumindak dadakan tanpa naskah kanggo nutupi kaluputan ing panggung." },  
    { q: "Sing kalebu unsur intrinsik sandiwara yaiku...", o: ["Tema, alur, latar, paraga", "Agama penulis, kahanan ekonomi, budaya", "Panggung, tiket, penonton, swara", "Kamera, sutradara, produser, sponsor"], c: 0, exp: "Unsur intrinsik yaiku unsur sing mangun sandiwara saka jero naskah iku dhewe." },  
    { q: "Crita wayang wong biasane mendhet sumber saka epos...", o: ["Kancil lan Baya", "Malin Kundang", "Ramayana lan Mahabharata", "Panji Asmarabangun"], c: 2, exp: "Wayang wong njupuk lakon saka crita pewayangan klasik Ramayana lan Mahabharata." },  
    { q: "Kanggo nggambarake watake paraga, bisa dideleng saka bab-bab ing ngisor iki, kajaba...", o: ["Solah bawane paraga", "Pacelathone paraga", "Gegambaran busanane paraga", "Regane tiket pementasan"], c: 3, exp: "Rega tiket ora ana gegayutane karo watak utawa penokohan paraga." },  
    { q: "Obahing praupan (wajah) kanggo nuduhake rasa sedhih, seneng, utawa nesu diarani...", o: ["Gestur", "Mimik", "Intonasi", "Artikulasi"], c: 1, exp: "Mimik iku ekspresi wajah sing nuduhake perasaane paraga." },  
    { q: "Obahing perangan awak (tangan, sirah, lsp) kanggo nyengkuyung pacelathon diarani...", o: ["Mimik", "Gestur", "Bloking", "Monolog"], c: 1, exp: "Gestur yaiku gerak tubuh/badan sing mbantu negesake ucapan." },  
    { q: "Unggah-ungguh basa sing trep digunakake dening anak marang wong tuwa ing dialog sandiwara yaiku...", o: ["Ngoko Lugu", "Ngoko Alus", "Krama Alus (Inggil)", "Krama Lugu"], c: 2, exp: "Bocah marang wong tuwa kudu nggunakake basa Krama Alus kanggo ngajeni." },  
    { q: "Basa sing digunakake antarane kanca akrab sing padha umure ing sandiwara biasane nggunakake...", o: ["Ngoko Lugu", "Ngoko Alus", "Krama Alus", "Krama Lugu"], c: 0, exp: "Kanca akrab sing wis kulina padha nggunakake Ngoko Lugu." },  
    { q: "Latihan pungkasan sadurunge sandiwara dipentasake kanthi nggunakake busana lan tata rias sing sabenere diarani...", o: ["Gladi kotor", "Gladi resik", "Evaluasi", "Casting"], c: 1, exp: "Gladi resik (gladi bersih) iku simulasi pementasan sing padha persis karo asline." },  
    { q: "Cethaning swara nalika paraga ngucapake pacelathon (huruf vokal lan konsonan kudu jelas) ing panggung diarani...", o: ["Artikulasi", "Intonasi", "Ekspresi", "Gestur"], c: 0, exp: "Artikulasi yaiku kejelasan pengucapan kata supaya krungu jelas dening penonton." },  
    { q: "Dhuwur cendhake swara (nada) nalika ngucapake ukara ing sandiwara kanggo mbedakake ukara pitakon utawa prentah diarani...", o: ["Artikulasi", "Intonasi", "Vokal", "Improvisasi"], c: 1, exp: "Intonasi iku lagu kalimat utawa tegese dhuwur-cendhake swara." },  
    { q: "Panggung, lampu (lighting), lan sound system ing pementasan sandiwara kalebu perangan...", o: ["Tata rias", "Tata busana", "Tata panggung", "Tata swara"], c: 2, exp: "Kabeh perlengkapan sing ana ing area main paraga kalebu tata panggung/artistik." },  
    { q: "Kanggo ngowahi praupane paraga supaya jumbuh karo karakter ing naskah (umpamane bocah enom didandani dadi wong tuwa), iku dadi tugase...", o: ["Penata panggung", "Penata busana", "Penata rias", "Sutradara"], c: 2, exp: "Penata rias (makeup artist) tugase nggawe wajah paraga cocog karo karaktere." },  
    { q: "Sandiwara sing isine ngguyuhake, lucu, lan asring nggawe pamirsane gumuyu diarani sandiwara...", o: ["Komedi", "Tragedi", "Melodrama", "Kolosal"], c: 0, exp: "Komedi iku jinis sandiwara sing asipat lucu dan nyenengake." },  
    { q: "Sandiwara sing isine crita sedhih utawa pungkasaning crita paraga utamane nemahi cilaka diarani...", o: ["Komedi", "Tragedi", "Opera", "Parodi"], c: 1, exp: "Tragedi asale saka tembung tragis, tegese crita sing pungkasan e melas utawa sedhih." },  
    { q: "Wujud seni pertunjukan sing nggabungake tari lan crita tanpa nggunakake pacelathon (dialog) babar blas diarani...", o: ["Ketoprak", "Ludruk", "Sendratari", "Wayang wong"], c: 2, exp: "Sendratari (Seni Drama lan Tari) nyritakake lakon lumantar obahing tari tanpa dialog langsung." },  
    { q: "Kanggo mbedakake adegan siji lan adegan liyane (ganti wektu utawa panggonan) ing panggung, biasane ditandhani kanthi...", o: ["Ganti sutradara", "Owah-owahan lampu (mati utawa redup) atau layar ditutup", "Penonton diwenehi maeman", "Paraga meneng kabeh sajroning jam-jaman"], c: 1, exp: "Peralihan adegan utawa babak ditandhani karo bloking lampu utawa tutup layar (kelir)." },  
    { q: "Ide pokok utawa gagasan utama sing dadi dhasar lakune crita sandiwara diarani...", o: ["Alur", "Amanat", "Tema", "Sudut pandang"], c: 2, exp: "Tema iku dhasar utawa pondasi crita (contho: tema pendidikan, perjuangan, katresnan)." },  
    { q: "Wong sing tugase nulis naskah utawa skenario sandiwara diarani...", o: ["Pangripta (Penulis)", "Aktor", "Sutradara", "Kameramen"], c: 0, exp: "Pangripta naskah utawa penulis skenario tugase nggawe crita lan pacelathon." },  
    { q: "Basa Ngoko Alus ing pacelathon sandiwara biasane digunakake dening...", o: ["Bocah cilik marang wong tuwane", "Wong tuwa marang wong enom sing luwih dhuwur derajate utawa diajeni", "Kanca akrab sing lagi wae kenal", "Abdi marang rajane"], c: 1, exp: "Ngoko alus gunane kanggo ngajeni wong sing luwih enom nanging pangkate/derajate luwih dhuwur, utawa antarane sedulur tuwa." },  
    { q: "Babagan sing BUKAN kalebu unsur ekstrinsik sandiwara yaiku...", o: ["Agamane sing nulis naskah", "Kahanan sosial budaya nalika naskah ditulis", "Latar mburi pendidikan penulis", "Watak utawa penokohan paraga"], c: 3, exp: "Watak/penokohan iku kalebu unsur intrinsik (ing njero naskah), dudu ekstrinsik." },  
    { q: "Sandiwara radio iku jinis sandiwara sing mung bisa dirasakake lumantar...", o: ["Pandeleng (mata)", "Pangrungu (kuping)", "Pangrasa (kulit)", "Pangambu (irung)"], c: 1, exp: "Sandiwara radio mung arupa swara (audio), mula mung bisa dirungokake (pangrungu)." }  
];  

const psts_jepang_questions = [
    { q: "Kata yang dipakai untuk menyebut ibu sendiri kepada orang lain adalah ...", o: ["おかあさん [okaasan]", "はは [haha]", "おばあさん [obaasan]", "おばさん [obasan]"], c: 1, exp: "はは [haha] digunakan untuk menyebut ibu sendiri kepada orang lain." },
    { q: "おにいさん [oniisan] artinya ...", o: ["kakak perempuan", "adik laki-laki", "paman", "kakak laki-laki"], c: 3, exp: "おにいさん [oniisan] berarti kakak laki-laki." },
    { q: "Kata yang dipakai untuk menyebut kakak perempuan sendiri adalah ...", o: ["あね [ane]", "おねえさん [oneesan]", "いもうと [imouto]", "おばさん [obasan]"], c: 0, exp: "あね [ane] digunakan untuk menyebut kakak perempuan sendiri." },
    { q: "いもうと [imouto] artinya ...", o: ["adik laki-laki", "kakak perempuan", "adik perempuan", "sepupu"], c: 2, exp: "いもうと [imouto] berarti adik perempuan." },
    { q: "Kata yang tepat untuk menyebut kakek orang lain adalah ...", o: ["そふ [sofu]", "おじさん [ojisan]", "おとうさん [otousan]", "おじいさん [ojiisan]"], c: 3, exp: "おじいさん [ojiisan] digunakan untuk menyebut kakek orang lain." },
    { q: "いとこ [itoko] artinya ...", o: ["saudara kandung", "sepupu", "paman", "cucu"], c: 1, exp: "いとこ [itoko] berarti sepupu." },
    { q: "Orang tua (ayah dan ibu) sendiri disebut ...", o: ["りょうしん [ryoushin]", "きょうだい [kyoudai]", "こども [kodomo]", "かぞく [kazoku]"], c: 0, exp: "りょうしん [ryoushin] berarti orang tua." },
    { q: "Kata yang dipakai untuk menyebut anggota keluarga sendiri adalah ... (Pilih lebih dari satu jawaban yang benar!)", o: ["ちち [chichi]", "おとうさん [otousan]", "はは [haha]", "おかあさん [okaasan]"], c: [0, 2], exp: "ちち [chichi] dan はは [haha] digunakan untuk menyebut ayah dan ibu sendiri kepada orang lain." },
    { q: "Berdasarkan teks わたしの かぞくは ごにんです。ちちと ははと あにと いもうとと わたしです。 berapa orang anggota keluarga penulis?", o: ["3 orang", "4 orang", "5 orang", "6 orang"], c: 2, exp: "ごにん [gonin] berarti 5 orang." },
    { q: "Selain ayah, ibu, dan penulis, anggota keluarga penulis adalah ...", o: ["kakak laki-laki dan adik perempuan", "kakak perempuan dan adik laki-laki", "kakek dan nenek", "paman dan bibi"], c: 0, exp: "あに [ani] berarti kakak laki-laki dan いもうと [imouto] berarti adik perempuan." },
    { q: "Angka 20 dibaca ...", o: ["じゅうに [juu ni]", "にひゃく [nihyaku]", "さんじゅう [sanjuu]", "にじゅう [nijuu]"], c: 3, exp: "20 dalam bahasa Jepang adalah にじゅう [nijuu]." },
    { q: "Angka 300 dibaca ...", o: ["さんひゃく [sanhyaku]", "さんびゃく [sanbyaku]", "さんぜん [sanzen]", "さんじゅう [sanjuu]"], c: 1, exp: "300 dibaca さんびゃく [sanbyaku]." },
    { q: "Angka 600 dibaca ...", o: ["ろくひゃく [rokuhyaku]", "ろっびゃく [robbyaku]", "ろっぴゃく [roppyaku]", "ろくびゃく [rokubyaku]"], c: 2, exp: "600 dibaca ろっぴゃく [roppyaku]." },
    { q: "Angka 3.000 dibaca ...", o: ["さんぜん [sanzen]", "さんせん [sansen]", "さんびゃく [sanbyaku]", "さんまん [sanman]"], c: 0, exp: "3.000 dibaca さんぜん [sanzen]." },
    { q: "Angka 8.000 dibaca ...", o: ["はちぜん [hachizen]", "はっぜん [hazzen]", "はちびゃく [hachibyaku]", "はっせん [hassen]"], c: 3, exp: "8.000 dibaca はっせん [hassen]." },
    { q: "Angka 2.500 dibaca ...", o: ["にひゃく ごせん [nihyaku gosen]", "にせん ごひゃく [nisen gohyaku]", "にせん ごじゅう [nisen gojuu]", "ごせん にひゃく [gosen nihyaku]"], c: 1, exp: "2.500 dibaca にせん ごひゃく [nisen gohyaku]." },
    { q: "Angka 10.000 dibaca ...", o: ["せん [sen]", "ひゃく [hyaku]", "いちまん [ichiman]", "じゅうまん [juuman]"], c: 2, exp: "10.000 dibaca いちまん [ichiman]." },
    { q: "Pasangan angka dan cara bacanya yang benar adalah ... (Pilih lebih dari satu jawaban yang benar!)", o: ["4 = よん [yon]", "9 = きゅう [kyuu]", "5 = はち [hachi]", "7 = ろく [roku]"], c: [0, 1], exp: "4 = よん [yon] dan 9 = きゅう [kyuu] benar." },
    { q: "げつようび [getsuyoubi] adalah hari ...", o: ["Senin", "Selasa", "Rabu", "Kamis"], c: 0, exp: "げつようび [getsuyoubi] berarti Senin." },
    { q: "Hari Rabu dalam bahasa Jepang adalah ...", o: ["もくようび [mokuyoubi]", "かようび [kayoubi]", "きんようび [kinyoubi]", "すいようび [suiyoubi]"], c: 3, exp: "Rabu dalam bahasa Jepang adalah すいようび [suiyoubi]." },
    { q: "Hari setelah もくようび [mokuyoubi] (Kamis) adalah ...", o: ["すいようび [suiyoubi]", "きんようび [kinyoubi]", "どようび [doyoubi]", "かようび [kayoubi]"], c: 1, exp: "Setelah Kamis adalah Jumat, yaitu きんようび [kinyoubi]." },
    { q: "Kalimat tanya なんようびですか [nanyoubi desu ka] artinya ...", o: ["tanggal berapa?", "bulan apa?", "hari apa?", "jam berapa?"], c: 2, exp: "なんようびですか [nanyoubi desu ka] berarti hari apa?" },
    { q: "ろくがつ [rokugatsu] adalah bulan ...", o: ["Januari", "Juli", "Agustus", "Juni"], c: 3, exp: "ろくがつ [rokugatsu] berarti Juni." },
    { q: "Bulan Desember dalam bahasa Jepang adalah ...", o: ["じゅうにがつ [juunigatsu]", "じゅういちがつ [juuichigatsu]", "じゅうがつ [juugatsu]", "にがつ [nigatsu]"], c: 0, exp: "Desember adalah じゅうにがつ [juunigatsu]." },
    { q: "Bulan April dibaca ...", o: ["よんがつ [yongatsu]", "しがつ [shigatsu]", "よがつ [yogatsu]", "しちがつ [shichigatsu]"], c: 1, exp: "April dibaca しがつ [shigatsu]." },
    { q: "Pasangan bulan dan cara bacanya yang benar adalah ... (Pilih lebih dari satu jawaban yang benar!)", o: ["Juli = しちがつ [shichigatsu]", "September = きゅうがつ [kyuugatsu]", "April = よんがつ [yongatsu]", "November = じゅういちがつ [juuichigatsu]"], c: [0, 3], exp: "Juli = しちがつ [shichigatsu] dan November = じゅういちがつ [juuichigatsu] benar." },
    { q: "Tanggal 1 dalam bahasa Jepang dibaca ...", o: ["いちにち [ichinichi]", "ひとつ [hitotsu]", "ついたち [tsuitachi]", "はつか [hatsuka]"], c: 2, exp: "Tanggal 1 dibaca ついたち [tsuitachi]." },
    { q: "ふつか [futsuka] adalah tanggal ...", o: ["2", "3", "12", "20"], c: 0, exp: "ふつか [futsuka] berarti tanggal 2." },
    { q: "Tanggal 20 dibaca ...", o: ["にじゅうにち [nijuunichi]", "にじゅうか [nijuuka]", "ふたじゅうか [futajuuka]", "はつか [hatsuka]"], c: 3, exp: "Tanggal 20 memiliki bacaan khusus, yaitu はつか [hatsuka]." },
    { q: "Tanggal 24 dibaca ...", o: ["にじゅうよんにち [nijuuyonnichi]", "にじゅうよっか [nijuuyokka]", "にじゅうしにち [nijuushinichi]", "にじゅうよにち [nijuuyonichi]"], c: 1, exp: "Tanggal 24 dibaca にじゅうよっか [nijuuyokka]." },
    { q: "Tanggal 10 dibaca ...", o: ["ここのか [kokonoka]", "ようか [youka]", "とおか [tooka]", "じゅういちにち [juuichinichi]"], c: 2, exp: "Tanggal 10 dibaca とおか [tooka]." },
    { q: "Lawan kata うえ [ue] (atas) adalah ...", o: ["した [shita]", "みぎ [migi]", "まえ [mae]", "ひだり [hidari]"], c: 0, exp: "うえ [ue] berarti atas, sedangkan lawannya adalah した [shita] yang berarti bawah." },
    { q: "みぎ [migi] artinya ...", o: ["kiri", "depan", "belakang", "kanan"], c: 3, exp: "みぎ [migi] berarti kanan." },
    { q: "Lawan kata まえ [mae] (depan) adalah ...", o: ["うえ [ue]", "うしろ [ushiro]", "ひだり [hidari]", "みぎ [migi]"], c: 1, exp: "まえ [mae] berarti depan, sedangkan うしろ [ushiro] berarti belakang." },
    { q: "Arah mata angin “timur” dalam bahasa Jepang adalah ...", o: ["にし [nishi]", "きた [kita]", "ひがし [higashi]", "みなみ [minami]"], c: 2, exp: "ひがし [higashi] berarti timur." },
    { q: "Pasangan arah mata angin dan artinya yang benar adalah ... (Pilih lebih dari satu jawaban yang benar!)", o: ["きた [kita] = utara", "にし [nishi] = timur", "みなみ [minami] = selatan", "ひだり [hidari] = kanan"], c: [0, 2], exp: "きた [kita] = utara dan みなみ [minami] = selatan benar." },
    { q: "Warna merah dalam bahasa Jepang adalah ...", o: ["あお [ao]", "きいろ [kiiro]", "みどり [midori]", "あか [aka]"], c: 3, exp: "あか [aka] berarti merah." },
    { q: "きいろ [kiiro] adalah warna ...", o: ["kuning", "cokelat", "hijau", "putih"], c: 0, exp: "きいろ [kiiro] berarti kuning." },
    { q: "Lawan warna しろ [shiro] (putih) adalah ...", o: ["あか [aka]", "くろ [kuro]", "きいろ [kiiro]", "みどり [midori]"], c: 1, exp: "しろ [shiro] berarti putih, sedangkan くろ [kuro] berarti hitam." },
    { q: "Bendera Indonesia berwarna ...", o: ["あおと しろ [ao to shiro]", "あかと くろ [aka to kuro]", "あかと しろ [aka to shiro]", "きいろと みどり [kiiro to midori]"], c: 2, exp: "Bendera Indonesia berwarna あかと しろ [aka to shiro], yaitu merah dan putih." }
];

const tkj_jaringan_qs = [  
    { q: "Protokol yang berfungsi memberikan IP address secara otomatis kepada komputer client dalam sebuah jaringan adalah...", o: ["DNS", "FTP", "DHCP", "HTTP"], c: 2, exp: "DHCP (Dynamic Host Configuration Protocol) bertugas membagikan IP secara otomatis ke client." },  
    { q: "Keuntungan utama menggunakan VLAN (Virtual Local Area Network) pada switch manageable adalah...", o: ["Menambah kecepatan bandwidth internet", "Membagi satu fisik jaringan menjadi beberapa jaringan logik yang terpisah", "Menggantikan fungsi router sepenuhnya", "Merubah alamat MAC menjadi IP"], c: 1, exp: "VLAN memisahkan broadcast domain secara logik meskipun berada dalam satu switch fisik." },  
    { q: "IP Address 192.168.10.1 dengan subnet mask 255.255.255.0 termasuk dalam IP kelas...", o: ["Kelas A", "Kelas B", "Kelas C", "Kelas D"], c: 2, exp: "Range awal 192-223 merupakan IP Address Kelas C." },  
    { q: "Perintah CLI pada Cisco IOS untuk masuk ke mode konfigurasi global dari mode privilege (tanda #) adalah...", o: ["enable", "show running-config", "configure terminal", "interface fastethernet 0/1"], c: 2, exp: "'configure terminal' (atau conf t) digunakan untuk masuk ke global configuration mode." },  
    { q: "Subnet mask default untuk IP Address Kelas B adalah...", o: ["255.0.0.0", "255.255.0.0", "255.255.255.0", "255.255.255.255"], c: 1, exp: "Kelas B memiliki prefix default /16 yang setara dengan 255.255.0.0." }  
];  

const tkj_vsat_qs = [  
    { q: "Kepanjangan dari VSAT dalam sistem komunikasi satelit adalah...", o: ["Very Small Aperture Terminal", "Virtual Satellite Antenna Transfer", "Variable Signal Amplification Tool", "Visual System Area Transmitter"], c: 0, exp: "VSAT singkatan dari Very Small Aperture Terminal, yaitu stasiun penerima sinyal satelit berukuran kecil." },  
    { q: "Komponen pada parabola VSAT yang berfungsi menangkap dan memfokuskan pantulan sinyal gelombang mikro dari satelit disebut...", o: ["Modem", "LNB (Low Noise Block)", "Router", "Konektor RJ45"], c: 1, exp: "LNB berfungsi menerima sinyal dari satelit yang dipantulkan oleh piringan parabola." },  
    { q: "Sebuah sistem VSAT terdiri dari dua segmen utama, yaitu...", o: ["Segmen kabel dan nirkabel", "Segmen space (satelit) dan ground (stasiun bumi/hub)", "Segmen hardware dan software", "Segmen client dan server"], c: 1, exp: "Sistem VSAT beroperasi menggunakan segmen space (satelit di orbit) dan ground (stasiun di bumi)." },  
    { q: "Perangkat VSAT yang berfungsi mengubah sinyal digital menjadi sinyal analog (frekuensi radio) untuk dikirimkan (transmit) ke satelit adalah...", o: ["BUC (Block Up Converter)", "LNB", "Switch", "Access Point"], c: 0, exp: "BUC bertugas mengubah sinyal frekuensi IF menjadi RF untuk ditransmisikan (Uplink)." },  
    { q: "Kelemahan utama dari penggunaan topologi jaringan satelit (VSAT) dibandingkan fiber optik adalah...", o: ["Hanya bisa menjangkau area perkotaan", "Tidak bisa digunakan untuk internet", "Memiliki latency (delay/jeda waktu) yang lebih tinggi", "Kabel yang digunakan sangat panjang"], c: 2, exp: "Jarak satelit yang sangat jauh dari bumi menyebabkan latency atau delay perambatan sinyal yang tinggi." }  
];  

const mplb_sop_qs = [  
    { q: "Dalam SOP Front Office, sikap melayani tamu dengan ramah, cepat, dan tanggap sering disebut sebagai penerapan prinsip...", o: ["Pelayanan Prima (Service Excellence)", "Manajemen Konflik", "Arsip Dinamis", "Administrasi Keuangan"], c: 0, exp: "Pelayanan prima (Service Excellence) adalah standar tertinggi dalam melayani tamu/pelanggan." },  
    { q: "Langkah pertama yang harus dilakukan resepsionis (Front Office) ketika tamu memasuki area lobi kantor adalah...", o: ["Meminta identitas KTP", "Memberikan salam (Greeting) dengan senyum", "Menyuruh tamu langsung duduk", "Menelepon atasan"], c: 1, exp: "Memberikan salam dengan ramah adalah prosedur paling awal (SOP) di Front Office." },  
    { q: "Saat menerima telepon keluhan dari tamu, tindakan yang paling tepat sesuai SOP adalah...", o: ["Menutup telepon secara sepihak", "Mendengarkan dengan empati, mencatat, dan menenangkan tamu", "Meminta tamu untuk datang langsung", "Menyalahkan departemen lain"], c: 1, exp: "Dalam pelayanan, keluhan harus didengarkan dengan empati dan dicatat sebelum diberikan solusi." },  
    { q: "Standar grooming (penampilan) bagi seorang petugas Front Office umumnya meliputi, kecuali...", o: ["Pakaian seragam rapi dan disetrika", "Rambut tertata rapi atau menggunakan hijab yang sesuai standar", "Menggunakan perhiasan mencolok berlebihan", "Memakai tanda pengenal (name tag)"], c: 2, exp: "Perhiasan berlebihan tidak sesuai dengan standar penampilan profesional di perkantoran/perhotelan." },  
    { q: "Jika tamu tidak memiliki janji temu dengan pimpinan yang sedang rapat, resepsionis sebaiknya...", o: ["Mempersilakan tamu masuk menerobos rapat", "Meminta tamu menunggu di luar tanpa penjelasan", "Menjelaskan dengan sopan bahwa pimpinan sedang rapat dan meminta tamu mengisi buku tamu/meninggalkan pesan", "Menyuruh tamu pulang dengan nada kasar"], c: 2, exp: "Penyampaian informasi yang jelas dan sopan serta menawarkan alternatif (meninggalkan pesan) adalah SOP yang benar." }  
];  

const tka_indo_questions = [
    { q: "Gagasan utama Teks 1 adalah ...", o: ["Remaja terlalu banyak menggunakan ponsel setiap hari.", "Memahami informasi memerlukan kebiasaan membaca teks utuh dan memeriksa sumbernya.", "Sebagian besar berita di media daring adalah kabar bohong.", "Sekolah harus mengurangi tugas membaca bagi siswa."], c: 1, passage: "<strong>Teks 1</strong><br>Kebiasaan membaca layar ponsel membuat sebagian remaja merasa sudah membaca banyak. Padahal, membaca cepat potongan berita tidak sama dengan memahami isi bacaan. Penelitian di berbagai sekolah menunjukkan bahwa siswa yang terbiasa membaca teks panjang lebih mampu menyimpulkan gagasan utama dan menilai kebenaran informasi. Sebaliknya, siswa yang hanya membaca judul cenderung mudah percaya pada kabar bohong. Oleh karena itu, sekolah perlu membiasakan siswa membaca teks utuh, mendiskusikannya, dan memeriksa sumbernya sebelum membagikan informasi kepada orang lain.", exp: "Teks membandingkan membaca potongan dengan membaca teks utuh, lalu ditutup dengan anjuran membaca utuh dan memeriksa sumber. Itulah gagasan utamanya." },
    { q: "Kalimat yang berisi saran atau pendapat penulis dalam Teks 1 adalah ...", o: ["Kebiasaan membaca layar ponsel membuat sebagian remaja merasa sudah membaca banyak.", "Penelitian di berbagai sekolah menunjukkan bahwa siswa yang terbiasa membaca teks panjang lebih mampu menyimpulkan gagasan utama.", "Siswa yang hanya membaca judul cenderung mudah percaya pada kabar bohong.", "Oleh karena itu, sekolah perlu membiasakan siswa membaca teks utuh, mendiskusikannya, dan memeriksa sumbernya."], c: 3, passage: "<strong>Teks 1</strong><br>Kebiasaan membaca layar ponsel membuat sebagian remaja merasa sudah membaca banyak. Padahal, membaca cepat potongan berita tidak sama dengan memahami isi bacaan. Penelitian di berbagai sekolah menunjukkan bahwa siswa yang terbiasa membaca teks panjang lebih mampu menyimpulkan gagasan utama dan menilai kebenaran informasi. Sebaliknya, siswa yang hanya membaca judul cenderung mudah percaya pada kabar bohong. Oleh karena itu, sekolah perlu membiasakan siswa membaca teks utuh, mendiskusikannya, dan memeriksa sumbernya sebelum membagikan informasi kepada orang lain.", exp: "Kata “perlu” menandakan saran/pendapat. Kalimat lain memuat gambaran keadaan atau hasil penelitian." },
    { q: "Makna kata “cenderung” pada Teks 1 adalah ...", o: ["memiliki kecondongan untuk", "sama sekali tidak", "selalu", "terpaksa"], c: 0, passage: "<strong>Teks 1</strong><br>Kebiasaan membaca layar ponsel membuat sebagian remaja merasa sudah membaca banyak. Padahal, membaca cepat potongan berita tidak sama dengan memahami isi bacaan. Penelitian di berbagai sekolah menunjukkan bahwa siswa yang terbiasa membaca teks panjang lebih mampu menyimpulkan gagasan utama dan menilai kebenaran informasi. Sebaliknya, siswa yang hanya membaca judul cenderung mudah percaya pada kabar bohong. Oleh karena itu, sekolah perlu membiasakan siswa membaca teks utuh, mendiskusikannya, dan memeriksa sumbernya sebelum membagikan informasi kepada orang lain.", exp: "“Cenderung” berarti condong atau mempunyai kecenderungan, sehingga sepadan dengan “memiliki kecondongan untuk”." },
    { q: "Pernyataan yang sesuai dengan isi Teks 1 adalah ...", o: ["(1) Siswa yang hanya membaca judul mudah percaya pada kabar bohong, DAN (2) Siswa yang terbiasa membaca teks panjang lebih mampu menyimpulkan gagasan utama.", "(1) Siswa yang hanya membaca judul mudah percaya pada kabar bohong, DAN (3) Penelitian menunjukkan siswa yang gemar membaca layar ponsel lebih pintar.", "(3) Penelitian menunjukkan siswa yang gemar membaca layar ponsel lebih pintar, DAN (4) Sekolah dianjurkan melarang siswa membawa ponsel.", "(2) Siswa yang terbiasa membaca teks panjang lebih mampu menyimpulkan gagasan utama, DAN (4) Sekolah dianjurkan melarang siswa membawa ponsel."], c: 0, passage: "<strong>Teks 1</strong><br>Kebiasaan membaca layar ponsel membuat sebagian remaja merasa sudah membaca banyak. Padahal, membaca cepat potongan berita tidak sama dengan memahami isi bacaan. Penelitian di berbagai sekolah menunjukkan bahwa siswa yang terbiasa membaca teks panjang lebih mampu menyimpulkan gagasan utama dan menilai kebenaran informasi. Sebaliknya, siswa yang hanya membaca judul cenderung mudah percaya pada kabar bohong. Oleh karena itu, sekolah perlu membiasakan siswa membaca teks utuh, mendiskusikannya, dan memeriksa sumbernya sebelum membagikan informasi kepada orang lain.", exp: "Pernyataan tentang mudah percaya kabar bohong dan mampu menyimpulkan gagasan tertulis di teks. Pernyataan siswa lebih pintar karena ponsel dan larangan membawa ponsel tidak disebutkan." },
    { q: "Kalimat yang efektif adalah ...", o: ["Para siswa-siswa sedang mengerjakan soal.", "Siswa mengerjakan soal dengan tenang di dalam kelas.", "Adalah merupakan kewajiban siswa menjaga kebersihan kelas.", "Dia pergi ke sekolah naik sepeda dengan menggunakan sepeda."], c: 1, exp: "Pilihan lain mengandung pemborosan kata: “para siswa-siswa” (ganda), “adalah merupakan” (ganda), dan “naik sepeda dengan menggunakan sepeda” (berulang)." },
    { q: "Kelompok kata yang semuanya baku adalah ...", o: ["apotik, risiko, analisa", "apotek, resiko, analisis", "apotek, risiko, analisis", "apotik, resiko, analisa"], c: 2, exp: "Bentuk baku: apotek, risiko, dan analisis." },
    { q: "Penulisan tanda baca yang tepat terdapat pada kalimat ...", o: ["Dani berkata, “Besok kita ujian, jadi belajarlah malam ini.”", "Ibu membeli sayur, buah dan, ikan di pasar.", "Kata Dani, \"Besok kita ujian.\" jadi belajarlah malam ini.", "Dani berkata “Besok kita ujian, jadi belajarlah malam ini”."], c: 0, exp: "Sebelum kutipan langsung diberi koma, dan tanda baca penutup kutipan ditulis di dalam tanda petik." },
    { q: "Hasil program bank sampah dalam tiga bulan menurut Teks 2 adalah ...", o: ["sampah sekolah habis seluruhnya", "jumlah sekolah peserta bertambah menjadi 35", "siswa memperoleh uang tunai dari pihak sekolah", "sampah sekolah berkurang hingga 35 persen"], c: 3, passage: "<strong>Teks 2</strong><br>Pemerintah daerah meluncurkan program bank sampah di 20 sekolah. Setiap siswa dapat menukar botol plastik dan kertas bekas dengan poin yang dapat ditabung. Dalam tiga bulan, program ini berhasil mengurangi sampah sekolah hingga 35 persen. Namun, beberapa sekolah mengeluhkan terbatasnya tempat penyimpanan sampah yang sudah dipilah.", exp: "Informasi ini terdapat pada kalimat ketiga Teks 2." },
    { q: "Simpulan yang tepat berdasarkan Teks 2 adalah ...", o: ["Program bank sampah gagal karena sekolah mengeluh.", "Program bank sampah hanya cocok untuk sekolah dengan fasilitas lengkap.", "Program bank sampah efektif mengurangi sampah sekolah, tetapi masih terkendala fasilitas penyimpanan.", "Pemerintah daerah sebaiknya menghentikan program bank sampah."], c: 2, passage: "<strong>Teks 2</strong><br>Pemerintah daerah meluncurkan program bank sampah di 20 sekolah. Setiap siswa dapat menukar botol plastik dan kertas bekas dengan poin yang dapat ditabung. Dalam tiga bulan, program ini berhasil mengurangi sampah sekolah hingga 35 persen. Namun, beberapa sekolah mengeluhkan terbatasnya tempat penyimpanan sampah yang sudah dipilah.", exp: "Teks memuat keberhasilan (35 persen) sekaligus kendala (tempat penyimpanan terbatas), sehingga simpulan harus memuat keduanya." },
    { q: "Kata “Namun” pada kalimat terakhir Teks 2 menyatakan hubungan ...", o: ["pertentangan", "sebab-akibat", "tujuan", "urutan waktu"], c: 0, passage: "<strong>Teks 2</strong><br>Pemerintah daerah meluncurkan program bank sampah di 20 sekolah. Setiap siswa dapat menukar botol plastik dan kertas bekas dengan poin yang dapat ditabung. Dalam tiga bulan, program ini berhasil mengurangi sampah sekolah hingga 35 persen. Namun, beberapa sekolah mengeluhkan terbatasnya tempat penyimpanan sampah yang sudah dipilah.", exp: "“Namun” dipakai untuk menyatakan pertentangan antara keberhasilan program dan keluhan sekolah." },
    { q: "Perhatikan kalimat berikut! “Perpustakaan adalah jantung sekolah kami.” Majas yang digunakan pada kalimat tersebut adalah ...", o: ["hiperbola", "metafora", "personifikasi", "ironi"], c: 1, exp: "Perpustakaan dibandingkan langsung dengan “jantung” tanpa kata pembanding, itulah metafora." },
    { q: "Kalimat terakhir pada Teks 1 berfungsi sebagai ...", o: ["pengenalan topik", "penyajian data penelitian", "contoh kasus", "penegasan ulang berupa saran"], c: 3, passage: "<strong>Teks 1</strong><br>Kebiasaan membaca layar ponsel membuat sebagian remaja merasa sudah membaca banyak. Padahal, membaca cepat potongan berita tidak sama dengan memahami isi bacaan. Penelitian di berbagai sekolah menunjukkan bahwa siswa yang terbiasa membaca teks panjang lebih mampu menyimpulkan gagasan utama dan menilai kebenaran informasi. Sebaliknya, siswa yang hanya membaca judul cenderung mudah percaya pada kabar bohong. Oleh karena itu, sekolah perlu membiasakan siswa membaca teks utuh, mendiskusikannya, dan memeriksa sumbernya sebelum membagikan informasi kepada orang lain.", exp: "Kalimat tersebut mengajukan saran sebagai penutup argumen, yaitu penegasan ulang dalam teks eksposisi." },
    { q: "Kalimat “Meskipun hujan deras, para siswa tetap mengikuti upacara.” termasuk kalimat ...", o: ["majemuk setara", "tunggal", "majemuk bertingkat", "majemuk rapatan"], c: 2, exp: "Ada anak kalimat (“meskipun hujan deras”) yang bergantung pada induk kalimat, sehingga termasuk majemuk bertingkat." },
    { q: "Makna ungkapan “membanting tulang” adalah ...", o: ["bekerja sambil bermain", "bekerja keras", "beristirahat sejenak", "mengalami cedera"], c: 1, exp: "Idiom “membanting tulang” berarti bekerja keras." },
    { q: "Kalimat yang penulisan huruf kapitalnya benar adalah ...", o: ["(1) Kami berlibur ke Pantai Kartini di Jepara. DAN (2) Adik membeli Es Teh di kantin.", "(1) Kami berlibur ke Pantai Kartini di Jepara. DAN (3) Ayah bekerja di PT Maju Jaya sejak tahun 2020.", "(2) Adik membeli Es Teh di kantin. DAN (4) Saya akan pergi ke Sekolah besok pagi.", "(3) Ayah bekerja di PT Maju Jaya sejak tahun 2020. DAN (4) Saya akan pergi ke Sekolah besok pagi."], c: 1, exp: "Nama geografi dan nama perusahaan diawali huruf kapital. “es teh” dan “sekolah” sebagai nama umum tidak perlu kapital." }
];

const tka_inggris_questions = [
    { q: "What is the main idea of Text 1?", o: ["Teenagers should stop using social media completely.", "Social media is the best way to learn at school.", "Social media has benefits, but teenagers must use it wisely.", "Experts do not like teenagers who use social media."], c: 2, passage: "<strong>Text 1</strong><br>Many teenagers use social media every day. It helps them keep in touch with friends and learn new things. However, spending too much time online can make them sleep late and lose focus at school. Experts suggest setting a daily time limit and turning off notifications at night. By doing so, teenagers can enjoy the benefits of social media without harming their health or studies.", exp: "The text lists benefits, warns about excessive use, and ends with advice for balanced use." },
    { q: "The phrase “keep in touch with” in Text 1 is closest in meaning to ...", o: ["stay connected with", "touch physically", "stay away from", "forget"], c: 0, passage: "<strong>Text 1</strong><br>Many teenagers use social media every day. It helps them keep in touch with friends and learn new things. However, spending too much time online can make them sleep late and lose focus at school. Experts suggest setting a daily time limit and turning off notifications at night. By doing so, teenagers can enjoy the benefits of social media without harming their health or studies.", exp: "“Keep in touch with” means to stay in contact or stay connected with someone." },
    { q: "What do experts suggest in Text 1?", o: ["Using social media only at night.", "Sleeping late to finish online activities.", "Deleting all friends from social media.", "Setting a daily time limit and turning off notifications at night."], c: 3, passage: "<strong>Text 1</strong><br>Many teenagers use social media every day. It helps them keep in touch with friends and learn new things. However, spending too much time online can make them sleep late and lose focus at school. Experts suggest setting a daily time limit and turning off notifications at night. By doing so, teenagers can enjoy the benefits of social media without harming their health or studies.", exp: "It is stated in the second-to-last sentence: set a daily time limit and turn off notifications at night." },
    { q: "Which statements are TRUE according to Text 1?", o: ["(1) Social media can help teenagers learn new things, AND (2) Too much time online can reduce focus at school.", "(1) Social media can help teenagers learn new things, AND (3) Experts recommend deleting all social media accounts.", "(3) Experts recommend deleting all social media accounts, AND (4) Teenagers must stop using social media.", "(2) Too much time online can reduce focus at school, AND (4) Teenagers must stop using social media."], c: 0, passage: "<strong>Text 1</strong><br>Many teenagers use social media every day. It helps them keep in touch with friends and learn new things. However, spending too much time online can make them sleep late and lose focus at school. Experts suggest setting a daily time limit and turning off notifications at night. By doing so, teenagers can enjoy the benefits of social media without harming their health or studies.", exp: "Statements 1 and 3 are stated in the text. Experts recommend limits, not deletion or total abstinence." },
    { q: "What is the purpose of the notice?", o: ["To invite students to a computer competition.", "To inform students that the computer lab will be closed for maintenance.", "To ask students to buy new computers.", "To announce a new IT teacher."], c: 1, passage: "<strong>NOTICE</strong><br>The computer lab will be closed on Friday, 9 October 2026, for network maintenance. Students who need to finish their assignments may use the library computers from 8 a.m. to 3 p.m. Please save your work and log out before 4 p.m. on Thursday. For further information, contact Mr. Arif at the IT office.", exp: "The first sentence announces that the lab will be closed for network maintenance." },
    { q: "Where can students do their assignments on Friday?", o: ["In the library.", "In the IT office.", "In the computer lab.", "In the classroom."], c: 0, passage: "<strong>NOTICE</strong><br>The computer lab will be closed on Friday, 9 October 2026, for network maintenance. Students who need to finish their assignments may use the library computers from 8 a.m. to 3 p.m. Please save your work and log out before 4 p.m. on Thursday. For further information, contact Mr. Arif at the IT office.", exp: "The notice says students may use the library computers on Friday." },
    { q: "The phrase “log out” in the notice means ...", o: ["switch on a computer", "download a file", "sign out of an account", "install a program"], c: 2, passage: "<strong>NOTICE</strong><br>The computer lab will be closed on Friday, 9 October 2026, for network maintenance. Students who need to finish their assignments may use the library computers from 8 a.m. to 3 p.m. Please save your work and log out before 4 p.m. on Thursday. For further information, contact Mr. Arif at the IT office.", exp: "“Log out” means to end a session by signing out of an account." },
    { q: "If I ___ more time, I would practice English every day.", o: ["have", "has", "will have", "had"], c: 3, exp: "Second conditional: If + past simple, would + base verb." },
    { q: "The new software ___ by the technician yesterday.", o: ["installed", "was installed", "is installing", "has install"], c: 1, exp: "Passive voice in the past simple: was/were + past participle." },
    { q: "A: “Would you mind lending me your pen?”\nB: “___”", o: ["Yes, I would.", "I’m fine, thank you.", "Not at all. Here you are.", "No, you can’t."], c: 2, exp: "To agree to “Would you mind…?”, the polite answer is “Not at all.”" },
    { q: "The company is looking for a candidate who is reliable. The word “reliable” is closest in meaning to ...", o: ["dependable", "careless", "famous", "expensive"], c: 0, exp: "“Reliable” means can be trusted or depended on." },
    { q: "She has been learning programming ___ 2024.", o: ["for", "since", "during", "while"], c: 1, exp: "“Since” is used with a specific starting point in time (2024)." },
    { q: "Despite ___ hard, he failed the test.", o: ["study", "studied", "to study", "studying"], c: 3, exp: "“Despite” is followed by a noun or a V-ing form." },
    { q: "She said, “I am tired.” The reported speech is ...", o: ["She said that I am tired.", "She said that she were tired.", "She said that she was tired.", "She said that she will be tired."], c: 2, exp: "In reported speech, “am” changes to “was” and the pronoun “I” changes to “she”." },
    { q: "Which sentences are grammatically correct?", o: ["(1) He doesn’t like coffee. AND (3) They were playing football when it started to rain.", "(1) He doesn’t like coffee. AND (2) She don’t have a laptop.", "(2) She don’t have a laptop. AND (4) I have saw that movie.", "(3) They were playing football when it started to rain. AND (4) I have saw that movie."], c: 0, exp: "Sentence 1 uses “doesn’t” correctly; sentence 3 uses past continuous + past simple correctly. Sentence 2 should be “doesn’t”, sentence 4 should be “have seen”." }
];

const tka_mtk_questions = [
    { q: "Harga sebuah laptop Rp6.000.000. Toko memberi diskon 15%. Harga yang harus dibayar adalah ...", o: ["Rp5.400.000", "Rp4.800.000", "Rp5.000.000", "Rp5.100.000"], c: 3, exp: "Harga bayar = 85% × 6.000.000 = Rp5.100.000." },
    { q: "Uang Ani dan Budi berbanding 3 : 5. Jika jumlah uang mereka Rp640.000, uang Budi adalah ...", o: ["Rp400.000", "Rp240.000", "Rp320.000", "Rp480.000"], c: 0, exp: "Uang Budi = 5/8 × 640.000 = Rp400.000." },
    { q: "Harga 2 flashdisk dan 1 mouse adalah Rp130.000, sedangkan harga 1 flashdisk dan 2 mouse adalah Rp110.000. Harga 1 flashdisk adalah ...", o: ["Rp30.000", "Rp50.000", "Rp40.000", "Rp60.000"], c: 1, exp: "Misal flashdisk = f, mouse = m. 2f + m = 130.000 dan f + 2m = 110.000. Dari persamaan pertama m = 130.000 − 2f. Substitusi: f + 260.000 − 4f = 110.000, sehingga f = 50.000." },
    { q: "Pada barisan aritmetika diketahui suku ke-3 adalah 11 dan suku ke-7 adalah 27. Suku ke-10 barisan tersebut adalah ...", o: ["35", "37", "39", "43"], c: 2, exp: "Beda b = (27 − 11) / 4 = 4, sehingga a = 11 − 2·4 = 3. U10 = 3 + 9·4 = 39." },
    { q: "Suku pertama barisan geometri adalah 2 dan rasionya 3. Suku ke-5 barisan tersebut adalah ...", o: ["54", "81", "243", "162"], c: 3, exp: "U5 = a·r⁴ = 2 · 81 = 162." },
    { q: "Sebuah dadu dilempar satu kali. Peluang muncul mata dadu bilangan prima adalah ...", o: ["1/2", "1/3", "2/3", "1/6"], c: 0, exp: "Bilangan prima pada dadu: 2, 3, 5 (3 kemungkinan) dari 6 kemungkinan, sehingga peluangnya 3/6 = 1/2." },
    { q: "Data nilai ulangan: 6, 7, 8, 8, 9, 10, 10, 10. Rata-rata data tersebut adalah ...", o: ["8,0", "8,5", "9,0", "10,0"], c: 1, exp: "Jumlah data = 68, banyak data = 8, sehingga rata-rata = 68/8 = 8,5." },
    { q: "Keliling sebuah persegi panjang 40 cm. Panjangnya 4 cm lebih dari lebarnya. Luas persegi panjang tersebut adalah ...", o: ["72 cm²", "84 cm²", "96 cm²", "112 cm²"], c: 2, exp: "Misal lebar = x, panjang = x + 4. K = 2(2x + 4) = 40, maka x = 8 dan panjang = 12. Luas = 8 × 12 = 96 cm²." },
    { q: "Sebuah tangga sepanjang 5 m bersandar pada tembok. Jarak kaki tangga ke tembok 3 m. Tinggi ujung tangga dari tanah adalah ...", o: ["4 m", "2 m", "6 m", "8 m"], c: 0, exp: "Tinggi = √(5² − 3²) = √16 = 4 m (tripel Pythagoras 3-4-5)." },
    { q: "Sebuah tabung berjari-jari 7 cm dan tinggi 10 cm. Volume tabung tersebut adalah ... (π = 22/7)", o: ["440 cm³", "770 cm³", "3.080 cm³", "1.540 cm³"], c: 3, exp: "V = π·r²·t = 22/7 · 49 · 10 = 1.540 cm³." },
    { q: "Seseorang berdiri sejauh 10 m dari kaki sebuah pohon dan melihat puncaknya dengan sudut elevasi 45°. Tinggi pohon tersebut adalah ... (tinggi pengamat diabaikan)", o: ["5 m", "10 m", "10√2 m", "20 m"], c: 1, exp: "tan 45° = tinggi / 10, dengan tan 45° = 1, sehingga tinggi = 10 m." },
    { q: "Rina menabung Rp2.000.000 dengan bunga tunggal 6% per tahun. Jumlah tabungan Rina setelah 3 tahun adalah ...", o: ["Rp2.120.000", "Rp2.240.000", "Rp2.360.000", "Rp2.382.032"], c: 2, exp: "Bunga = 2.000.000 × 6% × 3 = 360.000. Total = 2.000.000 + 360.000 = Rp2.360.000." },
    { q: "Nilai dari 3⁴ ÷ 3² × 3 adalah ...", o: ["27", "9", "81", "243"], c: 0, exp: "3⁴ ÷ 3² = 3² = 9, kemudian 9 × 3 = 27." },
    { q: "Perhatikan fungsi f(x) = 2x + 3. Pernyataan yang benar adalah ...", o: ["(1) f(2) = 7 DAN (2) Grafik fungsi memotong sumbu y di titik (0, 3)", "(1) f(2) = 7 DAN (3) f(−1) = 5", "(2) Grafik fungsi memotong sumbu y di titik (0, 3) DAN (4) Gradien grafik fungsi adalah 3", "(3) f(−1) = 5 DAN (4) Gradien grafik fungsi adalah 3"], c: 0, exp: "f(2) = 2·2 + 3 = 7 (benar). Titik potong sumbu y adalah (0, 3) (benar). f(−1) = 1, bukan 5. Gradien = 2, bukan 3." },
    { q: "Perhatikan data: 2, 4, 4, 6, 9. Pernyataan yang benar adalah ...", o: ["(1) Modus = 4, (2) Median = 4, (3) Rata-rata = 5", "(1) Modus = 4, (2) Median = 4, (4) Jangkauan = 6", "(2) Median = 4, (3) Rata-rata = 5, (4) Jangkauan = 6", "(1) Modus = 4, (3) Rata-rata = 5, (4) Jangkauan = 6"], c: 0, exp: "Modus = 4, median (nilai tengah) = 4, rata-rata = 25/5 = 5. Jangkauan = 9 − 2 = 7, bukan 6." }
];

const tka_tkj_questions = [
    { q: "Pada model OSI, lapisan yang bertanggung jawab atas pengalamatan logis (alamat IP) dan penentuan rute paket adalah ...", o: ["Network", "Transport", "Data Link", "Physical"], c: 0, exp: "Lapisan Network (layer 3) menangani alamat IP dan routing." },
    { q: "Perangkat jaringan yang menghubungkan dua jaringan berbeda dan meneruskan paket berdasarkan alamat IP adalah ...", o: ["Switch", "Hub", "Router", "Repeater"], c: 2, exp: "Router bekerja di layer 3 dan menghubungkan jaringan dengan network ID berbeda." },
    { q: "Pada topologi star, jika perangkat pusat (switch) mengalami kerusakan, maka ...", o: ["hanya komputer yang terjauh yang terputus", "seluruh komputer yang terhubung tidak dapat berkomunikasi", "jaringan otomatis berubah menjadi topologi ring", "kecepatan jaringan menjadi meningkat"], c: 1, exp: "Semua node pada topologi star bergantung pada perangkat pusat, sehingga menjadi titik kegagalan tunggal." },
    { q: "Alamat IP 192.168.1.10 termasuk kelas C dengan subnet mask default ...", o: ["255.0.0.0", "255.255.0.0", "255.255.255.255", "255.255.255.0"], c: 3, exp: "Kelas C memakai mask default 255.255.255.0 (/24)." },
    { q: "Jumlah alamat host yang dapat digunakan pada jaringan dengan prefix /24 adalah ...", o: ["255", "256", "254", "252"], c: 2, exp: "2⁸ − 2 = 254 (dikurangi alamat network dan alamat broadcast)." },
    { q: "Perintah yang digunakan untuk menguji konektivitas dasar antara dua perangkat dalam jaringan adalah ...", o: ["ping", "ipconfig", "mkdir", "format"], c: 0, exp: "Ping mengirim paket ICMP untuk memeriksa apakah host tujuan dapat dijangkau." },
    { q: "Untuk menghubungkan komputer ke switch menggunakan kabel UTP, susunan kabel yang digunakan adalah ...", o: ["crossover", "rollover", "coaxial", "straight-through"], c: 3, exp: "Perangkat yang berbeda jenis (komputer ke switch) memakai kabel straight-through." },
    { q: "DHCP server berfungsi untuk ...", o: ["menerjemahkan nama domain menjadi alamat IP", "memberikan alamat IP secara otomatis kepada klien", "menyaring paket data berbahaya", "menyimpan halaman web sementara"], c: 1, exp: "DHCP (Dynamic Host Configuration Protocol) memberi konfigurasi IP otomatis." },
    { q: "DNS berfungsi untuk ...", o: ["menerjemahkan nama domain menjadi alamat IP", "memberikan alamat IP secara otomatis", "mengenkripsi data selama pengiriman", "membagi bandwidth ke setiap klien"], c: 0, exp: "DNS (Domain Name System) memetakan nama domain ke alamat IP." },
    { q: "Komponen komputer yang menyimpan data dan program sementara selama komputer bekerja serta bersifat cepat adalah ...", o: ["hard disk", "power supply", "RAM", "motherboard"], c: 2, exp: "RAM adalah memori utama yang bersifat sementara (volatile) dan cepat." },
    { q: "Pada sistem operasi Linux, perintah untuk menampilkan isi suatu direktori adalah ...", o: ["cd", "rm", "pwd", "ls"], c: 3, exp: "ls = list; cd pindah direktori; rm hapus berkas; pwd menampilkan direktori kerja saat ini." },
    { q: "Phishing adalah ...", o: ["serangan yang membanjiri server dengan permintaan palsu", "upaya menipu korban agar memberikan data sensitif melalui pesan atau situs palsu", "pencadangan data secara berkala", "program yang memperbanyak diri tanpa izin"], c: 1, exp: "Phishing memanfaatkan tipuan (surel, pesan, situs palsu) untuk mencuri data seperti kata sandi." },
    { q: "Sebuah komputer dapat melakukan ping ke 8.8.8.8, tetapi tidak dapat membuka google.com di peramban. Kemungkinan penyebabnya adalah ...", o: ["kabel jaringan putus", "alamat gateway salah", "pengaturan DNS server belum benar", "kartu jaringan (NIC) rusak"], c: 2, exp: "Ping ke alamat IP berhasil berarti koneksi dan gateway normal. Gagal membuka nama domain menunjukkan masalah resolusi DNS." },
    { q: "Alamat IP berikut yang termasuk alamat private adalah ...", o: ["(1) 10.5.2.1 DAN (2) 172.20.4.9", "(1) 10.5.2.1 DAN (3) 172.32.1.1", "(2) 172.20.4.9 DAN (4) 192.169.1.1", "(3) 172.32.1.1 DAN (4) 192.169.1.1"], c: 0, exp: "Rentang private: 10.0.0.0–10.255.255.255, 172.16.0.0–172.31.255.255, 192.168.0.0–192.168.255.255. 172.32.x.x dan 192.169.x.x berada di luar rentang tersebut." },
    { q: "Pernyataan yang benar tentang switch adalah ...", o: ["(1) Bekerja pada layer Data Link dengan memanfaatkan alamat MAC DAN (3) Meneruskan frame hanya ke port tujuan", "(1) Bekerja pada layer Data Link dengan memanfaatkan alamat MAC DAN (2) Menghubungkan dua jaringan dengan network ID berbeda", "(2) Menghubungkan dua jaringan dengan network ID berbeda DAN (4) Memberikan alamat IP secara otomatis ke klien", "(3) Meneruskan frame hanya ke port tujuan DAN (4) Memberikan alamat IP secara otomatis ke klien"], c: 0, exp: "Switch (layer 2) memakai tabel MAC untuk meneruskan frame ke port tujuan. Menghubungkan jaringan berbeda adalah tugas router, dan pemberian IP otomatis adalah tugas DHCP." }
];


const db = {  
    'psts_indo': { title: "PSTS BHS INDO XII", q: psts_indo_questions },  
    'psts_bing': { title: "PSTS BING XII", q: psts_bing_questions },  
    'psts_jawa': { title: "PSTS BHS JAWA XII", q: psts_jawa_questions },
    'psts_jepang': { title: "PSTS BHS JEPANG XII", q: psts_jepang_questions },
    'tkj_jaringan': { title: "Config IP, DHCP & VLAN", q: tkj_jaringan_qs },  
    'tkj_vsat': { title: "Topologi & Sistem VSAT", q: tkj_vsat_qs },  
    'mplb_sop': { title: "SOP Pelayanan Prima", q: mplb_sop_qs },

    /* DATA TKA BARU */
    'tka_indo': { title: "Latihan TKA Bahasa Indonesia", q: tka_indo_questions },
    'tka_inggris': { title: "Latihan TKA Bahasa Inggris", q: tka_inggris_questions },
    'tka_mtk': { title: "Latihan TKA Matematika", q: tka_mtk_questions },
    'tka_tkj': { title: "Latihan TKA TKJ", q: tka_tkj_questions }
};  

  
let currentModulId = ''; let questions = []; let currentQIndex = 0; let score = 0; let finalCalculatedScore = 0; let answered = false; let userSessionAnswers = [];  

function startStudySession(modulId) {  
    currentModulId = modulId; questions = shuffleArray(JSON.parse(JSON.stringify(db[modulId].q)));   
    currentQIndex = 0; score = 0; userSessionAnswers = [];  
    document.getElementById('quiz-title').innerText = db[modulId].title;  
    switchTab(-1, 'view-quiz'); renderQuestion();  
}  

let currentOpts = [];  
function renderQuestion() {  
    answered = false; const q = questions[currentQIndex];  
    document.getElementById('question-tracker').innerText = `${currentQIndex + 1}/${questions.length}`;  
    document.getElementById('progress-fill').style.width = `${((currentQIndex) / questions.length) * 100}%`;  
    const readingBox = document.getElementById('reading-text');  
    if (q.passage) { readingBox.innerHTML = q.passage; readingBox.style.display = 'block'; } else { readingBox.style.display = 'none'; readingBox.innerHTML = ''; }  
    document.getElementById('question-text').innerHTML = `${currentQIndex + 1}. ${q.q}`;  
    const optC = document.getElementById('options-container'); optC.innerHTML = '';  
    currentOpts = shuffleArray(q.o.map((text, i) => ({ text, isCorrect: i === q.c })));  
    currentOpts.forEach((opt, i) => {  
        const btn = document.createElement('button'); btn.className = 'option-btn'; btn.innerHTML = String.fromCharCode(65 + i) + ". " + opt.text;  
        btn.onclick = () => selectAnswer(opt, btn); optC.appendChild(btn);  
    });  
    document.getElementById('feedback-box').style.display = 'none'; document.getElementById('next-btn-container').style.display = 'none';  
}  

function selectAnswer(selOpt, btn) {  
    if (answered) return; answered = true; let cText = "";  
    const allBtns = document.querySelectorAll('.option-btn');  
    currentOpts.forEach((opt, idx) => { allBtns[idx].disabled = true; if(opt.isCorrect) { allBtns[idx].classList.add('correct'); cText = opt.text; } });  
    if (selOpt.isCorrect) { btn.classList.add('correct'); score++; } else { btn.classList.add('wrong'); }  
    userSessionAnswers.push({ soal: questions[currentQIndex].q, pilihanUser: selOpt.text, isTrue: selOpt.isCorrect, jawabanBenar: cText });  
    document.getElementById('feedback-text').innerText = questions[currentQIndex].exp;  
    document.getElementById('feedback-box').style.display = 'block'; document.getElementById('next-btn-container').style.display = 'block';  
}  

function nextQuestion() { currentQIndex++; if (currentQIndex < questions.length) renderQuestion(); else finishQuiz(); }  
  
function finishQuiz() {   
    document.getElementById('progress-fill').style.width = `100%`;   
    setTimeout(() => {   
        switchTab(-1, 'view-result');  
        finalCalculatedScore = Math.round((score / questions.length) * 100);  
        document.getElementById('final-score').innerText = finalCalculatedScore;  
        document.getElementById('result-message').innerText = finalCalculatedScore >= 80 ? "Luar biasa!" : "Coba lagi ya, pasti bisa!";  
    }, 300);   
}  
  
async function saveScoreToHistory() {   
    let timeString = new Date().toLocaleString('id-ID', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit'});  
    const dataBaru = { nama: currentUser, modul: document.getElementById('quiz-title').innerText, skor: finalCalculatedScore, waktu: timeString, detailJawaban: userSessionAnswers };  
    try {  
        let btn = document.querySelector('#view-result .btn'); btn.innerText = "Menyimpan..."; btn.disabled = true;  
        await fetch(FIREBASE_SKOR_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataBaru) });  
        alert("Skor berhasil disimpan ke akun online-mu!"); loadHistoryView(); switchTab(0, 'view-dashboard', '<i class=\'fa-solid fa-house\'></i>');  
        btn.innerText = "💾 Simpan & Kembali"; btn.disabled = false;  
    } catch (error) { alert("Gagal menyimpan data."); }  
}

// --- AUTO-HIDE HEADER BERDASARKAN GULIRAN & SENTUHAN LAYAR ---
let lastScrollTop = 0;
const header = document.getElementById('top-header');

// Deteksi guliran standar (untuk halaman yang bisa di-scroll seperti Chat)
window.addEventListener('scroll', () => {
    let currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    
    const dropdown = document.getElementById('dropdown-menu');
    if (dropdown && dropdown.classList.contains('active')) return;

    if (currentScroll > lastScrollTop && currentScroll > 20) {
        if (header) header.classList.add('hidden');
    } else {
        if (header) header.classList.remove('hidden');
    }
    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
}, false);

// Deteksi tambahan untuk layar pendek (seperti Home/Musik) dengan usapan jari (Swipe)
let touchStartY = 0;

window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener('touchmove', (e) => {
    const dropdown = document.getElementById('dropdown-menu');
    if (dropdown && dropdown.classList.contains('active')) return;

    let touchEndY = e.touches[0].clientY;
    
    // Jika jari mengusap ke bawah (ingin memunculkan header)
    if (touchEndY - touchStartY > 40) {
        if (header) header.classList.remove('hidden');
    }
    // Jika jari mengusap ke atas (ingin menyembunyikan header)
    else if (touchStartY - touchEndY > 40) {
        if (header) header.classList.add('hidden');
    }
}, { passive: true });

