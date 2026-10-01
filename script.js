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

    if (viewId === 'view-quiz' || viewId === 'view-result' || viewId === 'view-private-room') {  
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
            chatListInterval = setInterval(loadChatUsersList, 500);
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

// --- MUSIC ---  
let isMusicPlaying = false; 
const bgMusic = document.getElementById('bg-music');  
function playSelectedTrack(src, index) {  
    document.getElementById('audio-source').src = src; bgMusic.load();  
    bgMusic.play().then(() => { 
        isMusicPlaying = true; 
        document.getElementById('main-music-toggle').innerText = "⏸ Jeda Musik"; 
        document.getElementById(`btn-play-${index}`).innerText = "Sedang Diputar 🎶"; 
    }).catch(e=>console.log(e));  
}  
function toggleMusicPlayback() { 
    if (isMusicPlaying) { bgMusic.pause(); isMusicPlaying = false; document.getElementById('main-music-toggle').innerText = "▶ Putar"; } 
    else { bgMusic.play(); isMusicPlaying = true; document.getElementById('main-music-toggle').innerText = "⏸ Jeda"; } 
}  

// --- REAL-TIME PRIVATE & GROUP CHAT SYSTEM ---  
function getAvatarUrl(name) {
    return `https://ui-avatars.com/api/?name=${name}&background=random&color=fff&bold=true`;
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
            avatarPath: `https://ui-avatars.com/api/?name=${groupName}&background=0284c7&color=fff&bold=true`,
            meta: groupMeta,
            maxTimestamp: groupMaxTimestamp,
            unreadCount: 0,
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
                            <span style="font-weight: ${item.isUnread ? '700' : 'normal'}; color: ${item.isUnread ? '#8EB69B' : 'inherit'};">${item.meta.time || ''}</span>  
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
    currentChatInterval = setInterval(loadPrivateMessages, 500);  
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
    document.getElementById('private-chat-avatar').src = `https://ui-avatars.com/api/?name=${groupName}&background=0284c7&color=fff&bold=true`;  
    document.getElementById('bottom-nav').style.display = 'none';  
      
    loadPrivateMessages();  
      
    if(currentChatInterval) clearInterval(currentChatInterval);  
    currentChatInterval = setInterval(loadPrivateMessages, 500);  
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
    { q: "Surat lamaran pekerjaan yang digabungkan dengan riwayat hidup (curriculum vitae) termasuk jenis surat lamaran model...", o: ["Gabungan", "Terpisah", "Semi-blok", "Resmi"], c: 0, exp: "Model gabungan menyatukan surat dan riwayat hidup dalam satu kesatuan." },  
    { q: "Kalimat penolakan lamaran pekerjaan yang halus dan santun adalah...", o: ["Maaf, kami tidak butuh tenaga Anda.", "Dengan menyesal kami belum bisa menerima Anda karena posisi telah terisi.", "Surat lamaran Anda ditolak karena tidak memenuhi syarat.", "Anda tidak kami terima, silakan cari di tempat lain."], c: 1, exp: "Penolakan harus menggunakan bahasa yang santun agar tidak menyinggung pelamar." },  
    { q: "'Berdasarkan informasi yang saya peroleh dari teman saya...'. Alenia pembuka ini dibuat berdasarkan sumber...", o: ["Iklan cetak", "Informasi seseorang", "Inisiatif sendiri", "Pengumuman resmi"], c: 1, exp: "Terdapat frasa 'dari teman saya' yang menunjukkan informasi dari seseorang." },  
    { q: "Alenia pembuka yang tepat berdasarkan iklan di koran Kompas tanggal 5 September 2024 adalah...", o: ["Sesuai iklan di Kompas, saya melamar...", "Berdasarkan iklan yang dimuat pada harian Kompas tanggal 5 September 2024, saya mengajukan lamaran...", "Membaca iklan di koran, saya berniat melamar...", "Saya melihat iklan di Kompas dan ingin bekerja."], c: 1, exp: "Sumber informasi cetak harus menyebutkan nama media dan tanggal secara spesifik." },  
    { q: "Penulisan alamat surat yang benar sesuai dengan EYD/PUEBI adalah...", o: ["Kepada Yth. Bapak Direktur PT Sukses Jl. Melati 10 Jakarta", "Yth. Direktur PT Sukses Jalan Melati 10 Jakarta", "Yth. Pimpinan PT. Sukses, Jl. Melati 10, Jakarta.", "Kepada Yth. Pimpinan PT Sukses di Jakarta"], c: 1, exp: "Kata 'Jalan' tidak disingkat, tidak memakai 'Kepada', dan tidak ada titik setelah 'PT'." },  
    { q: "Kalimat penutup surat lamaran pekerjaan yang paling tepat adalah...", o: ["Atas perhatiannya, saya ucapkan terima kasih.", "Atas perhatian Bapak/Ibu, saya mengucapkan terima kasih.", "Atas perhatiannya, diucapkan terima kasih.", "Maka saya ucapkan terima kasih yang sebesar-besarnya."], c: 1, exp: "Penggunaan 'nya' salah karena merujuk pada kata ganti orang ketiga, seharusnya 'Bapak/Ibu'." },  
    { q: "Struktur teks surat lamaran pekerjaan yang benar secara berurutan adalah...", o: ["Tesis, argumen, penegasan", "Orientasi, komplikasi, resolusi", "Pembuka, isi, penutup", "Salam, isi, salam penutup"], c: 0, exp: "Secara tekstual, surat lamaran terdiri dari tesis (pembuka), argumen (kualifikasi/lampiran), dan penegasan (penutup/harapan)." },  
    { q: "'Saya yang bertanda tangan di bawah ini...'. Kalimat ini merupakan alenia pembuka yang berasal dari...", o: ["Iklan lowongan", "Pengumuman", "Inisiatif sendiri", "Bursa kerja"], c: 2, exp: "Frasa tersebut menunjukkan pelamar membuat surat murni atas inisiatif pribadi tanpa merujuk sumber spesifik." },  
    { q: "Penulisan tempat dan tanggal pembuatan surat yang benar adalah...", o: ["Pati, 8-9-2024", "Pati 8 September 2024", "Pati, 8 September 2024", "pati, 08 September 2024"], c: 2, exp: "Tempat dan tanggal dipisah dengan koma, nama bulan ditulis huruf, dan diawali huruf kapital." },  
    { q: "Hal yang tidak perlu dilampirkan dalam surat lamaran pekerjaan umumnya adalah...", o: ["Daftar riwayat hidup", "Fotokopi ijazah", "Surat keterangan catatan kepolisian (SKCK)", "Akta kelahiran orang tua"], c: 3, exp: "Akta kelahiran orang tua tidak relevan dengan kualifikasi kerja pelamar." },  
    { q: "Bagian surat yang terletak paling atas sebelah kanan atau kiri adalah...", o: ["Alamat surat", "Tempat dan tanggal surat", "Hal dan lampiran", "Salam pembuka"], c: 1, exp: "Tempat dan tanggal surat selalu ditempatkan di bagian paling awal/atas." },  
    { q: "Tujuan utama pembuatan surat lamaran pekerjaan adalah...", o: ["Mendapatkan informasi gaji", "Memohon untuk diterima bekerja di suatu instansi", "Menunjukkan keahlian menulis", "Mengajukan protes kepada perusahaan"], c: 1, exp: "Fungsi utama surat lamaran pekerjaan adalah memohon pekerjaan." },  
    { q: "Isi argumen dalam surat lamaran pekerjaan biasanya dibuktikan dengan...", o: ["Tanda tangan", "Materai", "Lampiran dokumen (ijazah, sertifikat)", "Salam penutup"], c: 2, exp: "Argumen pelamar (kompetensi) didukung oleh bukti berupa lampiran dokumen." },  
    { q: "Hal yang harus diperhatikan dalam penulisan surat lamaran pekerjaan adalah...", o: ["Menggunakan bahasa gaul", "Menggunakan kertas berwarna-warni", "Menggunakan bahasa baku, sopan, dan format rapi", "Menulis sepanjang mungkin"], c: 2, exp: "Surat resmi harus menggunakan ragam bahasa baku dan format yang bersih/rapi." },  
    { q: "Alenia pembuka: 'Setelah membaca iklan di harian Suara Merdeka...'. Ini menunjukkan pelamar merespons dari...", o: ["Brosur", "Iklan media cetak", "Radio", "Internet"], c: 1, exp: "Harian Suara Merdeka adalah bentuk media cetak (koran)." },  
    { q: "Bahasa yang digunakan dalam surat lamaran pekerjaan harus bersifat...", o: ["Konotatif", "Persuasif dan formal", "Fiksi", "Santai"], c: 1, exp: "Surat lamaran harus formal namun persuasif agar perusahaan tertarik." },  
    { q: "Berikut adalah hal yang dikemukakan dalam surat lamaran pekerjaan, kecuali...", o: ["Identitas diri", "Kualifikasi pendidikan", "Pengalaman kerja", "Hobi yang tidak relevan"], c: 3, exp: "Hanya informasi yang mendukung kompetensi kerja yang perlu ditulis." },  
    { q: "Dokumen yang memuat rincian data pribadi, pendidikan, dan pengalaman kerja disebut...", o: ["Surat keterangan", "Daftar Riwayat Hidup (CV)", "Portofolio", "Sertifikat"], c: 1, exp: "Daftar Riwayat Hidup (CV) berisi biodata lengkap pelamar." },  
    { q: "Salam pembuka yang paling lazim digunakan dalam surat lamaran pekerjaan resmi adalah...", o: ["Halo Bapak/Ibu,", "Dengan hormat,", "Assalamualaikum,", "Salam sejahtera,"], c: 1, exp: "'Dengan hormat,' adalah salam pembuka paling standar dan resmi." },  
    { q: "Lampiran dalam surat lamaran pekerjaan berfungsi untuk...", o: ["Menebalkan surat", "Melengkapi dan memperkuat argumen kualifikasi pelamar", "Hanya formalitas", "Menghabiskan kertas"], c: 1, exp: "Lampiran membuktikan kebenaran data yang ditulis di surat." },  
    { q: "Kalimat 'Sebagai bahan pertimbangan, saya lampirkan...' berada pada bagian...", o: ["Pembuka surat", "Isi surat", "Penutup surat", "Alamat surat"], c: 1, exp: "Kalimat tersebut merinci dokumen yang ada di bagian isi (argumen)." },  
    { q: "Paragraf pembuka yang santun dan efektif adalah...", o: ["Beri saya pekerjaan ini.", "Saya ingin melamar kerja di tempat Bapak.", "Melalui surat ini, saya bermaksud mengajukan lamaran pekerjaan untuk mengisi posisi...", "Apakah ada lowongan di kantor Bapak?"], c: 2, exp: "Kalimat C menyatakan maksud dengan jelas, formal, dan santun." },  
    { q: "Penulisan tempat tanggal surat: 'Semarang, 12 oktober 2024'. Kesalahannya terletak pada...", o: ["Penggunaan koma", "Angka tahun", "Penulisan huruf 'o' pada bulan", "Nama kota"], c: 2, exp: "Nama bulan harus diawali huruf kapital: 'Oktober'." },  
    { q: "Surat lamaran pekerjaan pada dasarnya termasuk ke dalam jenis surat...", o: ["Dinas", "Pribadi resmi", "Niaga", "Keluarga"], c: 1, exp: "Surat lamaran dibuat oleh individu (pribadi) yang ditujukan ke instansi (resmi)." },  
    { q: "Sistematika surat lamaran pekerjaan yang tepat setelah tanggal surat adalah...", o: ["Isi surat", "Hal dan Lampiran", "Salam pembuka", "Tanda tangan"], c: 1, exp: "Setelah tempat dan tanggal, di sebelah kiri bawahnya biasanya diisi Hal dan Lampiran." },  
    { q: "Alenia pembuka untuk iklan lowongan yang tepat biasanya diawali dengan kata...", o: ["Berdasarkan", "Menyatakan", "Sehubungan", "Adapun"], c: 0, exp: "Kata 'Berdasarkan (iklan...)' sering digunakan untuk merujuk sumber informasi." },  
    { q: "Penulisan rincian identitas (nama, tempat tanggal lahir) yang tepat adalah...", o: ["Nama: Budi, Tempat: Pati", "nama : Budi, tempat, tanggal lahir : Pati, 12 Mei 2000", "Nama : Budi, Tempat, Tanggal Lahir : Pati, 12 Mei 2000", "NAMA: BUDI"], c: 1, exp: "Jika merinci dari kalimat sebelumnya, awal kata (nama, tempat, pendidikan) menggunakan huruf kecil." },  
    { q: "Sistematika surat lamaran pekerjaan setelah 'Hal dan Lampiran' adalah...", o: ["Tanggal surat", "Alamat tujuan surat", "Salam penutup", "Isi surat"], c: 1, exp: "Setelah Hal dan Lampiran, kita menuliskan Alamat tujuan surat (Yth. ...)." },  
    { q: "Surat yang dikirimkan oleh pencari kerja kepada instansi disebut surat...", o: ["Penawaran", "Pemberitahuan", "Lamaran Pekerjaan", "Perjanjian"], c: 2, exp: "Definisi dasar dari surat lamaran pekerjaan." },  
    { q: "Berdasarkan iklan di Instagram resmi PT XYZ... Sumber informasinya berasal dari...", o: ["Media cetak", "Media sosial (internet)", "Televisi", "Radio"], c: 1, exp: "Instagram adalah platform media sosial di internet." },  
    { q: "Hal yang wajib ada dalam daftar riwayat hidup, KECUALI...", o: ["Data pribadi", "Riwayat pendidikan", "Riwayat penyakit keturunan", "Pengalaman kerja/organisasi"], c: 2, exp: "Riwayat penyakit keturunan umumnya tidak dicantumkan kecuali diminta khusus (kesehatan)." },  
    { q: "Surat lamaran pekerjaan memiliki sifat...", o: ["Fiktif", "Objektif dan faktual", "Subjektif imajinatif", "Bebas"], c: 1, exp: "Semua data pelamar harus berdasarkan fakta yang bisa dipertanggungjawabkan." },  
    { q: "Penulisan alamat tujuan: 'Yth. Pimpinan HRD PT Maju Terus'. Penulisan ini...", o: ["Benar", "Salah, karena pakai 'PT'", "Salah, harusnya pakai 'Kepada'", "Salah, tidak boleh disingkat HRD"], c: 0, exp: "Penulisan tersebut sudah cukup tepat, efisien tanpa pemborosan kata 'Kepada'." },  
    { q: "Manakah yang BUKAN penulisan alamat surat yang benar?", o: ["Yth. Direktur PT Abadi", "Kepada Yth. Bapak Direktur", "Yth. HRD Manager PT Makmur", "Yth. Kepala Personalia PT Sukses"], c: 1, exp: "Penggunaan 'Kepada' dan 'Yth.' sekaligus adalah pemborosan kata." },  
    { q: "Identifikasi kesalahan: 'Dengan hormat. Bersama ini saya melamar...'. Kesalahannya adalah...", o: ["Titik setelah 'hormat'", "Kata 'saya'", "Kata 'melamar'", "Tidak ada yang salah"], c: 0, exp: "Salam pembuka 'Dengan hormat' harus diakhiri dengan tanda koma (,), bukan titik (.)." },  
    { q: "Bagian yang berisi harapan agar diterima dan ucapan terima kasih disebut...", o: ["Pembuka", "Tesis", "Argumen", "Penutup (Penegasan)"], c: 3, exp: "Harapan dan terima kasih berada di paragraf penutup." },  
    { q: "Kata ganti sapaan yang paling tepat untuk pimpinan instansi dalam surat adalah...", o: ["Kamu", "Anda", "Bapak/Ibu", "Saudara"], c: 2, exp: "Sapaan Bapak/Ibu dinilai paling sopan dan formal." },  
    { q: "Tanda tangan pelamar diletakkan di...", o: ["Pojok kiri atas", "Kanan bawah, di bawah salam penutup", "Kiri bawah", "Tengah bawah"], c: 1, exp: "Format standar surat lamaran menempatkan tanda tangan di kanan bawah." },  
    { q: "Nama terang pelamar ditulis...", o: ["Di dalam kurung tanpa kapital", "Tepat di bawah tanda tangan pelamar", "Di sebelah salam pembuka", "Di belakang ijazah"], c: 1, exp: "Nama terang selalu menyertai tanda tangan untuk kejelasan identitas." },  
    { q: "Format surat di mana seluruh teks rata kiri disebut...", o: ["Indented style", "Block style (Bentuk lurus)", "Semi block style", "Official style"], c: 1, exp: "Bentuk lurus (block style) mengetik semua bagian surat rata dari tepi kiri." }  
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
    { q: "(Teks 3) On what day and date did the bus crash occur?", o: ["Saturday, Oct 9", "Sunday, Oct 10", "Monday, Oct 11", "Sunday, Nov 10"], c: 1, passage: readingTexts.teks3, exp: "Tertulis 'Sunday, Oct 10'." },  
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
    { q: "Sandiwara sing isine ngguyuhake, lucu, lan asring nggawe pamirsane gumuyu diarani sandiwara...", o: ["Komedi", "Tragedi", "Melodrama", "Kolosal"], c: 0, exp: "Komedi iku jinis sandiwara sing asipat lucu lan nyenengake." },  
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
    document.getElementById('question-text').innerText = `${currentQIndex + 1}. ${q.q}`;  
    const optC = document.getElementById('options-container'); optC.innerHTML = '';  
    currentOpts = shuffleArray(q.o.map((text, i) => ({ text, isCorrect: i === q.c })));  
    currentOpts.forEach((opt, i) => {  
        const btn = document.createElement('button'); btn.className = 'option-btn'; btn.innerText = String.fromCharCode(65 + i) + ". " + opt.text;  
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
