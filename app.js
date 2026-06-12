// ============ STRUCTURE DE DONNÉES ==========
let appData = {
    admin: { password: "admin123" },
    teams: {},
    currentUser: null  // Persistant
};

// Chargement des données sauvegardées
function loadData() {
    const saved = localStorage.getItem('teamfoot_ultimate');
    if (saved) {
        appData = JSON.parse(saved);
    } else {
        // Équipe de démo
        appData.teams = {
            "TIGERS24": {
                name: "Tigres FC",
                coachPassword: "coach123",
                players: {},      // { playerId: { name, childName, parents: [{id, name, isPrimary}] } }
                events: [],
                messages: [],     // Messages globaux de l'équipe
                privateMessages: [], // { from, to, text, timestamp, seen }
                pendingPlayers: [],
                reminders: []     // { eventId, daysBefore, scheduledAt }
            }
        };
        saveData();
    }
    
    // Restaurer la session si existante
    const savedSession = localStorage.getItem('teamfoot_session');
    if (savedSession) {
        const session = JSON.parse(savedSession);
        if (session && session.user) {
            appData.currentUser = session.user;
        }
    }
}

function saveData() {
    localStorage.setItem('teamfoot_ultimate', JSON.stringify(appData));
}

function saveSession() {
    if (appData.currentUser) {
        localStorage.setItem('teamfoot_session', JSON.stringify({ user: appData.currentUser }));
    } else {
        localStorage.removeItem('teamfoot_session');
    }
}

function showToast(message, duration = 2500) {
    let toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), duration);
}

// ============ GESTION DE LA SESSION ==========
function logout() {
    appData.currentUser = null;
    saveData();
    saveSession();
    location.reload();
}

// ============ ÉCRAN DE CONNEXION ==========
function hideAllForms() {
    document.getElementById('playerLoginForm')?.classList.add('hidden');
    document.getElementById('coachLoginForm')?.classList.add('hidden');
    document.getElementById('adminLoginForm')?.classList.add('hidden');
    document.getElementById('createTeamForm')?.classList.add('hidden');
}

function showPlayerLogin() {
    hideAllForms();
    document.getElementById('playerLoginForm')?.classList.remove('hidden');
}

function showCoachLogin() {
    hideAllForms();
    document.getElementById('coachLoginForm')?.classList.remove('hidden');
}

function showAdminLogin() {
    hideAllForms();
    document.getElementById('adminLoginForm')?.classList.remove('hidden');
}

function showCreateTeam() {
    hideAllForms();
    document.getElementById('createTeamForm')?.classList.remove('hidden');
}

// ============ CONNEXIONS ==========
function loginAsAdmin() {
    const code = document.getElementById('adminCode')?.value;
    if (code === appData.admin.password) {
        appData.currentUser = { role: 'admin' };
        saveData();
        saveSession();
        showMainApp();
        showToast('👑 Bienvenue Administrateur');
    } else {
        showToast('Code admin incorrect');
    }
}

function loginAsCoach() {
    const teamCode = document.getElementById('coachTeamCode')?.value.toUpperCase();
    const password = document.getElementById('coachPassword')?.value;
    
    if (appData.teams[teamCode] && appData.teams[teamCode].coachPassword === password) {
        appData.currentUser = { role: 'coach', teamCode: teamCode };
        saveData();
        saveSession();
        showMainApp();
        showToast(`👥 Bienvenue coach de ${appData.teams[teamCode].name}`);
    } else {
        showToast('Code équipe ou mot de passe incorrect');
    }
}

function loginAsPlayer() {
    const teamCode = document.getElementById('playerTeamCode')?.value.toUpperCase();
    const parentName = document.getElementById('playerName')?.value.trim();
    const childName = document.getElementById('childName')?.value.trim();
    
    if (!appData.teams[teamCode]) {
        showToast('Code équipe invalide');
        return;
    }
    if (!parentName || !childName) {
        showToast('Veuillez remplir tous les champs');
        return;
    }
    
    const team = appData.teams[teamCode];
    
    // Vérifier si le joueur existe déjà
    let existingPlayer = null;
    let existingParent = null;
    
    for (let pid in team.players) {
        if (team.players[pid].childName.toLowerCase() === childName.toLowerCase()) {
            existingPlayer = team.players[pid];
            // Vérifier si le parent existe déjà
            existingParent = existingPlayer.parents.find(p => p.name.toLowerCase() === parentName.toLowerCase());
            break;
        }
    }
    
    if (existingParent) {
        // Parent existe déjà, connexion directe
        appData.currentUser = {
            role: 'player',
            teamCode: teamCode,
            playerId: existingPlayer.id,
            parentId: existingParent.id,
            parentName: existingParent.name,
            childName: existingPlayer.childName
        };
        saveData();
        saveSession();
        showMainApp();
        showToast(`🎮 Bon retour ${parentName} (${childName})`);
    } else if (existingPlayer) {
        // Nouveau parent pour ce joueur
        const newParentId = 'par_' + Date.now();
        const newParent = {
            id: newParentId,
            name: parentName,
            isPrimary: false
        };
        existingPlayer.parents.push(newParent);
        
        appData.currentUser = {
            role: 'player',
            teamCode: teamCode,
            playerId: existingPlayer.id,
            parentId: newParentId,
            parentName: parentName,
            childName: existingPlayer.childName
        };
        saveData();
        saveSession();
        showMainApp();
        showToast(`🎮 Bienvenue ${parentName} (${childName})`);
    } else {
        // Nouveau joueur + nouveau parent - Demande en attente
        const newPlayerId = 'ply_' + Date.now();
        const newParentId = 'par_' + Date.now();
        
        const newPlayer = {
            id: newPlayerId,
            childName: childName,
            parents: [{
                id: newParentId,
                name: parentName,
                isPrimary: true
            }],
            pendingApproval: true
        };
        
        team.players[newPlayerId] = newPlayer;
        
        appData.currentUser = {
            role: 'player',
            teamCode: teamCode,
            playerId: newPlayerId,
            parentId: newParentId,
            parentName: parentName,
            childName: childName,
            pendingApproval: true
        };
        saveData();
        saveSession();
        showMainApp();
        showToast(`✅ Demande envoyée pour ${childName} ! En attente d'approbation du coach`);
    }
}

function createTeam() {
    const teamName = document.getElementById('newTeamName')?.value.trim();
    const teamCode = document.getElementById('newTeamCode')?.value.toUpperCase();
    const coachPassword = document.getElementById('newCoachPassword')?.value;
    
    if (!teamName || !teamCode || !coachPassword) {
        showToast('Veuillez remplir tous les champs');
        return;
    }
    if (appData.teams[teamCode]) {
        showToast('Ce code équipe existe déjà');
        return;
    }
    
    appData.teams[teamCode] = {
        name: teamName,
        coachPassword: coachPassword,
        players: {},
        events: [],
        messages: [],
        privateMessages: [],
        pendingPlayers: [],
        reminders: []
    };
    saveData();
    showToast(`✅ Équipe "${teamName}" créée !`);
    showCoachLogin();
}

// ============ AFFICHAGE PRINCIPAL ==========
function showMainApp() {
    document.getElementById('loginScreen')?.classList.add('hidden');
    document.getElementById('mainApp')?.classList.remove('hidden');
    
    const user = appData.currentUser;
    const isAdmin = user.role === 'admin';
    const isCoach = user.role === 'coach';
    const isPlayer = user.role === 'player';
    
    // Afficher/masquer les onglets
    document.getElementById('adminTabBtn').style.display = isAdmin ? 'flex' : 'none';
    document.getElementById('addEventBtn').style.display = (isAdmin || isCoach) ? 'flex' : 'none';
    
    // Header
    if (isAdmin) {
        document.getElementById('headerTeamName').innerText = 'Team-Foot';
        document.getElementById('headerRole').innerText = 'Super Admin';
        document.getElementById('headerIcon').innerHTML = '👑';
        document.getElementById('welcomeText').innerHTML = 'Bonjour Administrateur 👋';
    } else if (isCoach) {
        const team = appData.teams[user.teamCode];
        document.getElementById('headerTeamName').innerText = team.name;
        document.getElementById('headerRole').innerText = 'Coach';
        document.getElementById('headerIcon').innerHTML = '👥';
        document.getElementById('welcomeText').innerHTML = `Bonjour Coach ${team.name} 👋`;
    } else if (isPlayer) {
        const team = appData.teams[user.teamCode];
        document.getElementById('headerTeamName').innerText = team.name;
        document.getElementById('headerRole').innerText = user.pendingApproval ? 'En attente' : 'Parent';
        document.getElementById('headerIcon').innerHTML = '🎮';
        document.getElementById('welcomeText').innerHTML = `Bonjour ${user.parentName} (${user.childName}) 👋`;
    }
    
    // Charger toutes les données
    loadDashboard();
    loadEvents();
    loadTeamMembers();
    loadConversations();
    loadAllTeamsForAdmin();
    updateReminderSelect();
    loadActiveReminders();
    
    setupEventListeners();
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.removeEventListener('click', handleNavClick);
        btn.addEventListener('click', handleNavClick);
    });
    
    // Déconnexion
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    
    // Messages
    document.getElementById('sendMsgBtn')?.addEventListener('click', sendPrivateMessage);
    document.getElementById('messageInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendPrivateMessage();
        }
    });
    
    // Reminders
    document.querySelectorAll('.reminder-btn').forEach(btn => {
        btn.removeEventListener('click', handleReminderClick);
        btn.addEventListener('click', handleReminderClick);
    });
}

function handleNavClick(e) {
    const tab = e.currentTarget.dataset.tab;
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    e.currentTarget.classList.add('active');
    document.getElementById(`${tab}Tab`).classList.add('active');
    
    if (tab === 'messages') loadConversations();
    if (tab === 'team') loadTeamMembers();
    if (tab === 'dashboard') loadDashboard();
}

// ============ DASHBOARD ==========
function loadDashboard() {
    const user = appData.currentUser;
    let playersCount = 0, eventsCount = 0, responseRate = 0;
    
    if (user.role === 'admin') {
        for (let code in appData.teams) {
            playersCount += Object.keys(appData.teams[code].players || {}).length;
            eventsCount += (appData.teams[code].events || []).length;
        }
    } else {
        const team = appData.teams[user.teamCode];
        playersCount = Object.keys(team.players || {}).length;
        eventsCount = (team.events || []).length;
        
        // Calcul du taux de réponse
        let totalResponses = 0;
        let totalPossible = 0;
        team.events?.forEach(event => {
            const playerResponses = Object.values(event.attendances || {});
            totalResponses += playerResponses.filter(s => s !== 'waiting').length;
            totalPossible += playersCount;
        });
        responseRate = totalPossible > 0 ? Math.round((totalResponses / totalPossible) * 100) : 0;
    }
    
    document.getElementById('statPlayers').innerText = playersCount;
    document.getElementById('statEvents').innerText = eventsCount;
    document.getElementById('statResponse').innerText = responseRate + '%';
    
    // Prochains événements
    loadUpcomingEvents();
    loadRecentActivity();
}

function loadUpcomingEvents() {
    const container = document.getElementById('upcomingEventsList');
    const user = appData.currentUser;
    let events = [];
    
    if (user.role === 'admin') {
        for (let code in appData.teams) {
            events.push(...(appData.teams[code].events || []).map(e => ({...e, teamName: appData.teams[code].name})));
        }
    } else {
        events = appData.teams[user.teamCode]?.events || [];
    }
    
    const upcoming = events.filter(e => new Date(e.matchDateTime) > new Date())
        .sort((a,b) => new Date(a.matchDateTime) - new Date(b.matchDateTime))
        .slice(0, 3);
    
    if (upcoming.length === 0) {
        container.innerHTML = '<div class="empty-state"><span>Aucun événement à venir</span></div>';
        return;
    }
    
    container.innerHTML = upcoming.map(e => `
        <div class="upcoming-item">
            <span>🏆 ${e.title}</span>
            <small>${new Date(e.matchDateTime).toLocaleDateString()}</small>
        </div>
    `).join('');
}

function loadRecentActivity() {
    const container = document.getElementById('recentActivity');
    const user = appData.currentUser;
    let messages = [];
    
    if (user.role === 'admin') {
        for (let code in appData.teams) {
            messages.push(...(appData.teams[code].messages || []).slice(0, 3).map(m => ({...m, teamName: appData.teams[code].name})));
        }
        messages.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else {
        messages = (appData.teams[user.teamCode]?.messages || []).slice(0, 5);
    }
    
    if (messages.length === 0) {
        container.innerHTML = '<div class="empty-state"><span>Aucune activité récente</span></div>';
        return;
    }
    
    container.innerHTML = messages.map(m => `
        <div class="activity-item">
            <span>💬 ${m.author}: ${m.text.substring(0, 30)}${m.text.length > 30 ? '...' : ''}</span>
            <small>${new Date(m.timestamp).toLocaleTimeString()}</small>
        </div>
    `).join('');
}

// ============ GESTION DES ÉVÉNEMENTS ==========
function showEventModal() {
    document.getElementById('eventModal')?.classList.remove('hidden');
    const defaultMatch = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const defaultCall = new Date(defaultMatch.getTime() - 2 * 60 * 60 * 1000);
    document.getElementById('eventMatchDate').value = defaultMatch.toISOString().slice(0, 16);
    document.getElementById('eventCallTime').value = defaultCall.toISOString().slice(0, 16);
}

function closeEventModal() {
    document.getElementById('eventModal')?.classList.add('hidden');
}

function createEvent() {
    const user = appData.currentUser;
    const event = {
        id: Date.now().toString(),
        type: document.getElementById('eventType').value,
        title: document.getElementById('eventTitle').value.trim(),
        matchDateTime: document.getElementById('eventMatchDate').value,
        callTime: document.getElementById('eventCallTime').value,
        location: document.getElementById('eventLocation').value.trim(),
        notes: document.getElementById('eventNotes').value.trim(),
        attendances: {}
    };
    
    if (!event.title || !event.matchDateTime || !event.location) {
        showToast('Veuillez remplir tous les champs');
        return;
    }
    
    if (user.role === 'admin') {
        for (let code in appData.teams) {
            if (!appData.teams[code].events) appData.teams[code].events = [];
            appData.teams[code].events.push({...event});
            // Créer un rappel automatique pour le coach
            scheduleReminders(code, event.id, event.matchDateTime);
        }
    } else {
        const team = appData.teams[user.teamCode];
        team.events.push(event);
        scheduleReminders(user.teamCode, event.id, event.matchDateTime);
    }
    
    saveData();
    closeEventModal();
    loadEvents();
    loadDashboard();
    updateReminderSelect();
    showToast('Événement créé !');
    
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventLocation').value = '';
    document.getElementById('eventNotes').value = '';
}

function loadEvents() {
    const container = document.getElementById('eventsList');
    const user = appData.currentUser;
    let events = [];
    
    if (user.role === 'admin') {
        for (let code in appData.teams) {
            events.push(...(appData.teams[code].events || []).map(e => ({...e, teamName: appData.teams[code].name, teamCode: code})));
        }
    } else {
        events = appData.teams[user.teamCode]?.events || [];
    }
    
    events.sort((a,b) => new Date(a.matchDateTime) - new Date(b.matchDateTime));
    
    if (events.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">🏆</div><p>Aucun événement</p></div>';
        return;
    }
    
    const isAdminOrCoach = (user.role === 'admin' || user.role === 'coach');
    const isPlayer = (user.role === 'player');
    
    container.innerHTML = events.map(event => {
        const matchDate = new Date(event.matchDateTime).toLocaleString('fr-FR');
        const callDate = new Date(event.callTime).toLocaleString('fr-FR');
        
        let attendanceHtml = '';
        if (isPlayer && !user.pendingApproval) {
            const team = appData.teams[user.teamCode];
            const player = team.players[user.playerId];
            // Le dernier parent qui répond détermine le statut
            const currentStatus = getPlayerCurrentStatus(user.teamCode, user.playerId, event.id);
            attendanceHtml = `
                <div class="status-buttons">
                    <button class="status-btn ${currentStatus === 'present' ? 'active' : ''}" onclick="setAttendance('${event.id}', 'present')">✅ Présent</button>
                    <button class="status-btn ${currentStatus === 'absent' ? 'active' 'absent' : ''}" onclick="setAttendance('${event.id}', 'absent')">❌ Absent</button>
                    <button class="status-btn ${currentStatus === 'waiting' ? 'active' : ''} waiting" onclick="setAttendance('${event.id}', 'waiting')">⏳ En attente</button>
                </div>
            `;
        } else if (isAdminOrCoach) {
            const teamCode = user.role === 'admin' ? event.teamCode : user.teamCode;
            const team = appData.teams[teamCode];
            const responses = Object.values(team.players || {}).map(p => {
                const status = event.attendances?.[p.id] || 'waiting';
                const icon = status === 'present' ? '✅' : status === 'absent' ? '❌' : '⏳';
                return `<span style="margin-right:8px;font-size:11px">${p.childName}: ${icon}</span>`;
            }).join('');
            attendanceHtml = `<div style="margin-top:12px;font-size:12px"><strong>Réponses:</strong><br>${responses || 'Aucune réponse'}</div>`;
        }
        
        return `
            <div class="event-card">
                <div class="event-header">
                    <span class="event-title">${escapeHtml(event.title)}</span>
                    <span class="event-badge">${getTypeLabel(event.type)}</span>
                </div>
                ${event.teamName ? `<div style="font-size:11px;color:#667eea;margin-bottom:8px">🏷️ ${event.teamName}</div>` : ''}
                <div class="event-details">
                    <div>📅 ${matchDate}</div>
                    <div>⏰ Convocation: ${callDate}</div>
                    <div>📍 ${escapeHtml(event.location)}</div>
                </div>
                ${event.notes ? `<div class="notes">📌 ${escapeHtml(event.notes)}</div>` : ''}
                ${attendanceHtml}
            </div>
        `;
    }).join('');
}

function setAttendance(eventId, status) {
    const user = appData.currentUser;
    if (user.role !== 'player' || user.pendingApproval) return;
    
    const team = appData.teams[user.teamCode];
    const event = team.events.find(e => e.id === eventId);
    if (!event) return;
    
    if (!event.attendances) event.attendances = {};
    
    // Enregistrer la réponse de ce parent
    if (!event.attendances[user.playerId]) {
        event.attendances[user.playerId] = {};
    }
    event.attendances[user.playerId][user.parentId] = status;
    
    // Déterminer le statut officiel (dernier parent ayant répondu)
    const player = team.players[user.playerId];
    let lastResponse = null;
    let lastTime = 0;
    
    for (let parent of player.parents) {
        const parentStatus = event.attendances[user.playerId]?.[parent.id];
        if (parentStatus) {
            // Simuler le timestamp pour le dernier répondant
            lastResponse = parentStatus;
        }
    }
    
    // Sauvegarder le statut officiel
    event.attendances[user.playerId].official = lastResponse || 'waiting';
    
    saveData();
    loadEvents();
    
    // Notifier l'autre parent
    for (let parent of player.parents) {
        if (parent.id !== user.parentId) {
            const notificationMsg = {
                id: Date.now().toString(),
                from: 'system',
                to: parent.id,
                text: `🔔 ${user.parentName} a répondu ${status === 'present' ? 'PRÉSENT' : status === 'absent' ? 'ABSENT' : 'EN ATTENTE'} pour ${event.title}`,
                timestamp: new Date().toISOString(),
                seen: false
            };
            if (!team.privateMessages) team.privateMessages = [];
            team.privateMessages.push(notificationMsg);
        }
    }
    
    showToast(`Réponse enregistrée : ${status === 'present' ? 'Présent' : status === 'absent' ? 'Absent' : 'En attente'}`);
}

function getPlayerCurrentStatus(teamCode, playerId, eventId) {
    const team = appData.teams[teamCode];
    const event = team.events.find(e => e.id === eventId);
    if (event?.attendances?.[playerId]?.official) {
        return event.attendances[playerId].official;
    }
    return 'waiting';
}

// ============ MESSAGES PRIVÉS ==========
function loadConversations() {
    const user = appData.currentUser;
    const container = document.getElementById('conversationsList');
    const team = appData.teams[user.teamCode];
    
    if (!team) return;
    
    // Récupérer toutes les conversations uniques
    const conversations = new Map();
    
    if (user.role === 'admin') {
        // Admin voit toutes les conversations de toutes les équipes
        for (let code in appData.teams) {
            const msgs = appData.teams[code].privateMessages || [];
            msgs.forEach(msg => {
                const otherId = msg.from === 'admin' ? msg.to : msg.from;
                if (!conversations.has(otherId)) {
                    conversations.set(otherId, {
                        id: otherId,
                        name: `Équipe ${appData.teams[code].name}`,
                        teamCode: code,
                        lastMessage: msg.text,
                        lastTime: msg.timestamp,
                        unread: !msg.seen && msg.to === 'admin'
                    });
                }
            });
        }
    } else if (user.role === 'coach') {
        // Coach voit les conversations avec les parents
        (team.privateMessages || []).forEach(msg => {
            const otherId = msg.from === 'coach' ? msg.to : msg.from;
            const player = Object.values(team.players || {}).find(p => 
                p.parents.some(parent => parent.id === otherId)
            );
            if (!conversations.has(otherId)) {
                conversations.set(otherId, {
                    id: otherId,
                    name: player ? `Parent de ${player.childName}` : otherId,
                    lastMessage: msg.text,
                    lastTime: msg.timestamp,
                    unread: !msg.seen && msg.to === 'coach'
                });
            }
        });
    } else if (user.role === 'player') {
        // Parent voit ses conversations
        (team.privateMessages || []).forEach(msg => {
            if (msg.from === user.parentId || msg.to === user.parentId) {
                const otherId = msg.from === user.parentId ? msg.to : msg.from;
                if (!conversations.has(otherId)) {
                    let name = otherId === 'coach' ? 'Coach' : otherId === 'admin' ? 'Administrateur' : 'Joueur';
                    conversations.set(otherId, {
                        id: otherId,
                        name: name,
                        lastMessage: msg.text,
                        lastTime: msg.timestamp,
                        unread: !msg.seen && msg.to === user.parentId
                    });
                }
            }
        });
    }
    
    const convArray = Array.from(conversations.values()).sort((a,b) => new Date(b.lastTime) - new Date(a.lastTime));
    
    if (convArray.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">💬</div><p>Aucune conversation</p></div>';
        return;
    }
    
    container.innerHTML = convArray.map(conv => `
        <div class="conversation-item" onclick="openConversation('${conv.id}', '${conv.name.replace(/'/g, "\\'")}')">
            <div class="conversation-avatar">${conv.name.charAt(0)}</div>
            <div class="conversation-info">
                <div class="conversation-name">${escapeHtml(conv.name)}</div>
                <div class="conversation-last">${escapeHtml(conv.lastMessage.substring(0, 40))}</div>
            </div>
            ${conv.unread ? '<div class="unread-indicator"></div>' : ''}
        </div>
    `).join('');
    
    updateUnreadBadge(convArray.filter(c => c.unread).length);
}

function openConversation(otherId, otherName) {
    const user = appData.currentUser;
    const team = appData.teams[user.teamCode];
    
    document.getElementById('chatHeader').innerHTML = `<span>💬 ${escapeHtml(otherName)}</span>`;
    document.getElementById('chatInputArea').classList.remove('hidden');
    
    // Marquer comme lu
    (team.privateMessages || []).forEach(msg => {
        if ((msg.from === otherId && msg.to === user.parentId) || 
            (msg.to === otherId && msg.from === user.parentId)) {
            if (msg.to === user.parentId && !msg.seen) {
                msg.seen = true;
            }
        }
    });
    saveData();
    
    // Afficher les messages
    const messages = (team.privateMessages || []).filter(msg => 
        (msg.from === otherId && msg.to === user.parentId) || 
        (msg.to === otherId && msg.from === user.parentId) ||
        (msg.from === otherId && msg.to === 'coach') ||
        (msg.to === otherId && msg.from === 'coach')
    ).sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    const chatContainer = document.getElementById('chatMessages');
    if (messages.length === 0) {
        chatContainer.innerHTML = '<div class="empty-state"><p>Aucun message</p></div>';
    } else {
        const currentParentId = user.parentId;
        chatContainer.innerHTML = messages.map(msg => {
            const isSent = msg.from === currentParentId || (msg.from === 'coach' && user.role === 'coach') || (msg.from === 'admin');
            return `
                <div class="chat-message ${isSent ? 'sent' : 'received'}">
                    <div>${escapeHtml(msg.text)}</div>
                    <div class="message-meta">
                        <span>${new Date(msg.timestamp).toLocaleTimeString()}</span>
                        ${msg.seen ? '<span class="seen-badge">✓✓</span>' : '<span class="seen-badge">✓</span>'}
                    </div>
                </div>
            `;
        }).join('');
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    
    window.currentConversation = { otherId, otherName };
}

function sendPrivateMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    if (!text || !window.currentConversation) return;
    
    const user = appData.currentUser;
    const team = appData.teams[user.teamCode];
    const { otherId, otherName } = window.currentConversation;
    
    const message = {
        id: Date.now().toString(),
        from: user.role === 'admin' ? 'admin' : (user.role === 'coach' ? 'coach' : user.parentId),
        to: otherId,
        text: text,
        timestamp: new Date().toISOString(),
        seen: false
    };
    
    if (!team.privateMessages) team.privateMessages = [];
    team.privateMessages.push(message);
    saveData();
    
    input.value = '';
    openConversation(otherId, otherName);
    loadConversations();
}

function updateUnreadBadge(count) {
    const badge = document.getElementById('unreadBadge');
    if (count > 0) {
        badge.innerText = count > 9 ? '9+' : count;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

// ============ GESTION DE L'ÉQUIPE ==========
function loadTeamMembers() {
    const user = appData.currentUser;
    if (user.role === 'admin') {
        // Admin voit un résumé
        document.getElementById('teamMembersList').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👑</div>
                <p>Mode admin - Sélectionnez une équipe pour gérer</p>
            </div>
        `;
        return;
    }
    
    const team = appData.teams[user.teamCode];
    const players = Object.values(team.players || {});
    const isCoach = user.role === 'coach';
    
    const container = document.getElementById('teamMembersList');
    if (players.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">👥</div><p>Aucun joueur</p></div>';
    } else {
        container.innerHTML = players.map(player => `
            <div class="member-card">
                <div class="member-info">
                    <div class="member-avatar">⚽</div>
                    <div>
                        <div class="member-name">${escapeHtml(player.childName)}</div>
                        <div class="parents-badge">${player.parents.length} parent(s)</div>
                    </div>
                </div>
                ${isCoach ? `
                    <div>
                        ${player.pendingApproval ? 
                            `<button class="approve-btn" onclick="approvePlayer('${player.id}')">Approuver</button>` : 
                            `<button class="remove-btn" onclick="removePlayer('${player.id}')">Retirer</button>`
                        }
                    </div>
                ` : ''}
            </div>
        `).join('');
    }
    
    // Demandes en attente (coach uniquement)
    const pendingContainer = document.getElementById('pendingRequestsCard');
    const pendingList = document.getElementById('pendingRequestsList');
    const pendingPlayers = players.filter(p => p.pendingApproval);
    
    if (isCoach && pendingPlayers.length > 0) {
        pendingContainer.classList.remove('hidden');
        pendingList.innerHTML = pendingPlayers.map(p => `
            <div class="member-card">
                <div class="member-info">
                    <div class="member-avatar">⏳</div>
                    <div>
                        <div class="member-name">${escapeHtml(p.childName)}</div>
                        <div class="parents-badge">Parent: ${escapeHtml(p.parents[0]?.name || '?')}</div>
                    </div>
                </div>
                <button class="approve-btn" onclick="approvePlayer('${p.id}')">✅ Approuver</button>
            </div>
        `).join('');
    } else {
        pendingContainer.classList.add('hidden');
    }
}

function approvePlayer(playerId) {
    const user = appData.currentUser;
    const team = appData.teams[user.teamCode];
    if (team.players[playerId]) {
        team.players[playerId].pendingApproval = false;
        
        // Si c'est le parent courant qui est approuvé
        if (user.role === 'player' && user.playerId === playerId) {
            user.pendingApproval = false;
        }
        
        saveData();
        loadTeamMembers();
        showToast(`Joueur approuvé !`);
    }
}

function removePlayer(playerId) {
    const team = appData.teams[appData.currentUser.teamCode];
    if (confirm('Retirer ce joueur ?')) {
        delete team.players[playerId];
        saveData();
        loadTeamMembers();
        showToast('Joueur retiré');
    }
}

// ============ RAPPELS PROGRAMMÉS ==========
function updateReminderSelect() {
    const user = appData.currentUser;
    const select = document.getElementById('reminderEventSelect');
    if (!select) return;
    
    let events = [];
    if (user.role === 'admin') {
        for (let code in appData.teams) {
            events.push(...(appData.teams[code].events || []).map(e => ({...e, teamCode: code})));
        }
    } else {
        events = appData.teams[user.teamCode]?.events || [];
    }
    
    select.innerHTML = '<option value="">Choisir un événement</option>' + 
        events.map(e => `<option value="${e.id}" data-team="${e.teamCode || user.teamCode}">${escapeHtml(e.title)} - ${new Date(e.matchDateTime).toLocaleDateString()}</option>`).join('');
}

function handleReminderClick(e) {
    const days = parseInt(e.currentTarget.dataset.days);
    const select = document.getElementById('reminderEventSelect');
    const eventId = select.value;
    
    if (!eventId) {
        showToast('Sélectionnez un événement');
        return;
    }
    
    const user = appData.currentUser;
    let teamCode, event;
    
    if (user.role === 'admin') {
        const selectedOption = select.options[select.selectedIndex];
        teamCode = selectedOption.dataset.team;
        event = appData.teams[teamCode].events.find(e => e.id === eventId);
    } else {
        teamCode = user.teamCode;
        event = appData.teams[teamCode].events.find(e => e.id === eventId);
    }
    
    if (!event) return;
    
    scheduleReminder(teamCode, eventId, event.matchDateTime, days);
    showToast(`Rappel programmé ${days} jours avant l'événement`);
    loadActiveReminders();
}

function scheduleReminders(teamCode, eventId, matchDateTime) {
    const days = [7, 5, 3, 2, 1];
    days.forEach(daysBefore => {
        scheduleReminder(teamCode, eventId, matchDateTime, daysBefore);
    });
}

function scheduleReminder(teamCode, eventId, matchDateTime, daysBefore) {
    const team = appData.teams[teamCode];
    if (!team.reminders) team.reminders = [];
    
    const reminderDate = new Date(matchDateTime);
    reminderDate.setDate(reminderDate.getDate() - daysBefore);
    
    // Vérifier si le rappel n'existe pas déjà
    const exists = team.reminders.some(r => r.eventId === eventId && r.daysBefore === daysBefore);
    if (!exists) {
        team.reminders.push({
            eventId: eventId,
            daysBefore: daysBefore,
            scheduledAt: reminderDate.toISOString(),
            sent: false
        });
    }
    saveData();
    checkReminders(); // Vérifier immédiatement
}

function loadActiveReminders() {
    const user = appData.currentUser;
    const container = document.getElementById('activeReminders');
    if (!container) return;
    
    let reminders = [];
    if (user.role === 'admin') {
        for (let code in appData.teams) {
            reminders.push(...(appData.teams[code].reminders || []).map(r => ({...r, teamName: appData.teams[code].name})));
        }
    } else {
        reminders = appData.teams[user.teamCode]?.reminders || [];
    }
    
    if (reminders.length === 0) {
        container.innerHTML = '<div class="empty-state"><small>Aucun rappel programmé</small></div>';
        return;
    }
    
    container.innerHTML = reminders.map(r => `
        <div class="reminder-item">
            <span>📅 ${r.daysBefore} jours avant</span>
            <small>${r.sent ? '✅ Envoyé' : '⏳ En attente'}</small>
        </div>
    `).join('');
}

function checkReminders() {
    const now = new Date();
    for (let teamCode in appData.teams) {
        const team = appData.teams[teamCode];
        if (!team.reminders) continue;
        
        for (let reminder of team.reminders) {
            if (!reminder.sent && new Date(reminder.scheduledAt) <= now) {
                // Envoyer le rappel
                const event = team.events.find(e => e.id === reminder.eventId);
                if (event) {
                    const reminderMessage = {
                        id: Date.now().toString(),
                        author: '⏰ Rappel automatique',
                        authorId: 'system',
                        text: `🔔 RAPPEL: Événement "${event.title}" dans ${reminder.daysBefore} jours (le ${new Date(event.matchDateTime).toLocaleDateString()})`,
                        timestamp: new Date().toISOString(),
                        isSystem: true
                    };
                    if (!team.messages) team.messages = [];
                    team.messages.unshift(reminderMessage);
                    reminder.sent = true;
                }
            }
        }
    }
    saveData();
}

// Vérifier les rappels toutes les heures
setInterval(checkReminders, 60 * 60 * 1000);
checkReminders();

// ============ ADMIN GLOBAL ==========
function loadAllTeamsForAdmin() {
    const user = appData.currentUser;
    if (user.role !== 'admin') return;
    
    const container = document.getElementById('allTeamsAdminList');
    if (!container) return;
    
    container.innerHTML = Object.entries(appData.teams).map(([code, team]) => `
        <div class="admin-team-card">
            <div class="admin-team-header">
                <div class="admin-team-icon">⚽</div>
                <div>
                    <h4>${escapeHtml(team.name)}</h4>
                    <small>Code: ${code}</small>
                </div>
            </div>
            <div class="admin-team-stats">
                <span>👥 ${Object.keys(team.players || {}).length} joueurs</span>
                <span>🏆 ${(team.events || []).length} événements</span>
                <span>💬 ${(team.messages || []).length + (team.privateMessages || []).length} messages</span>
            </div>
            <button class="remove-btn" onclick="deleteTeamAdmin('${code}')">🗑️ Supprimer l'équipe</button>
        </div>
    `).join('');
}

function showGlobalMessageModal() {
    document.getElementById('globalMessageModal')?.classList.remove('hidden');
}

function closeGlobalMessageModal() {
    document.getElementById('globalMessageModal')?.classList.add('hidden');
}

function sendGlobalMessage() {
    const text = document.getElementById('globalMessageText')?.value.trim();
    if (!text) return;
    
    for (let code in appData.teams) {
        const team = appData.teams[code];
        const globalMsg = {
            id: Date.now().toString() + code,
            author: '👑 ADMIN GLOBAL',
            authorId: 'admin',
            text: `🌍 [ADMIN] ${text}`,
            timestamp: new Date().toISOString(),
            isSystem: true
        };
        if (!team.messages) team.messages = [];
        team.messages.unshift(globalMsg);
    }
    
    saveData();
    closeGlobalMessageModal();
    document.getElementById('globalMessageText').value = '';
    showToast('Message envoyé à toutes les équipes !');
}

function deleteTeamAdmin(teamCode) {
    if (confirm(`Supprimer définitivement l'équipe ${appData.teams[teamCode].name} ?`)) {
        delete appData.teams[teamCode];
        saveData();
        loadAllTeamsForAdmin();
        showToast('Équipe supprimée');
    }
}

// ============ UTILITAIRES ==========
function getTypeLabel(type) {
    const map = {
        'match_amical': '⚽ Amical',
        'coupe': '🏆 Coupe',
        'tournoi': '🎯 Tournoi',
        'match_officiel': '📋 Officiel',
        'entrainement': '🏋️ Entraînement'
    };
    return map[type] || 'Événement';
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Exposer les fonctions globalement
window.showPlayerLogin = showPlayerLogin;
window.showCoachLogin = showCoachLogin;
window.showAdminLogin = showAdminLogin;
window.showCreateTeam = showCreateTeam;
window.loginAsAdmin = loginAsAdmin;
window.loginAsCoach = loginAsCoach;
window.loginAsPlayer = loginAsPlayer;
window.createTeam = createTeam;
window.showEventModal = showEventModal;
window.closeEventModal = closeEventModal;
window.createEvent = createEvent;
window.setAttendance = setAttendance;
window.approvePlayer = approvePlayer;
window.removePlayer = removePlayer;
window.deleteTeamAdmin = deleteTeamAdmin;
window.showGlobalMessageModal = showGlobalMessageModal;
window.closeGlobalMessageModal = closeGlobalMessageModal;
window.sendGlobalMessage = sendGlobalMessage;
window.hideAllForms = hideAllForms;
window.openConversation = openConversation;
window.sendPrivateMessage = sendPrivateMessage;
window.logout = logout;

// ============ DÉMARRAGE ==========
loadData();

document.addEventListener('DOMContentLoaded', function() {
    if (appData.currentUser) {
        showMainApp();
    } else {
        document.getElementById('loginScreen')?.classList.remove('hidden');
        document.getElementById('mainApp')?.classList.add('hidden');
    }
});