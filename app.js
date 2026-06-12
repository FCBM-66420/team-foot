// ============ STRUCTURE DE DONNÉES ==========
let appData = {
    admin: {
        password: "admin123"
    },
    teams: {}
};

let currentUser = null;
let currentTeamCode = null;

// ============ INITIALISATION ==========
function loadData() {
    const saved = localStorage.getItem('teamfoot_data');
    if (saved) {
        appData = JSON.parse(saved);
    } else {
        appData.teams = {
            "TIGERS24": {
                name: "Tigres FC",
                coachPassword: "coach123",
                players: {},
                events: [],
                messages: [],
                pendingPlayers: {}
            }
        };
        saveData();
    }
}

function saveData() {
    localStorage.setItem('teamfoot_data', JSON.stringify(appData));
}

function showToast(message, duration = 2500) {
    let toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), duration);
}

// ============ ÉCRAN DE CONNEXION ==========
function hideAllForms() {
    const playerForm = document.getElementById('playerJoinForm');
    const coachForm = document.getElementById('coachLoginForm');
    const createForm = document.getElementById('createTeamForm');
    const adminForm = document.getElementById('adminLoginForm');
    
    if (playerForm) playerForm.classList.add('hidden');
    if (coachForm) coachForm.classList.add('hidden');
    if (createForm) createForm.classList.add('hidden');
    if (adminForm) adminForm.classList.add('hidden');
}

function showJoinTeam() {
    hideAllForms();
    const form = document.getElementById('playerJoinForm');
    if (form) form.classList.remove('hidden');
}

function showCoachLogin() {
    hideAllForms();
    const form = document.getElementById('coachLoginForm');
    if (form) form.classList.remove('hidden');
}

function showAdminLogin() {
    hideAllForms();
    const form = document.getElementById('adminLoginForm');
    if (form) form.classList.remove('hidden');
}

function showCreateTeam() {
    hideAllForms();
    const form = document.getElementById('createTeamForm');
    if (form) form.classList.remove('hidden');
}

function loginAsAdmin() {
    const codeInput = document.getElementById('adminCode');
    if (!codeInput) return;
    
    const code = codeInput.value;
    if (code === appData.admin.password) {
        currentUser = { role: 'admin' };
        saveData();
        showMainApp();
        showToast('👑 Bienvenue Administrateur');
    } else {
        showToast('Code admin incorrect');
    }
}

function loginAsCoach() {
    const teamCodeInput = document.getElementById('coachTeamCode');
    const passwordInput = document.getElementById('coachPassword');
    
    if (!teamCodeInput || !passwordInput) return;
    
    const teamCode = teamCodeInput.value.toUpperCase();
    const password = passwordInput.value;
    
    if (appData.teams[teamCode] && appData.teams[teamCode].coachPassword === password) {
        currentUser = { role: 'coach', teamCode: teamCode };
        currentTeamCode = teamCode;
        saveData();
        showMainApp();
        showToast(`👥 Bienvenue coach de ${appData.teams[teamCode].name}`);
    } else {
        showToast('Code équipe ou mot de passe incorrect');
    }
}

function requestToJoin() {
    const teamCodeInput = document.getElementById('playerTeamCode');
    const playerNameInput = document.getElementById('playerName');
    
    if (!teamCodeInput || !playerNameInput) return;
    
    const teamCode = teamCodeInput.value.toUpperCase();
    const playerName = playerNameInput.value.trim();
    
    if (!appData.teams[teamCode]) {
        showToast('Code équipe invalide');
        return;
    }
    if (!playerName) {
        showToast('Entrez votre nom');
        return;
    }
    
    const playerId = 'p_' + Date.now();
    if (!appData.teams[teamCode].pendingPlayers) {
        appData.teams[teamCode].pendingPlayers = {};
    }
    appData.teams[teamCode].pendingPlayers[playerId] = {
        name: playerName,
        requestedAt: new Date().toISOString()
    };
    saveData();
    showToast('✅ Demande envoyée ! Le coach va valider votre inscription.');
    
    teamCodeInput.value = '';
    playerNameInput.value = '';
    hideAllForms();
}

function createTeam() {
    const teamNameInput = document.getElementById('newTeamName');
    const teamCodeInput = document.getElementById('newTeamCode');
    const coachPasswordInput = document.getElementById('newCoachPassword');
    
    if (!teamNameInput || !teamCodeInput || !coachPasswordInput) return;
    
    const teamName = teamNameInput.value.trim();
    const teamCode = teamCodeInput.value.toUpperCase();
    const coachPassword = coachPasswordInput.value;
    
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
        pendingPlayers: {}
    };
    saveData();
    showToast(`✅ Équipe "${teamName}" créée !`);
    showCoachLogin();
}

// ============ AFFICHAGE PRINCIPAL ==========
function showMainApp() {
    const splash = document.getElementById('splashScreen');
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    
    if (splash) splash.classList.add('hidden');
    if (loginScreen) loginScreen.classList.add('hidden');
    if (mainApp) mainApp.classList.remove('hidden');
    
    const isAdmin = currentUser.role === 'admin';
    const isCoach = currentUser.role === 'coach';
    
    const fabButton = document.getElementById('fabButton');
    if (fabButton) fabButton.style.display = (isAdmin || isCoach) ? 'block' : 'none';
    
    const adminNavBtn = document.getElementById('adminNavBtn');
    if (adminNavBtn) adminNavBtn.style.display = isAdmin ? 'flex' : 'none';
    
    const coachActionsCard = document.getElementById('coachActionsCard');
    if (coachActionsCard) coachActionsCard.style.display = (isAdmin || isCoach) ? 'block' : 'none';
    
    const teamNameEl = document.getElementById('teamName');
    const userRoleLabel = document.getElementById('userRoleLabel');
    const teamAvatar = document.getElementById('teamAvatar');
    const welcomeMessage = document.getElementById('welcomeMessage');
    
    if (isAdmin) {
        if (teamNameEl) teamNameEl.innerHTML = 'Team-Foot';
        if (userRoleLabel) userRoleLabel.innerHTML = 'Super Admin';
        if (teamAvatar) teamAvatar.innerHTML = '👑';
        if (welcomeMessage) welcomeMessage.innerHTML = 'Bonjour Administrateur 👋';
    } else if (isCoach) {
        const team = appData.teams[currentUser.teamCode];
        if (teamNameEl) teamNameEl.innerHTML = team.name;
        if (userRoleLabel) userRoleLabel.innerHTML = 'Coach';
        if (teamAvatar) teamAvatar.innerHTML = '👥';
        if (welcomeMessage) welcomeMessage.innerHTML = `Bonjour Coach ${team.name} 👋`;
    }
    
    loadEvents();
    loadMessages();
    loadTeamView();
    
    if (isAdmin) {
        loadAllTeams();
    }
    
    setupEventListeners();
    updateEventSelector();
}

function setupEventListeners() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.removeEventListener('click', handleNavClick);
        item.addEventListener('click', handleNavClick);
    });
    
    const sendBtn = document.getElementById('sendMessageBtn');
    if (sendBtn) {
        sendBtn.removeEventListener('click', sendMessage);
        sendBtn.addEventListener('click', sendMessage);
    }
    
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.removeEventListener('keypress', handleMessageKeypress);
        messageInput.addEventListener('keypress', handleMessageKeypress);
    }
    
    const logoutBtn = document.getElementById('logoutBtnMain');
    if (logoutBtn) {
        logoutBtn.removeEventListener('click', logout);
        logoutBtn.addEventListener('click', logout);
    }
}

function handleNavClick(e) {
    const item = e.currentTarget;
    const view = item.dataset.view;
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    item.classList.add('active');
    const targetView = document.getElementById(`${view}View`);
    if (targetView) targetView.classList.add('active');
    
    if (view === 'messages') loadMessages();
    if (view === 'team') loadTeamView();
    if (view === 'admin') loadAllTeams();
}

function handleMessageKeypress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function logout() {
    currentUser = null;
    currentTeamCode = null;
    
    const splash = document.getElementById('splashScreen');
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    
    if (splash) splash.classList.add('hidden');
    if (mainApp) mainApp.classList.add('hidden');
    if (loginScreen) loginScreen.classList.remove('hidden');
    
    const adminCode = document.getElementById('adminCode');
    const coachTeamCode = document.getElementById('coachTeamCode');
    const coachPassword = document.getElementById('coachPassword');
    const playerTeamCode = document.getElementById('playerTeamCode');
    const playerName = document.getElementById('playerName');
    
    if (adminCode) adminCode.value = '';
    if (coachTeamCode) coachTeamCode.value = '';
    if (coachPassword) coachPassword.value = '';
    if (playerTeamCode) playerTeamCode.value = '';
    if (playerName) playerName.value = '';
    
    hideAllForms();
}

// ============ GESTION DES ÉVÉNEMENTS ==========
function showCreateEventModal() {
    const modal = document.getElementById('eventModal');
    if (modal) modal.classList.remove('hidden');
    
    const now = new Date();
    const defaultMatch = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const defaultCall = new Date(defaultMatch.getTime() - 2 * 60 * 60 * 1000);
    
    const matchInput = document.getElementById('modalMatchDateTime');
    const callInput = document.getElementById('modalCallTime');
    
    if (matchInput) matchInput.value = defaultMatch.toISOString().slice(0, 16);
    if (callInput) callInput.value = defaultCall.toISOString().slice(0, 16);
}

function closeEventModal() {
    const modal = document.getElementById('eventModal');
    if (modal) modal.classList.add('hidden');
}

function createEventFromModal() {
    const typeSelect = document.getElementById('modalEventType');
    const titleInput = document.getElementById('modalEventTitle');
    const matchInput = document.getElementById('modalMatchDateTime');
    const callInput = document.getElementById('modalCallTime');
    const locationInput = document.getElementById('modalLocation');
    const notesInput = document.getElementById('modalNotes');
    
    if (!typeSelect || !titleInput || !matchInput || !callInput || !locationInput) return;
    
    const event = {
        id: Date.now().toString(),
        type: typeSelect.value,
        title: titleInput.value.trim(),
        matchDateTime: matchInput.value,
        callTime: callInput.value,
        location: locationInput.value.trim(),
        notes: notesInput ? notesInput.value.trim() : '',
        attendances: {}
    };
    
    if (!event.title || !event.matchDateTime || !event.callTime || !event.location) {
        showToast('Veuillez remplir tous les champs');
        return;
    }
    
    if (new Date(event.callTime) >= new Date(event.matchDateTime)) {
        showToast('La convocation doit être avant le match');
        return;
    }
    
    if (currentUser.role === 'admin') {
        for (let code in appData.teams) {
            if (!appData.teams[code].events) appData.teams[code].events = [];
            appData.teams[code].events.unshift({...event});
        }
    } else {
        const team = appData.teams[currentUser.teamCode];
        if (!team.events) team.events = [];
        team.events.unshift(event);
    }
    
    saveData();
    closeEventModal();
    loadEvents();
    updateEventSelector();
    showToast('Événement créé avec succès !');
    
    if (titleInput) titleInput.value = '';
    if (locationInput) locationInput.value = '';
    if (notesInput) notesInput.value = '';
}

function loadEvents() {
    const container = document.getElementById('eventsList');
    if (!container) return;
    
    let events = [];
    
    if (currentUser.role === 'admin') {
        for (let code in appData.teams) {
            const teamEvents = (appData.teams[code].events || []).map(e => ({
                ...e,
                teamName: appData.teams[code].name
            }));
            events.push(...teamEvents);
        }
        events.sort((a,b) => new Date(a.matchDateTime) - new Date(b.matchDateTime));
    } else if (currentUser.role === 'coach') {
        const team = appData.teams[currentUser.teamCode];
        if (team) {
            events = (team.events || []).sort((a,b) => new Date(a.matchDateTime) - new Date(b.matchDateTime));
        }
    }
    
    if (events.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📅</div>
                <p>Aucun événement programmé</p>
                ${(currentUser.role === 'coach' || currentUser.role === 'admin') ? 
                    '<button class="btn-primary" onclick="window.showCreateEventModal()" style="margin-top:16px">➕ Créer un événement</button>' : 
                    '<small>Revenez plus tard</small>'}
            </div>
        `;
        return;
    }
    
    const isAdminOrCoach = (currentUser.role === 'admin' || currentUser.role === 'coach');
    
    container.innerHTML = events.map(event => {
        const matchDate = new Date(event.matchDateTime).toLocaleString('fr-FR', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
        const callDate = new Date(event.callTime).toLocaleString('fr-FR', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
        
        let attendanceHtml = '';
        if (isAdminOrCoach) {
            attendanceHtml = `<div style="margin-top:12px; padding-top:12px; border-top:1px solid #e2e8f0; font-size:12px; color:#64748b;">
                📊 Les joueurs pourront répondre Présent/Absent/En attente</div>`;
        }
        
        return `
            <div class="event-card">
                <div class="event-header">
                    <span class="event-title">${escapeHtml(event.title)}</span>
                    <span class="event-badge">${getTypeLabel(event.type)}</span>
                </div>
                ${event.teamName ? `<div style="font-size:11px; color:#1a73e8; margin-bottom:8px;">🏷️ ${escapeHtml(event.teamName)}</div>` : ''}
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

function updateEventSelector() {
    const selector = document.getElementById('eventSelector');
    if (!selector) return;
    
    let events = [];
    if (currentUser.role === 'admin') {
        for (let code in appData.teams) {
            events.push(...(appData.teams[code].events || []).map(e => ({...e, teamCode: code})));
        }
    } else if (currentUser.role === 'coach') {
        const team = appData.teams[currentUser.teamCode];
        events = team.events || [];
    }
    
    selector.innerHTML = '<option value="">Sélectionner un événement</option>' + 
        events.map(e => `<option value="${e.id}">${escapeHtml(e.title)} - ${new Date(e.matchDateTime).toLocaleDateString()}</option>`).join('');
}

function notifyNonResponders() {
    const selector = document.getElementById('eventSelector');
    if (!selector) return;
    
    const eventId = selector.value;
    if (!eventId) {
        showToast('Sélectionnez un événement');
        return;
    }
    
    let team, event;
    if (currentUser.role === 'admin') {
        for (let code in appData.teams) {
            const ev = (appData.teams[code].events || []).find(e => e.id === eventId);
            if (ev) {
                team = appData.teams[code];
                event = ev;
                break;
            }
        }
    } else {
        team = appData.teams[currentUser.teamCode];
        event = team.events.find(e => e.id === eventId);
    }
    
    if (!event || !team) return;
    
    const message = {
        id: Date.now().toString(),
        author: '📢 Coach',
        authorId: 'coach',
        text: `⏰ RAPPEL: Merci de répondre pour "${event.title}" du ${new Date(event.matchDateTime).toLocaleDateString()}`,
        timestamp: new Date().toISOString(),
        isSystem: true
    };
    
    if (!team.messages) team.messages = [];
    team.messages.unshift(message);
    saveData();
    
    showToast(`📢 Relance envoyée dans le vestiaire`);
    loadMessages();
}

// ============ MESSAGES ==========
function sendMessage() {
    const textarea = document.getElementById('messageInput');
    if (!textarea) return;
    
    const text = textarea.value.trim();
    if (!text) return;
    
    let team;
    if (currentUser.role === 'admin') {
        for (let code in appData.teams) {
            team = appData.teams[code];
            const message = {
                id: Date.now() + code,
                author: '👑 Admin général',
                authorId: 'admin',
                text: text,
                timestamp: new Date().toISOString()
            };
            if (!team.messages) team.messages = [];
            team.messages.unshift(message);
        }
    } else {
        team = appData.teams[currentUser.teamCode];
        const author = currentUser.role === 'coach' ? `👥 Coach` : 'Joueur';
        const message = {
            id: Date.now().toString(),
            author: author,
            authorId: currentUser.role,
            text: text,
            timestamp: new Date().toISOString()
        };
        if (!team.messages) team.messages = [];
        team.messages.unshift(message);
    }
    
    saveData();
    textarea.value = '';
    loadMessages();
    showToast('Message envoyé !');
}

function loadMessages() {
    const container = document.getElementById('messagesList');
    if (!container) return;
    
    let messages = [];
    if (currentUser.role === 'admin') {
        for (let code in appData.teams) {
            const teamMessages = (appData.teams[code].messages || []).map(m => ({
                ...m,
                teamName: appData.teams[code].name
            }));
            messages.push(...teamMessages);
        }
        messages.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else if (currentUser.role === 'coach') {
        const team = appData.teams[currentUser.teamCode];
        if (team) {
            messages = (team.messages || []).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
    }
    
    if (messages.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">💬</div><p>Aucun message</p><small>Soyez le premier à écrire !</small></div>';
        return;
    }
    
    container.innerHTML = messages.map(m => `
        <div class="message ${m.isSystem ? 'system' : ''}">
            <div class="message-header">
                <span class="message-author">${escapeHtml(m.author)}</span>
                ${m.teamName ? `<span style="font-size:10px; color:#1a73e8;">${escapeHtml(m.teamName)}</span>` : ''}
                <span style="font-size:10px;">${new Date(m.timestamp).toLocaleTimeString()}</span>
            </div>
            <div class="message-text">${escapeHtml(m.text)}</div>
        </div>
    `).join('');
}

// ============ GESTION DE L'ÉQUIPE ==========
function loadTeamView() {
    if (currentUser.role === 'admin') {
        const firstTeam = Object.values(appData.teams)[0];
        if (firstTeam) {
            displayTeamStats(firstTeam);
            displayPlayersList(firstTeam);
            displayPendingRequests(firstTeam);
        }
    } else if (currentUser.role === 'coach') {
        const team = appData.teams[currentUser.teamCode];
        if (team) {
            displayTeamStats(team);
            displayPlayersList(team);
            displayPendingRequests(team);
        }
    }
}

function displayTeamStats(team) {
    const playerCount = Object.keys(team.players || {}).length;
    const eventCount = (team.events || []).length;
    
    const playerCountEl = document.getElementById('playerCount');
    const eventCountEl = document.getElementById('eventCount');
    const responseRateEl = document.getElementById('responseRate');
    const playersBadge = document.getElementById('playersBadge');
    
    if (playerCountEl) playerCountEl.innerHTML = playerCount;
    if (eventCountEl) eventCountEl.innerHTML = eventCount;
    if (responseRateEl) responseRateEl.innerHTML = `0%`;
    if (playersBadge) playersBadge.innerHTML = `${playerCount} joueurs`;
}

function displayPlayersList(team) {
    const container = document.getElementById('playersList');
    if (!container) return;
    
    const players = Object.entries(team.players || {}).map(([id, p]) => ({id, ...p}));
    
    if (players.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">👥</div><p>Aucun joueur</p><small>Les joueurs doivent faire une demande</small></div>';
        return;
    }
    
    container.innerHTML = players.map(p => `
        <div class="player-card">
            <span class="player-name">${escapeHtml(p.name)}</span>
            <div>
                <span class="player-status">Membre</span>
                <button class="remove-btn" onclick="window.removePlayer('${p.id}')">❌</button>
            </div>
        </div>
    `).join('');
}

function displayPendingRequests(team) {
    const container = document.getElementById('pendingRequestsCard');
    const requestsList = document.getElementById('requestsList');
    const pending = Object.entries(team.pendingPlayers || {});
    
    if (!container || !requestsList) return;
    
    if (pending.length === 0) {
        container.classList.add('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    requestsList.innerHTML = pending.map(([id, p]) => `
        <div class="player-card">
            <span class="player-name">🕐 ${escapeHtml(p.name)}</span>
            <button class="approve-btn" onclick="window.approvePlayer('${id}')">✅ Approuver</button>
        </div>
    `).join('');
}

function approvePlayer(playerId) {
    let team;
    if (currentUser.role === 'admin') {
        team = Object.values(appData.teams)[0];
    } else {
        team = appData.teams[currentUser.teamCode];
    }
    
    if (!team) return;
    
    const playerData = team.pendingPlayers[playerId];
    if (playerData) {
        if (!team.players) team.players = {};
        team.players[playerId] = {
            id: playerId,
            name: playerData.name,
            joinedAt: new Date().toISOString()
        };
        delete team.pendingPlayers[playerId];
        saveData();
        loadTeamView();
        
        showToast(`${playerData.name} a rejoint l'équipe !`);
    }
}

function removePlayer(playerId) {
    let team;
    if (currentUser.role === 'admin') {
        team = Object.values(appData.teams)[0];
    } else {
        team = appData.teams[currentUser.teamCode];
    }
    
    if (!team) return;
    
    const player = team.players[playerId];
    if (player && confirm(`Retirer ${player.name} de l'équipe ?`)) {
        delete team.players[playerId];
        saveData();
        loadTeamView();
        showToast(`${player.name} a été retiré`);
    }
}

// ============ ADMIN ==========
function loadAllTeams() {
    const container = document.getElementById('allTeamsList');
    if (!container) return;
    
    if (Object.keys(appData.teams).length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">🏆</div><p>Aucune équipe</p></div>';
        return;
    }
    
    container.innerHTML = Object.entries(appData.teams).map(([code, team]) => `
        <div class="team-card-mobile">
            <div class="team-card-header">
                <div class="team-avatar-small">⚽</div>
                <div>
                    <h4>${escapeHtml(team.name)}</h4>
                    <p class="team-code">Code: ${code}</p>
                </div>
            </div>
            <div class="team-stats-mini">
                <span>👥 ${Object.keys(team.players || {}).length}</span>
                <span>📅 ${(team.events || []).length}</span>
                <span>💬 ${(team.messages || []).length}</span>
            </div>
            <button class="btn-danger-small" onclick="window.deleteTeam('${code}')">🗑️ Supprimer</button>
        </div>
    `).join('');
}

function showCreateTeamModal() {
    showCreateTeam();
}

function deleteTeam(teamCode) {
    if (confirm(`Supprimer définitivement l'équipe ${appData.teams[teamCode].name} ?`)) {
        delete appData.teams[teamCode];
        saveData();
        loadAllTeams();
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
window.showJoinTeam = showJoinTeam;
window.showCoachLogin = showCoachLogin;
window.showAdminLogin = showAdminLogin;
window.showCreateTeam = showCreateTeam;
window.loginAsAdmin = loginAsAdmin;
window.loginAsCoach = loginAsCoach;
window.requestToJoin = requestToJoin;
window.createTeam = createTeam;
window.showCreateEventModal = showCreateEventModal;
window.closeEventModal = closeEventModal;
window.createEventFromModal = createEventFromModal;
window.notifyNonResponders = notifyNonResponders;
window.approvePlayer = approvePlayer;
window.removePlayer = removePlayer;
window.deleteTeam = deleteTeam;
window.showCreateTeamModal = showCreateTeamModal;
window.hideAllForms = hideAllForms;

// ============ DÉMARRAGE ==========
loadData();

document.addEventListener('DOMContentLoaded', function() {
    // Cacher le splash après 1.5s
    setTimeout(function() {
        const splash = document.getElementById('splashScreen');
        if (splash) splash.classList.add('hidden');
    }, 1500);
    
    // S'assurer que l'écran de connexion est visible
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    if (loginScreen) loginScreen.classList.remove('hidden');
    if (mainApp) mainApp.classList.add('hidden');
});