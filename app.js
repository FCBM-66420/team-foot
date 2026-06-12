// ============ STRUCTURE DE DONNÉES ============
let appData = {
    admin: {
        password: "admin123"
    },
    teams: {}
};

let currentUser = null;
let currentTeamCode = null;

// ============ INITIALISATION ============
function loadData() {
    const saved = localStorage.getItem('teamfoot_data');
    if (saved) {
        appData = JSON.parse(saved);
    } else {
        // Équipe de démo
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
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), duration);
}

// ============ ÉCRAN DE CONNEXION ============
function hideAllForms() {
    document.getElementById('playerJoinForm').classList.add('hidden');
    document.getElementById('coachLoginForm').classList.add('hidden');
    document.getElementById('createTeamForm').classList.add('hidden');
    document.getElementById('adminLoginForm').classList.add('hidden');
}

function showJoinTeam() {
    hideAllForms();
    document.getElementById('playerJoinForm').classList.remove('hidden');
}

function showCoachLogin() {
    hideAllForms();
    document.getElementById('coachLoginForm').classList.remove('hidden');
}

function showAdminLogin() {
    hideAllForms();
    document.getElementById('adminLoginForm').classList.remove('hidden');
}

function showCreateTeam() {
    hideAllForms();
    document.getElementById('createTeamForm').classList.remove('hidden');
}

function loginAsAdmin() {
    const code = document.getElementById('adminCode').value;
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
    const teamCode = document.getElementById('coachTeamCode').value.toUpperCase();
    const password = document.getElementById('coachPassword').value;
    
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
    const teamCode = document.getElementById('playerTeamCode').value.toUpperCase();
    const playerName = document.getElementById('playerName').value.trim();
    
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
    
    document.getElementById('playerTeamCode').value = '';
    document.getElementById('playerName').value = '';
    hideAllForms();
}

function createTeam() {
    const teamName = document.getElementById('newTeamName').value.trim();
    const teamCode = document.getElementById('newTeamCode').value.toUpperCase();
    const coachPassword = document.getElementById('newCoachPassword').value;
    
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

// ============ AFFICHAGE PRINCIPAL ============
function showMainApp() {
    document.getElementById('splashScreen').classList.add('hidden');
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    
    const isAdmin = currentUser.role === 'admin';
    const isCoach = currentUser.role === 'coach';
    
    // Configurer l'affichage selon le rôle
    document.getElementById('fabButton').style.display = (isAdmin || isCoach) ? 'block' : 'none';
    document.getElementById('adminNavBtn').style.display = isAdmin ? 'flex' : 'none';
    document.getElementById('coachActionsCard').style.display = (isAdmin || isCoach) ? 'block' : 'none';
    
    // Afficher les infos
    if (isAdmin) {
        document.getElementById('teamName').innerHTML = 'Team-Foot';
        document.getElementById('userRoleLabel').innerHTML = 'Super Admin';
        document.getElementById('teamAvatar').innerHTML = '👑';
        document.getElementById('welcomeMessage').innerHTML = 'Bonjour Administrateur 👋';
    } else if (isCoach) {
        const team = appData.teams[currentUser.teamCode];
        document.getElementById('teamName').innerHTML = team.name;
        document.getElementById('userRoleLabel').innerHTML = 'Coach';
        document.getElementById('teamAvatar').innerHTML = '👥';
        document.getElementById('welcomeMessage').innerHTML = `Bonjour Coach ${team.name} 👋`;
    }
    
    // Charger les données
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
    // Navigation par onglets
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            item.classList.add('active');
            document.getElementById(`${view}View`).classList.add('active');
            
            if (view === 'messages') loadMessages();
            if (view === 'team') loadTeamView();
            if (view === 'admin') loadAllTeams();
        });
    });
    
    // Envoi de message
    document.getElementById('sendMessageBtn')?.addEventListener('click', sendMessage);
    document.getElementById('messageInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Déconnexion
    document.getElementById('logoutBtnMain')?.addEventListener('click', logout);
}

function logout() {
    currentUser = null;
    currentTeamCode = null;
    location.reload();
}

// ============ GESTION DES ÉVÉNEMENTS ============
function showCreateEventModal() {
    document.getElementById('eventModal').classList.remove('hidden');
    // Pré-remplir les dates par défaut
    const now = new Date();
    const defaultMatch = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const defaultCall = new Date(defaultMatch.getTime() - 2 * 60 * 60 * 1000);
    document.getElementById('modalMatchDateTime').value = defaultMatch.toISOString().slice(0, 16);
    document.getElementById('modalCallTime').value = defaultCall.toISOString().slice(0, 16);
}

function closeEventModal() {
    document.getElementById('eventModal').classList.add('hidden');
}

function createEventFromModal() {
    const event = {
        id: Date.now().toString(),
        type: document.getElementById('modalEventType').value,
        title: document.getElementById('modalEventTitle').value,
        matchDateTime: document.getElementById('modalMatchDateTime').value,
        callTime: document.getElementById('modalCallTime').value,
        location: document.getElementById('modalLocation').value,
        notes: document.getElementById('modalNotes').value,
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
        // Admin ajoute à toutes les équipes
        for (let code in appData.teams) {
            if (!appData.teams[code].events) appData.teams[code].events = [];
            appData.teams[code].events.unshift({...event, teamAdded: code});
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
    
    // Reset form
    document.getElementById('modalEventTitle').value = '';
    document.getElementById('modalLocation').value = '';
    document.getElementById('modalNotes').value = '';
}

function loadEvents() {
    const container = document.getElementById('eventsList');
    let events = [];
    
    if (currentUser.role === 'admin') {
        for (let code in appData.teams) {
            const teamEvents = (appData.teams[code].events || []).map(e => ({
                ...e,
                teamName: appData.teams[code].name,
                teamCode: code
            }));
            events.push(...teamEvents);
        }
        events.sort((a,b) => new Date(a.matchDateTime) - new Date(b.matchDateTime));
    } else {
        const team = appData.teams[currentUser.teamCode];
        events = (team.events || []).sort((a,b) => new Date(a.matchDateTime) - new Date(b.matchDateTime));
    }
    
    if (events.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📅</div>
                <p>Aucun événement programmé</p>
                ${(currentUser.role === 'coach' || currentUser.role === 'admin') ? 
                    '<button class="btn-primary" onclick="showCreateEventModal()">➕ Créer un événement</button>' : 
                    '<small>Revenez plus tard</small>'}
            </div>
        `;
        return;
    }
    
    const isAdminOrCoach = (currentUser.role === 'admin' || currentUser.role === 'coach');
    const currentPlayerId = currentUser.playerId;
    
    container.innerHTML = events.map(event => {
        const matchDate = new Date(event.matchDateTime).toLocaleString('fr-FR', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
        const callDate = new Date(event.callTime).toLocaleString('fr-FR', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
        
        let attendanceHtml = '';
        if (!isAdminOrCoach && currentPlayerId) {
            const playerStatus = event.attendances?.[currentPlayerId] || 'waiting';
            attendanceHtml = `
                <div class="status-buttons">
                    <button class="status-btn ${playerStatus === 'present' ? 'active' : ''}" 
                        onclick="setAttendance('${event.id}', 'present')">✅ Présent</button>
                    <button class="status-btn ${playerStatus === 'absent' ? 'active' : ''} absent" 
                        onclick="setAttendance('${event.id}', 'absent')">❌ Absent</button>
                    <button class="status-btn ${playerStatus === 'waiting' ? 'active' : ''} waiting" 
                        onclick="setAttendance('${event.id}', 'waiting')">⏳ En attente</button>
                </div>
            `;
        } else if (isAdminOrCoach) {
            const team = currentUser.role === 'admin' ? 
                appData.teams[event.teamCode] : appData.teams[currentUser.teamCode];
            const players = team?.players || {};
            const stats = Object.values(players).map(p => {
                const status = event.attendances?.[p.id] || 'waiting';
                const icon = status === 'present' ? '✅' : status === 'absent' ? '❌' : '⏳';
                return `<span style="margin-right:8px; font-size:12px;">${p.name.split(' ')[0]}: ${icon}</span>`;
            }).join('');
            attendanceHtml = `<div style="margin-top:12px; padding-top:12px; border-top:1px solid #e2e8f0; font-size:12px;">
                <strong>📊 Réponses:</strong><br>${stats || 'Aucun joueur'}</div>`;
        }
        
        return `
            <div class="event-card">
                <div class="event-header">
                    <span class="event-title">${escapeHtml(event.title)}</span>
                    <span class="event-badge">${getTypeLabel(event.type)}</span>
                </div>
                ${event.teamName ? `<div style="font-size:11px; color:#1a73e8; margin-bottom:8px;">🏷️ ${event.teamName}</div>` : ''}
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
    if (currentUser.role !== 'player') return;
    
    const team = appData.teams[currentTeamCode];
    const event = team.events.find(e => e.id === eventId);
    if (event) {
        if (!event.attendances) event.attendances = {};
        event.attendances[currentUser.playerId] = status;
        saveData();
        loadEvents();
        
        const statusText = status === 'present' ? 'Présent' : status === 'absent' ? 'Absent' : 'En attente';
        showToast(`Statut mis à jour: ${statusText}`);
        
        // Ajouter un message automatique dans le vestiaire
        const playerName = team.players[currentUser.playerId]?.name || 'Un joueur';
        const autoMessage = {
            id: Date.now().toString(),
            author: '📢 Système',
            authorId: 'system',
            text: `${playerName} a répondu ${statusText === 'Présent' ? '✅ PRÉSENT' : statusText === 'Absent' ? '❌ ABSENT' : '⏳ EN ATTENTE'} pour "${event.title}"`,
            timestamp: new Date().toISOString(),
            isSystem: true
        };
        if (!team.messages) team.messages = [];
        team.messages.push(autoMessage);
        saveData();
    }
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
        events.map(e => `<option value="${e.id}">${e.title} - ${new Date(e.matchDateTime).toLocaleDateString()}</option>`).join('');
}

function notifyNonResponders() {
    const eventId = document.getElementById('eventSelector').value;
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
    
    if (!event) return;
    
    const nonResponders = Object.values(team.players || {}).filter(p => {
        const status = event.attendances?.[p.id];
        return !status || status === 'waiting';
    });
    
    if (nonResponders.length === 0) {
        showToast('✅ Tout le monde a répondu !');
        return;
    }
    
    const message = {
        id: Date.now().toString(),
        author: '📢 Coach',
        authorId: 'coach',
        text: `⏰ RAPPEL: Merci de répondre pour "${event.title}" du ${new Date(event.matchDateTime).toLocaleDateString()}`,
        timestamp: new Date().toISOString(),
        isSystem: true
    };
    
    if (!team.messages) team.messages = [];
    team.messages.push(message);
    saveData();
    
    showToast(`📢 Relance envoyée à ${nonResponders.length} joueur(s)`);
    loadMessages();
}

// ============ MESSAGES (VESTIAIRE) ============
function sendMessage() {
    const text = document.getElementById('messageInput').value.trim();
    if (!text) return;
    
    let team;
    if (currentUser.role === 'admin') {
        // Admin envoie à toutes les équipes
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
        const author = currentUser.role === 'coach' ? `👥 Coach ${team.name}` : 
                       (team.players[currentUser.playerId]?.name || 'Joueur');
        const message = {
            id: Date.now().toString(),
            author: author,
            authorId: currentUser.playerId || currentUser.role,
            text: text,
            timestamp: new Date().toISOString()
        };
        if (!team.messages) team.messages = [];
        team.messages.unshift(message);
    }
    
    saveData();
    document.getElementById('messageInput').value = '';
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
    } else {
        const team = appData.teams[currentUser.teamCode];
        messages = (team.messages || []).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    
    if (messages.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">💬</div><p>Aucun message</p><small>Soyez le premier à écrire !</small></div>';
        return;
    }
    
    container.innerHTML = messages.map(m => `
        <div class="message ${m.isSystem ? 'system' : ''}">
            <div class="message-header">
                <span class="message-author">${escapeHtml(m.author)}</span>
                ${m.teamName ? `<span style="font-size:10px; color:#1a73e8;">${m.teamName}</span>` : ''}
                <span style="font-size:10px;">${new Date(m.timestamp).toLocaleTimeString()}</span>
            </div>
            <div class="message-text">${escapeHtml(m.text)}</div>
        </div>
    `).join('');
    
    // Mettre à jour le badge
    const unreadCount = messages.filter(m => !m.isSystem).length;
    const badge = document.getElementById('messageBadge');
    if (unreadCount > 0) {
        badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

// ============ GESTION DE L'ÉQUIPE ============
function loadTeamView() {
    if (currentUser.role === 'admin') {
        // Admin: afficher un aperçu de la première équipe
        const firstTeam = Object.values(appData.teams)[0];
        if (firstTeam) {
            displayTeamStats(firstTeam);
            displayPlayersList(firstTeam);
            displayPendingRequests(firstTeam);
        }
    } else {
        const team = appData.teams[currentUser.teamCode];
        displayTeamStats(team);
        displayPlayersList(team);
        displayPendingRequests(team);
    }
}

function displayTeamStats(team) {
    const playerCount = Object.keys(team.players || {}).length;
    const eventCount = (team.events || []).length;
    
    // Calculer le taux de réponse moyen
    let totalResponses = 0;
    let totalPlayers = playerCount;
    (team.events || []).forEach(event => {
        const responses = Object.values(event.attendances || {}).filter(s => s !== 'waiting').length;
        totalResponses += responses;
    });
    const responseRate = totalPlayers > 0 && (team.events || []).length > 0 ? 
        Math.round((totalResponses / (totalPlayers * (team.events || []).length)) * 100) : 0;
    
    document.getElementById('playerCount').innerHTML = playerCount;
    document.getElementById('eventCount').innerHTML = eventCount;
    document.getElementById('responseRate').innerHTML = `${responseRate}%`;
    document.getElementById('playersBadge').innerHTML = `${playerCount} joueurs`;
}

function displayPlayersList(team) {
    const container = document.getElementById('playersList');
    const players = Object.entries(team.players || {}).map(([id, p]) => ({id, ...p}));
    
    if (players.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">👥</div><p>Aucun joueur</p></div>';
        return;
    }
    
    container.innerHTML = players.map(p => `
        <div class="player-card">
            <span class="player-name">${escapeHtml(p.name)}</span>
            <div>
                <span class="player-status">Membre</span>
                ${(currentUser.role === 'coach' || currentUser.role === 'admin') ? 
                    `<button class="remove-btn" onclick="removePlayer('${p.id}')">❌</button>` : ''}
            </div>
        </div>
    `).join('');
}

function displayPendingRequests(team) {
    const container = document.getElementById('pendingRequestsCard');
    const requestsList = document.getElementById('requestsList');
    const pending = Object.entries(team.pendingPlayers || {});
    
    if (pending.length === 0 || (currentUser.role !== 'coach' && currentUser.role !== 'admin')) {
        container.classList.add('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    requestsList.innerHTML = pending.map(([id, p]) => `
        <div class="player-card">
            <span class="player-name">🕐 ${escapeHtml(p.name)}</span>
            <button class="approve-btn" onclick="approvePlayer('${id}')">✅ Approuver</button>
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
        
        // Message automatique
        const autoMessage = {
            id: Date.now().toString(),
            author: '📢 Système',
            authorId: 'system',
            text: `👋 Bienvenue à ${playerData.name} qui rejoint l'équipe !`,
            timestamp: new Date().toISOString(),
            isSystem: true
        };
        if (!team.messages) team.messages = [];
        team.messages.push(autoMessage);
        saveData();
        
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
    
    const player = team.players[playerId];
    if (player && confirm(`Retirer ${player.name} de l'équipe ?`)) {
        delete team.players[playerId];
        saveData();
        loadTeamView();
        showToast(`${player.name} a été retiré`);
    }
}

// ============ ADMIN - GESTION DES ÉQUIPES ============
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
            <button class="btn-danger-small" onclick="deleteTeam('${code}')">🗑️ Supprimer</button>
        </div>
    `).join('');
}

function showCreateTeamModal() {
    // Réutiliser le formulaire de création
    document.getElementById('createTeamForm').classList.remove('hidden');
    document.getElementById('adminView').classList.add('hidden');
}

function deleteTeam(teamCode) {
    if (confirm(`Supprimer définitivement l'équipe ${appData.teams[teamCode].name} ?`)) {
        delete appData.teams[teamCode];
        saveData();
        loadAllTeams();
        showToast('Équipe supprimée');
    }
}

// ============ UTILITAIRES ============
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
window.setAttendance = setAttendance;
window.notifyNonResponders = notifyNonResponders;
window.approvePlayer = approvePlayer;
window.removePlayer = removePlayer;
window.deleteTeam = deleteTeam;
window.showCreateTeamModal = showCreateTeamModal;
window.hideAllForms = hideAllForms;

// ============ DÉMARRAGE ============
loadData();

// Simuler le splash screen puis afficher login
setTimeout(() => {
    document.getElementById('splashScreen')?.classList.add('hidden');
    document.getElementById('loginScreen')?.classList.remove('hidden');
}, 1800);