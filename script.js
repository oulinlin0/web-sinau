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

// --- NAVIGATION LOGIC ---  
function switchTab(index, viewId, iconSymbol = '<i class="fa-solid fa-house"></i>') {  
    if (index >= 0) {  
        const indicator = document.getElementById('indicator-wrapper');  
        const navItems = document.querySelectorAll('.bottom-nav .nav-item');  

        if(indicator) {
            indicator.style.transform = `translateX(${index * 100}%)`;  
            document.getElementById('nav-floating-icon').innerHTML = iconSymbol;  
        }

        navItems.forEach((item, i) => {  
            if (i === index) {  
                item.classList.add('active');  
            } else {  
                item.classList.remove('active');  
            }  
        });  
    }  

    document.querySelectorAll('.view').forEach(view => {  
        view.classList.remove('active');  
    });  

    const targetView = document.getElementById(viewId);  
    if (targetView) {  
        targetView.classList.add('active');  
    }  

    if (viewId === 'view-quiz' || viewId === 'view-result' || viewId === 'view-private-room' || viewId === 'view-call') {  
        document.getElementById('bottom-nav').style.display = 'none';  
        document.getElementById('top-header').style.display = 'none';  
    } else {  
        document.getElementById('bottom-nav').style.display = 'flex';  
        document.getElementById('top-header').style.display = 'flex';  
    }  

    if (viewId !== 'view-private-room' && currentChatInterval) {
        clearInterval(currentChatInterval);
        currentChatInterval = null;
    }

    if (viewId !== 'view-chat' && chatListInterval) {
        clearInterval(chatListInterval);
        chatListInterval = null;
    }

    if (viewId === 'view-history') {  
        loadHistoryView();  
    }  

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
    document.getElementById(folderId).classList.toggle('active'); 
    headerElement.querySelector('.chevron').classList.toggle('active'); 
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

const db = {  
    'psts_indo': { title: "PSTS BHS INDO XII", q: psts_indo_questions },  
    'psts_bing': { title: "PSTS BING XII", q: psts_bing_questions },  
    'psts_jawa': { title: "PSTS BHS JAWA XII", q: psts_jawa_questions },  
    'tkj_jaringan': { title: "Config IP, DHCP & VLAN", q: tkj_jaringan_qs },  
    'tkj_vsat': { title: "Topologi & Sistem VSAT", q: tkj_vsat_qs },  
    'mplb_sop': { title: "SOP Pelayanan Prima", q: mplb_sop_qs }  
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
