'use strict';

const STORAGE_KEY = 'escapade-planner-v1';
const CATEGORIES = {
  rando: ['🥾', 'Randonnée'],
  vtt: ['🚵', 'VTT'],
  tennis: ['🎾', 'Tennis'],
  golf: ['⛳', 'Golf'],
  visite: ['🏛️', 'Visite'],
  plage: ['🏖️', 'Plage'],
  repas: ['🍽️', 'Restaurant'],
  transport: ['🚗', 'Transport'],
  hotel: ['🏡', 'Hébergement'],
  nature: ['🌿', 'Nature'],
  culture: ['🎭', 'Culture'],
  autre: ['✨', 'Autre']
};
const EXPENSE_CATEGORIES = ['Transport', 'Hébergement', 'Restaurants', 'Activités', 'Courses', 'Shopping', 'Divers'];
const RESERVATION_TYPES = ['Vol', 'Train', 'Voiture', 'Hébergement', 'Restaurant', 'Activité', 'Autre'];
const RESOURCE_TYPES = ['Destination', 'Hébergement', 'Restaurant', 'Randonnée', 'VTT', 'Tennis', 'Golf', 'Visite', 'Transport', 'Autre'];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const uid = (prefix = 'id') => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
const clone = value => JSON.parse(JSON.stringify(value));
const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const safeUrl = value => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  try { return ['http:', 'https:', 'mailto:'].includes(new URL(raw, location.href).protocol) ? raw : ''; }
  catch { return ''; }
};
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const asNumber = value => Number.parseFloat(value) || 0;
const formatMoney = (value, currency = 'EUR') => new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(asNumber(value));
const formatDate = (value, options = { weekday: 'long', day: 'numeric', month: 'long' }) => value ? new Intl.DateTimeFormat('fr-FR', options).format(new Date(`${value}T12:00:00`)) : 'Date à définir';
const isoDate = date => date.toISOString().slice(0, 10);
const todayIso = () => isoDate(new Date());

function dateDiff(start, end) {
  if (!start || !end) return 0;
  return Math.round((new Date(`${end}T12:00:00`) - new Date(`${start}T12:00:00`)) / 86400000);
}

function enumerateDates(start, end) {
  if (!start || !end || end < start) return [];
  const dates = [];
  const cursor = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  while (cursor <= last) {
    dates.push(isoDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function sampleState() {
  const start = '2027-07-17';
  const end = '2027-07-24';
  const dates = enumerateDates(start, end);
  const tripId = uid('trip');
  return {
    version: 1,
    activeTripId: tripId,
    theme: 'light',
    preferences: {
      destinations: ['Amérique du Nord', 'Asie du Sud-Est', 'Europe', 'Maroc', 'Canaries', 'Açores', 'Île Maurice', 'Seychelles'],
      activities: ['Randonnée', 'VTT', 'Tennis', 'Golf'],
      travelers: ['Olivier', 'Adulte 2', 'Enfant 1', 'Enfant 2']
    },
    trips: [{
      id: tripId,
      name: 'Açores en famille',
      destination: 'São Miguel, Açores',
      country: 'Portugal',
      startDate: start,
      endDate: end,
      travelers: 4,
      currency: 'EUR',
      totalBudget: 4500,
      notes: 'Un séjour nature avec randonnées, baignades et une journée de golf.',
      days: dates.map((date, index) => ({
        id: uid('day'),
        date,
        title: index === 0 ? 'Arrivée à Ponta Delgada' : index === 1 ? 'Lacs de Sete Cidades' : index === 2 ? 'Furnas et sources chaudes' : `Journée ${index + 1}`,
        location: index < 3 ? ['Ponta Delgada', 'Sete Cidades', 'Furnas'][index] : '',
        activities: index === 0 ? [
          { id: uid('act'), time: '16:00', endTime: '17:00', title: 'Prise du véhicule', category: 'transport', location: 'Aéroport João Paulo II', lat: 37.7412, lng: -25.6979, cost: 280, status: 'réservé', bookingUrl: '', notes: '' },
          { id: uid('act'), time: '18:30', endTime: '20:00', title: 'Installation et promenade', category: 'visite', location: 'Ponta Delgada', lat: 37.7412, lng: -25.6756, cost: 0, status: 'idée', bookingUrl: '', notes: '' }
        ] : index === 1 ? [
          { id: uid('act'), time: '09:30', endTime: '13:00', title: 'Randonnée Vista do Rei', category: 'rando', location: 'Sete Cidades', lat: 37.8395, lng: -25.7945, cost: 0, status: 'sélectionné', bookingUrl: '', notes: 'Prévoir coupe-vent et pique-nique.' },
          { id: uid('act'), time: '15:00', endTime: '17:00', title: 'Kayak sur le lac', category: 'nature', location: 'Lagoa Azul', lat: 37.8618, lng: -25.7975, cost: 120, status: 'à réserver', bookingUrl: '', notes: '' }
        ] : index === 2 ? [
          { id: uid('act'), time: '10:00', endTime: '12:00', title: 'Parc Terra Nostra', category: 'nature', location: 'Furnas', lat: 37.7721, lng: -25.3132, cost: 56, status: 'à réserver', bookingUrl: '', notes: '' },
          { id: uid('act'), time: '13:00', endTime: '14:30', title: 'Cozido des Furnas', category: 'repas', location: 'Furnas', lat: 37.7738, lng: -25.3104, cost: 100, status: 'idée', bookingUrl: '', notes: '' }
        ] : []
      })),
      expenses: [
        { id: uid('exp'), label: 'Vols', category: 'Transport', planned: 1350, actual: 0, paid: false, date: '' },
        { id: uid('exp'), label: 'Maison', category: 'Hébergement', planned: 1250, actual: 0, paid: true, date: '' },
        { id: uid('exp'), label: 'Location voiture', category: 'Transport', planned: 280, actual: 280, paid: true, date: start },
        { id: uid('exp'), label: 'Restaurants', category: 'Restaurants', planned: 700, actual: 0, paid: false, date: '' },
        { id: uid('exp'), label: 'Activités', category: 'Activités', planned: 500, actual: 0, paid: false, date: '' }
      ],
      reservations: [
        { id: uid('res'), type: 'Hébergement', name: 'Maison à Ponta Delgada', provider: 'À confirmer', start, end, confirmation: '', cost: 1250, url: '', notes: 'Vérifier parking et lave-linge.' },
        { id: uid('res'), type: 'Voiture', name: 'SUV compact', provider: 'À confirmer', start, end, confirmation: '', cost: 280, url: '', notes: '' }
      ],
      checklist: [
        { id: uid('chk'), label: 'Passeports ou cartes d’identité', group: 'Documents', assignee: 'Famille', done: false },
        { id: uid('chk'), label: 'Permis de conduire', group: 'Documents', assignee: 'Olivier', done: false },
        { id: uid('chk'), label: 'Chaussures de randonnée', group: 'Bagages', assignee: 'Famille', done: false },
        { id: uid('chk'), label: 'Réserver le véhicule', group: 'À faire', assignee: 'Olivier', done: true },
        { id: uid('chk'), label: 'Vérifier les bagages cabine', group: 'À faire', assignee: 'Famille', done: false }
      ],
      resources: [
        { id: uid('src'), title: 'Randonnée Sete Cidades', type: 'Randonnée', url: 'https://www.openstreetmap.org/search?query=Sete%20Cidades', notes: 'Boucle panoramique à comparer selon la météo.', location: 'Sete Cidades', lat: 37.8395, lng: -25.7945, status: 'sélectionné' },
        { id: uid('src'), title: 'Batalha Golf Course', type: 'Golf', url: 'https://www.openstreetmap.org/search?query=Batalha%20Golf%20Course', notes: 'Parcours 27 trous près de Ponta Delgada.', location: 'Fenais da Luz', lat: 37.8215, lng: -25.6306, status: 'potentiel' }
      ]
    }]
  };
}

let state = loadState();
let currentPage = location.hash.replace('#', '') || 'overview';
let map = null;
let mapLayer = null;
let currentMapDay = 'all';
let modalSubmitHandler = null;
let draggedActivity = null;

function normalizeState(data) {
  const fallback = sampleState();
  const prefs = data.preferences || {};
  data.preferences = {
    destinations: Array.isArray(prefs.destinations) ? prefs.destinations : fallback.preferences.destinations,
    activities: Array.isArray(prefs.activities) ? prefs.activities : fallback.preferences.activities,
    travelers: Array.isArray(prefs.travelers) ? prefs.travelers : fallback.preferences.travelers
  };
  data.trips.forEach(trip => {
    trip.days = Array.isArray(trip.days) ? trip.days : [];
    trip.days.forEach(day => { day.activities = Array.isArray(day.activities) ? day.activities : []; });
    trip.expenses = Array.isArray(trip.expenses) ? trip.expenses : [];
    trip.reservations = Array.isArray(trip.reservations) ? trip.reservations : [];
    trip.checklist = Array.isArray(trip.checklist) ? trip.checklist : [];
    trip.resources = Array.isArray(trip.resources) ? trip.resources : [];
  });
  return data;
}

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored?.trips?.length) return normalizeState(stored);
  } catch (error) {
    console.warn('Données locales illisibles', error);
  }
  return sampleState();
}

function saveState(message) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (message) toast(message);
}

function activeTrip() {
  return state.trips.find(trip => trip.id === state.activeTripId) || state.trips[0];
}

function ensureActiveTrip() {
  if (!state.trips.length) {
    const fresh = sampleState();
    state.trips = fresh.trips;
    state.activeTripId = fresh.activeTripId;
  }
  if (!activeTrip()) state.activeTripId = state.trips[0].id;
}

function toast(message) {
  const node = document.createElement('div');
  node.className = 'toast';
  node.textContent = message;
  $('#toast-region').append(node);
  setTimeout(() => node.remove(), 2800);
}

function setTheme(theme) {
  state.theme = theme;
  document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light';
  saveState();
}

function tripDuration(trip) {
  return trip.startDate && trip.endDate ? dateDiff(trip.startDate, trip.endDate) + 1 : trip.days.length;
}

function syncTripDays(trip) {
  const dates = enumerateDates(trip.startDate, trip.endDate);
  if (!dates.length) return 0;
  const byDate = new Map(trip.days.map(day => [day.date, day]));
  const kept = new Set(dates);
  const droppedWithActivities = trip.days.filter(day => !kept.has(day.date) && day.activities.length).length;
  trip.days = dates.map((date, index) => byDate.get(date) || ({ id: uid('day'), date, title: `Journée ${index + 1}`, location: '', activities: [] }));
  return droppedWithActivities;
}

function plannedTotal(trip) {
  return trip.expenses.reduce((sum, expense) => sum + asNumber(expense.planned), 0);
}

function actualTotal(trip) {
  return trip.expenses.reduce((sum, expense) => sum + asNumber(expense.actual), 0);
}

function allActivities(trip) {
  return trip.days.flatMap((day, dayIndex) => day.activities.map((activity, activityIndex) => ({...activity, day, dayIndex, activityIndex})));
}

function pageHeader(eyebrow, title, subtitle, actions = '') {
  return `<header class="page-head"><div><p class="eyebrow">${esc(eyebrow)}</p><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div><div class="page-actions">${actions}</div></header>`;
}

function renderTripSelect() {
  ensureActiveTrip();
  $('#trip-select').innerHTML = state.trips.map(trip => `<option value="${trip.id}" ${trip.id === state.activeTripId ? 'selected' : ''}>${esc(trip.name)}</option>`).join('');
}

function updateNav() {
  $$('[data-page]').forEach(link => link.classList.toggle('active', link.dataset.page === currentPage));
}

function navigate(page) {
  currentPage = page;
  if (location.hash !== `#${page}`) history.pushState(null, '', `#${page}`);
  updateNav();
  renderPage();
  $('#main-content').focus({ preventScroll: true });
}

function renderPage() {
  ensureActiveTrip();
  const renderers = { overview: renderOverview, itinerary: renderItinerary, map: renderMapPage, budget: renderBudget, reservations: renderReservations, checklist: renderChecklist, resources: renderResources, settings: renderSettings };
  (renderers[currentPage] || renderOverview)();
}

function renderOverview() {
  const trip = activeTrip();
  const days = tripDuration(trip);
  const daysUntil = trip.startDate ? dateDiff(todayIso(), trip.startDate) : null;
  const activities = allActivities(trip);
  const planned = plannedTotal(trip);
  const actual = actualTotal(trip);
  const checklistDone = trip.checklist.filter(item => item.done).length;
  const checklistPct = trip.checklist.length ? Math.round(checklistDone / trip.checklist.length * 100) : 0;
  const reservationsReady = trip.reservations.filter(item => item.confirmation).length;
  const nextActivities = activities.filter(item => item.day.date >= todayIso()).sort((a,b) => `${a.day.date}${a.time}`.localeCompare(`${b.day.date}${b.time}`)).slice(0, 5);
  const activityTypes = activities.reduce((acc, item) => { acc[item.category] = (acc[item.category] || 0) + 1; return acc; }, {});

  $('#main-content').innerHTML = `<div class="page">
    <section class="hero">
      <div class="hero-content">
        <p class="eyebrow">Prochaine escapade</p>
        <h2>${esc(trip.name)}</h2>
        <p>${esc(trip.notes || `Préparez votre séjour à ${trip.destination || 'votre prochaine destination'}.`)}</p>
        <div class="hero-meta">
          <span>📍 ${esc(trip.destination || 'Destination à définir')}</span>
          <span>📅 ${trip.startDate ? formatDate(trip.startDate, {day:'numeric',month:'short'}) : '?'} - ${trip.endDate ? formatDate(trip.endDate, {day:'numeric',month:'short',year:'numeric'}) : '?'}</span>
          <span>👨‍👩‍👧‍👦 ${trip.travelers || 1} voyageur${trip.travelers > 1 ? 's' : ''}</span>
          <span>🌙 ${days} jour${days > 1 ? 's' : ''}</span>
        </div>
      </div>
      <div class="hero-side"><div class="countdown"><strong>${daysUntil === null ? '?' : daysUntil < 0 ? '✓' : daysUntil}</strong><span>${daysUntil < 0 ? 'voyage commencé' : 'jours avant le départ'}</span></div></div>
    </section>

    <section class="grid grid-4 section-gap">
      <article class="card stat-card"><div class="stat-icon">☷</div><strong>${activities.length}</strong><span>activités planifiées</span></article>
      <article class="card stat-card"><div class="stat-icon">€</div><strong>${formatMoney(planned, trip.currency)}</strong><span>budget prévu sur ${formatMoney(trip.totalBudget, trip.currency)}</span></article>
      <article class="card stat-card"><div class="stat-icon">⌁</div><strong>${reservationsReady}/${trip.reservations.length}</strong><span>réservations renseignées</span></article>
      <article class="card stat-card"><div class="stat-icon">✓</div><strong>${checklistPct}%</strong><span>checklist terminée</span></article>
    </section>

    <section class="grid grid-2 section-gap">
      <article class="card card-pad">
        <div class="card-head"><div><h3>Prochaines étapes</h3><p>Les premières activités de votre programme</p></div><button class="btn btn-small btn-secondary" data-action="go-itinerary">Voir le planning</button></div>
        ${nextActivities.length ? `<div>${nextActivities.map(item => `<div class="activity">
          <div class="activity-time">${esc(item.time || 'Toute la journée')}</div><div class="activity-icon">${CATEGORIES[item.category]?.[0] || '✨'}</div>
          <div class="activity-main"><strong>${esc(item.title)}</strong><small>${formatDate(item.day.date, {weekday:'short',day:'numeric',month:'short'})}${item.location ? ` · ${esc(item.location)}` : ''}</small></div>
          <div class="activity-meta"><span class="badge ${item.status === 'réservé' ? 'success' : item.status === 'à réserver' ? 'warning' : ''}">${esc(item.status || 'idée')}</span></div>
        </div>`).join('')}</div>` : `<div class="empty-state"><span class="big">🗓️</span>Aucune activité à venir.</div>`}
      </article>
      <article class="card card-pad">
        <div class="card-head"><div><h3>Équilibre du voyage</h3><p>Répartition de vos activités favorites</p></div></div>
        <div class="grid" style="gap:14px">${Object.entries(activityTypes).length ? Object.entries(activityTypes).sort((a,b)=>b[1]-a[1]).map(([category, count]) => {
          const pct = Math.round(count / activities.length * 100);
          return `<div><div style="display:flex;justify-content:space-between;margin-bottom:7px"><span>${CATEGORIES[category]?.[0] || '✨'} ${esc(CATEGORIES[category]?.[1] || category)}</span><strong>${count}</strong></div><div class="progress green"><span style="width:${pct}%"></span></div></div>`;
        }).join('') : '<div class="empty-state">Ajoutez des activités pour visualiser leur répartition.</div>'}</div>
      </article>
    </section>

    <section class="grid grid-2 section-gap">
      <article class="card card-pad"><div class="card-head"><div><h3>Budget</h3><p>${formatMoney(actual, trip.currency)} dépensés ou saisis</p></div><button class="btn btn-small btn-secondary" data-action="go-budget">Détail</button></div><div class="progress"><span style="width:${clamp(trip.totalBudget ? planned/trip.totalBudget*100 : 0,0,100)}%"></span></div><p class="muted">${formatMoney(planned, trip.currency)} planifiés sur une enveloppe de ${formatMoney(trip.totalBudget, trip.currency)}.</p></article>
      <article class="card card-pad"><div class="card-head"><div><h3>Préparation</h3><p>${checklistDone} éléments cochés sur ${trip.checklist.length}</p></div><button class="btn btn-small btn-secondary" data-action="go-checklist">Checklist</button></div><div class="progress green"><span style="width:${checklistPct}%"></span></div><p class="muted">Documents, réservations, bagages et tâches partagées.</p></article>
    </section>
  </div>`;
}

function renderItinerary() {
  const trip = activeTrip();
  $('#main-content').innerHTML = `<div class="page">
    ${pageHeader('Organisation', 'Jour par jour', 'Construisez un programme réaliste, modulable et équilibré.', `<button class="btn btn-secondary" data-action="sync-days">↻ Synchroniser les dates</button><button class="btn btn-primary" data-action="add-day">+ Ajouter un jour</button>`)}
    <section class="timeline">${trip.days.length ? trip.days.map((day, index) => renderDay(day, index)).join('') : `<div class="card empty-state"><span class="big">🗓️</span>Définissez les dates du voyage ou ajoutez une journée.</div>`}</section>
  </div>`;
  bindDragAndDrop();
}

function renderDay(day, index) {
  return `<article class="card day-card" data-day-id="${day.id}">
    <header class="day-header">
      <div class="day-number">${index + 1}</div>
      <div class="day-title"><h3>${esc(day.title || `Journée ${index + 1}`)}</h3><p>${formatDate(day.date)}${day.location ? ` · ${esc(day.location)}` : ''}</p></div>
      <div class="day-actions"><button class="icon-btn" data-action="edit-day" data-id="${day.id}" title="Modifier">✎</button><button class="icon-btn" data-action="add-activity" data-id="${day.id}" title="Ajouter une activité">+</button><button class="icon-btn" data-action="delete-day" data-id="${day.id}" title="Supprimer">×</button></div>
    </header>
    <div class="activity-list" data-drop-day="${day.id}">
      ${day.activities.length ? day.activities.map(activity => renderActivity(day, activity)).join('') : `<div class="empty-state"><span class="big">＋</span>Aucune activité. Ajoutez une idée ou déposez une activité ici.</div>`}
    </div>
  </article>`;
}

function renderActivity(day, activity) {
  const category = CATEGORIES[activity.category] || CATEGORIES.autre;
  return `<div class="activity" draggable="true" data-activity-id="${activity.id}" data-day-id="${day.id}">
    <div class="activity-time">${esc(activity.time || 'Libre')}</div>
    <div class="activity-icon">${category[0]}</div>
    <div class="activity-main"><strong>${esc(activity.title)}</strong><small>${esc(activity.location || category[1])}${activity.notes ? ` · ${esc(activity.notes)}` : ''}</small></div>
    <div class="activity-meta">
      ${activity.cost ? `<span class="badge accent">${formatMoney(activity.cost, activeTrip().currency)}</span>` : ''}
      <span class="badge ${activity.status === 'réservé' ? 'success' : activity.status === 'à réserver' ? 'warning' : ''}">${esc(activity.status || 'idée')}</span>
      <button class="icon-btn" data-action="move-up" data-day="${day.id}" data-id="${activity.id}" title="Monter">↑</button>
      <button class="icon-btn" data-action="move-down" data-day="${day.id}" data-id="${activity.id}" title="Descendre">↓</button>
      <button class="icon-btn" data-action="edit-activity" data-day="${day.id}" data-id="${activity.id}" title="Modifier">✎</button>
      <button class="icon-btn" data-action="delete-activity" data-day="${day.id}" data-id="${activity.id}" title="Supprimer">×</button>
    </div>
  </div>`;
}

function bindDragAndDrop() {
  $$('.activity[draggable="true"]').forEach(node => {
    node.addEventListener('dragstart', () => {
      draggedActivity = { activityId: node.dataset.activityId, dayId: node.dataset.dayId };
      node.classList.add('dragging');
    });
    node.addEventListener('dragend', () => {
      node.classList.remove('dragging');
      draggedActivity = null;
    });
  });
  $$('[data-drop-day]').forEach(list => {
    list.addEventListener('dragover', event => event.preventDefault());
    list.addEventListener('drop', event => {
      event.preventDefault();
      if (!draggedActivity) return;
      moveActivityBetweenDays(draggedActivity.dayId, list.dataset.dropDay, draggedActivity.activityId);
    });
  });
}

function renderMapPage() {
  const trip = activeTrip();
  const places = mapPlaces(trip, currentMapDay);
  $('#main-content').innerHTML = `<div class="page">
    ${pageHeader('Repérage', 'Carte du voyage', 'Visualisez les étapes et les ressources géolocalisées.', `<button class="btn btn-secondary" data-action="geocode-search">⌕ Rechercher un lieu</button>`)}
    <section class="map-layout">
      <aside class="card card-pad map-panel">
        <div class="card-head"><div><h3>Étapes</h3><p>${places.length} lieu${places.length > 1 ? 'x' : ''} sur la carte</p></div></div>
        <div class="map-filter"><button class="btn btn-small btn-secondary ${currentMapDay === 'all' ? 'active' : ''}" data-map-day="all">Tout</button>${trip.days.map((day,index) => `<button class="btn btn-small btn-secondary ${currentMapDay === day.id ? 'active' : ''}" data-map-day="${day.id}">J${index+1}</button>`).join('')}</div>
        <div class="section-gap">${places.length ? places.map((place, index) => `<div class="map-place" data-map-index="${index}"><strong>${place.icon} ${esc(place.title)}</strong><br><small>${esc(place.location || place.type)}${place.dayLabel ? ` · ${esc(place.dayLabel)}` : ''}</small></div>`).join('') : `<div class="empty-state"><span class="big">📍</span>Ajoutez des coordonnées à une activité ou une inspiration.</div>`}</div>
      </aside>
      <div id="trip-map" aria-label="Carte interactive"></div>
    </section>
  </div>`;
  setTimeout(() => initMap(places), 0);
}

function mapPlaces(trip, dayFilter = 'all') {
  const activities = trip.days.flatMap((day, dayIndex) => day.activities.filter(item => Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lng))).map(item => ({
    id: item.id, type: 'Activité', title: item.title, location: item.location, lat: Number(item.lat), lng: Number(item.lng), dayId: day.id, dayLabel: `Jour ${dayIndex + 1}`, icon: CATEGORIES[item.category]?.[0] || '✨'
  }))).filter(place => dayFilter === 'all' || place.dayId === dayFilter);
  const resources = dayFilter === 'all' ? trip.resources.filter(item => Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lng))).map(item => ({ id: item.id, type: item.type, title: item.title, location: item.location, lat: Number(item.lat), lng: Number(item.lng), icon: '☆' })) : [];
  return [...activities, ...resources];
}

function initMap(places) {
  if (map) { map.remove(); map = null; }
  if (!window.L || !$('#trip-map')) return;
  map = L.map('trip-map', { zoomControl: true }).setView([45.5, 5], 4);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
  mapLayer = L.layerGroup().addTo(map);
  const latlngs = [];
  places.forEach(place => {
    const marker = L.marker([place.lat, place.lng]).addTo(mapLayer).bindPopup(`<strong>${esc(place.title)}</strong><br>${esc(place.location || place.type)}`);
    place.marker = marker;
    latlngs.push([place.lat, place.lng]);
  });
  if (latlngs.length > 1) L.polyline(latlngs, { color: '#d16642', weight: 3, opacity: .7, dashArray: '8 8' }).addTo(mapLayer);
  if (latlngs.length) map.fitBounds(latlngs, { padding: [40, 40], maxZoom: 12 });
  else map.setView([45.5, 5], 4);
  $$('.map-place').forEach(node => node.addEventListener('click', () => {
    const place = places[Number(node.dataset.mapIndex)];
    if (place?.marker) { map.setView([place.lat, place.lng], Math.max(map.getZoom(), 12)); place.marker.openPopup(); }
  }));
}

function renderBudget() {
  const trip = activeTrip();
  const planned = plannedTotal(trip);
  const actual = actualTotal(trip);
  const remaining = trip.totalBudget - planned;
  const byCategory = EXPENSE_CATEGORIES.map(category => ({ category, planned: trip.expenses.filter(item => item.category === category).reduce((sum,item)=>sum+asNumber(item.planned),0), actual: trip.expenses.filter(item => item.category === category).reduce((sum,item)=>sum+asNumber(item.actual),0) })).filter(item => item.planned || item.actual);
  $('#main-content').innerHTML = `<div class="page">
    ${pageHeader('Finances', 'Budget du voyage', 'Comparez l’enveloppe, les prévisions et les dépenses réelles.', `<button class="btn btn-secondary" data-action="edit-budget">⚙ Enveloppe</button><button class="btn btn-primary" data-action="add-expense">+ Ajouter une dépense</button>`)}
    <section class="grid grid-3">
      <article class="card stat-card"><div class="stat-icon">◎</div><strong>${formatMoney(trip.totalBudget, trip.currency)}</strong><span>enveloppe totale</span></article>
      <article class="card stat-card"><div class="stat-icon">↗</div><strong>${formatMoney(planned, trip.currency)}</strong><span>prévisionnel</span></article>
      <article class="card stat-card"><div class="stat-icon">✓</div><strong>${formatMoney(actual, trip.currency)}</strong><span>réel saisi</span></article>
    </section>
    <section class="grid grid-2 section-gap">
      <article class="card card-pad"><div class="card-head"><div><h3>Utilisation de l’enveloppe</h3><p>${remaining >= 0 ? `${formatMoney(remaining, trip.currency)} encore disponibles` : `${formatMoney(Math.abs(remaining), trip.currency)} au-dessus du budget`}</p></div></div><div class="progress"><span style="width:${clamp(trip.totalBudget ? planned/trip.totalBudget*100 : 0,0,100)}%"></span></div><p class="muted">${Math.round(trip.totalBudget ? planned/trip.totalBudget*100 : 0)} % du budget est déjà affecté.</p></article>
      <article class="card card-pad"><div class="card-head"><div><h3>Par catégorie</h3><p>Prévisionnel et réel</p></div></div><div class="grid" style="gap:11px">${byCategory.length ? byCategory.map(item => `<div style="display:grid;grid-template-columns:1fr auto;gap:8px"><span>${esc(item.category)}</span><strong>${formatMoney(item.planned, trip.currency)} <small class="muted">/ ${formatMoney(item.actual, trip.currency)}</small></strong></div>`).join('') : '<p class="muted">Aucune dépense.</p>'}</div></article>
    </section>
    <section class="card card-pad section-gap"><div class="card-head"><div><h3>Dépenses</h3><p>Cochez les éléments payés au fur et à mesure.</p></div></div>
      <div class="table-wrap"><table><thead><tr><th>Libellé</th><th>Catégorie</th><th>Date</th><th>Payé</th><th class="amount">Prévu</th><th class="amount">Réel</th><th></th></tr></thead><tbody>
        ${trip.expenses.length ? trip.expenses.map(item => `<tr><td><strong>${esc(item.label)}</strong></td><td><span class="badge">${esc(item.category)}</span></td><td>${item.date ? formatDate(item.date,{day:'numeric',month:'short'}) : '-'}</td><td><input type="checkbox" data-action="toggle-paid" data-id="${item.id}" ${item.paid ? 'checked' : ''} style="width:18px"></td><td class="amount">${formatMoney(item.planned, trip.currency)}</td><td class="amount">${formatMoney(item.actual, trip.currency)}</td><td><div class="row-actions"><button class="icon-btn" data-action="edit-expense" data-id="${item.id}">✎</button><button class="icon-btn" data-action="delete-expense" data-id="${item.id}">×</button></div></td></tr>`).join('') : `<tr><td colspan="7" class="empty-state">Aucune dépense enregistrée.</td></tr>`}
      </tbody></table></div>
    </section>
  </div>`;
}

function renderReservations() {
  const trip = activeTrip();
  $('#main-content').innerHTML = `<div class="page">
    ${pageHeader('Logistique', 'Réservations', 'Centralisez les confirmations, dates, coûts et liens utiles.', `<button class="btn btn-primary" data-action="add-reservation">+ Ajouter une réservation</button>`)}
    <section class="grid grid-3">${trip.reservations.length ? trip.reservations.map(item => `<article class="card card-pad">
      <div class="card-head"><div><span class="badge accent">${esc(item.type)}</span></div><div><button class="icon-btn" data-action="edit-reservation" data-id="${item.id}">✎</button><button class="icon-btn" data-action="delete-reservation" data-id="${item.id}">×</button></div></div>
      <h3>${esc(item.name)}</h3><p class="muted">${esc(item.provider || 'Prestataire à définir')}</p>
      <div class="grid" style="gap:9px;margin-top:18px"><span>📅 ${item.start ? formatDate(item.start,{day:'numeric',month:'short',year:'numeric'}) : '-'}${item.end && item.end !== item.start ? ` au ${formatDate(item.end,{day:'numeric',month:'short',year:'numeric'})}` : ''}</span><span>🔐 ${esc(item.confirmation || 'Confirmation à renseigner')}</span><span>💳 ${formatMoney(item.cost, trip.currency)}</span></div>
      ${item.notes ? `<p class="muted">${esc(item.notes)}</p>` : ''}${safeUrl(item.url) ? `<a class="btn btn-secondary btn-small" href="${esc(safeUrl(item.url))}" target="_blank" rel="noopener">Ouvrir le lien</a>` : ''}
    </article>`).join('') : `<article class="card empty-state" style="grid-column:1/-1"><span class="big">🎟️</span>Aucune réservation enregistrée.</article>`}</section>
  </div>`;
}

function renderChecklist() {
  const trip = activeTrip();
  const groups = [...new Set(trip.checklist.map(item => item.group))];
  const done = trip.checklist.filter(item => item.done).length;
  const pct = trip.checklist.length ? Math.round(done / trip.checklist.length * 100) : 0;
  $('#main-content').innerHTML = `<div class="page">
    ${pageHeader('Préparation', 'Checklist', `${done} éléments terminés sur ${trip.checklist.length}.`, `<button class="btn btn-primary" data-action="add-check">+ Ajouter un élément</button>`)}
    <section class="card card-pad"><div style="display:flex;justify-content:space-between;margin-bottom:9px"><strong>Progression globale</strong><strong>${pct}%</strong></div><div class="progress green"><span style="width:${pct}%"></span></div></section>
    <section class="checklist-groups section-gap">${groups.length ? groups.map(group => `<article class="card card-pad"><div class="card-head"><div><h3>${esc(group)}</h3><p>${trip.checklist.filter(item=>item.group===group && item.done).length}/${trip.checklist.filter(item=>item.group===group).length} terminés</p></div></div>${trip.checklist.filter(item=>item.group===group).map(item => `<div class="check-item ${item.done ? 'done' : ''}"><input type="checkbox" data-action="toggle-check" data-id="${item.id}" ${item.done ? 'checked' : ''}><span class="check-label"><strong>${esc(item.label)}</strong><br><small class="muted">${esc(item.assignee || 'Famille')}</small></span><span><button class="icon-btn" data-action="edit-check" data-id="${item.id}">✎</button><button class="icon-btn" data-action="delete-check" data-id="${item.id}">×</button></span></div>`).join('')}</article>`).join('') : `<article class="card empty-state"><span class="big">✓</span>Votre checklist est vide.</article>`}</section>
  </div>`;
}

function renderResources() {
  const trip = activeTrip();
  const selected = trip.resources.filter(item => item.status === 'sélectionné').length;
  $('#main-content').innerHTML = `<div class="page">
    ${pageHeader('Exploration', 'Inspirations et favoris', `${selected} ressource${selected > 1 ? 's' : ''} sélectionnée${selected > 1 ? 's' : ''}.`, `<button class="btn btn-secondary" data-action="geocode-search">⌕ Trouver un lieu</button><button class="btn btn-primary" data-action="add-resource">+ Ajouter une inspiration</button>`)}
    <section class="resource-grid">${trip.resources.length ? trip.resources.map(item => `<article class="card resource-card"><div class="resource-icon">${resourceIcon(item.type)}</div><div class="card-head"><div><span class="badge ${item.status === 'sélectionné' ? 'success' : ''}">${esc(item.status || 'potentiel')}</span></div><div><button class="icon-btn" data-action="edit-resource" data-id="${item.id}">✎</button><button class="icon-btn" data-action="delete-resource" data-id="${item.id}">×</button></div></div><h3>${esc(item.title)}</h3><p>${esc(item.notes || item.location || 'Aucune note')}</p><div style="display:flex;gap:7px;flex-wrap:wrap"><span class="badge">${esc(item.type)}</span>${item.location ? `<span class="badge">📍 ${esc(item.location)}</span>` : ''}</div>${safeUrl(item.url) ? `<p><a href="${esc(safeUrl(item.url))}" target="_blank" rel="noopener">Consulter la ressource ↗</a></p>` : ''}</article>`).join('') : `<article class="card empty-state" style="grid-column:1/-1"><span class="big">☆</span>Enregistrez ici vos hôtels, parcours, restaurants et idées.</article>`}</section>
  </div>`;
}

function resourceIcon(type) {
  return ({ Randonnée:'🥾', VTT:'🚵', Tennis:'🎾', Golf:'⛳', Destination:'🌍', Hébergement:'🏡', Restaurant:'🍽️', Transport:'🚗', Visite:'🏛️' })[type] || '☆';
}

function renderSettings() {
  const trip = activeTrip();
  $('#main-content').innerHTML = `<div class="page">
    ${pageHeader('Personnalisation', 'Préférences', 'Adaptez le planificateur à votre famille et à vos styles de voyage.', `<button class="btn btn-secondary" data-action="duplicate-trip">⧉ Dupliquer</button><button class="btn btn-danger" data-action="delete-trip">Supprimer le voyage</button>`)}
    <section class="grid grid-2">
      <article class="card preference-card"><h3>Voyage actif</h3><p>Modifiez les informations générales utilisées dans toutes les vues.</p><button class="btn btn-primary" data-action="edit-trip">Modifier ${esc(trip.name)}</button></article>
      <article class="card preference-card"><h3>Apparence</h3><p>Le thème est mémorisé dans votre navigateur.</p><div class="segmented"><button data-set-theme="light" class="${state.theme !== 'dark' ? 'active' : ''}">Clair</button><button data-set-theme="dark" class="${state.theme === 'dark' ? 'active' : ''}">Sombre</button></div></article>
      <article class="card preference-card"><h3>Destinations favorites</h3><p>Toutes les destinations restent possibles. Ces régions sont simplement mises en avant dans les formulaires.</p><div class="destination-chips">${state.preferences.destinations.map((item,index)=>`<span class="chip">🌍 ${esc(item)} <button data-remove-pref="destination" data-index="${index}">×</button></span>`).join('')}</div><div class="inline-add"><input id="new-destination-pref" placeholder="Ex. Costa Rica"><button class="btn btn-secondary" data-action="add-destination-pref">Ajouter</button></div></article>
      <article class="card preference-card"><h3>Activités favorites</h3><p>Elles sont proposées en priorité dans le programme et les inspirations.</p><div class="activity-chips">${state.preferences.activities.map((item,index)=>`<span class="chip">${resourceIcon(item)} ${esc(item)} <button data-remove-pref="activity" data-index="${index}">×</button></span>`).join('')}</div><div class="inline-add"><input id="new-activity-pref" placeholder="Ex. Plongée"><button class="btn btn-secondary" data-action="add-activity-pref">Ajouter</button></div></article>
      <article class="card preference-card"><h3>Voyageurs habituels</h3><p>Utilisés pour attribuer les éléments de checklist.</p><div class="activity-chips">${state.preferences.travelers.map((item,index)=>`<span class="chip">👤 ${esc(item)} <button data-remove-pref="traveler" data-index="${index}">×</button></span>`).join('')}</div><div class="inline-add"><input id="new-traveler-pref" placeholder="Prénom ou rôle"><button class="btn btn-secondary" data-action="add-traveler-pref">Ajouter</button></div></article>
      <article class="card preference-card"><h3>Sauvegarde et transfert</h3><p>Exportez régulièrement un fichier JSON. Il permet de restaurer tous les voyages sur un autre appareil.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-secondary" data-action="export-data">Exporter</button><button class="btn btn-secondary" data-action="import-data">Importer</button><button class="btn btn-danger" data-action="reset-data">Réinitialiser</button></div></article>
    </section>
  </div>`;
}

function openModal({ eyebrow = '', title, body, submitLabel = 'Enregistrer', onSubmit }) {
  $('#modal-eyebrow').textContent = eyebrow;
  $('#modal-title').textContent = title;
  $('#modal-body').innerHTML = body;
  $('#modal-submit').textContent = submitLabel;
  $('#modal-backdrop').classList.remove('hidden');
  $('#modal-backdrop').setAttribute('aria-hidden', 'false');
  modalSubmitHandler = onSubmit;
  setTimeout(() => $('#modal-form input, #modal-form select, #modal-form textarea')?.focus(), 20);
}

function closeModal() {
  $('#modal-backdrop').classList.add('hidden');
  $('#modal-backdrop').setAttribute('aria-hidden', 'true');
  $('#modal-form').reset();
  modalSubmitHandler = null;
}

function inputField(name, label, type = 'text', value = '', extra = '') {
  return `<div class="field"><label for="field-${name}">${esc(label)}</label><input id="field-${name}" name="${name}" type="${type}" value="${esc(value)}" ${extra}></div>`;
}

function selectField(name, label, options, value = '') {
  return `<div class="field"><label for="field-${name}">${esc(label)}</label><select id="field-${name}" name="${name}">${options.map(option => {
    const val = typeof option === 'string' ? option : option.value;
    const text = typeof option === 'string' ? option : option.label;
    return `<option value="${esc(val)}" ${String(val) === String(value) ? 'selected' : ''}>${esc(text)}</option>`;
  }).join('')}</select></div>`;
}

function textareaField(name, label, value = '', full = true) {
  return `<div class="field ${full ? 'full' : ''}"><label for="field-${name}">${esc(label)}</label><textarea id="field-${name}" name="${name}">${esc(value)}</textarea></div>`;
}

function formDataObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function openTripForm(trip = null) {
  const isEdit = Boolean(trip);
  const current = trip || { name:'', destination:'', country:'', startDate:'', endDate:'', travelers:4, currency:'EUR', totalBudget:4000, notes:'' };
  openModal({
    eyebrow: isEdit ? 'Paramètres' : 'Nouvelle aventure',
    title: isEdit ? 'Modifier le voyage' : 'Créer un voyage',
    body: `<div class="form-grid">${inputField('name','Nom du voyage','text',current.name,'required')}${inputField('destination','Destination','text',current.destination,'list="favorite-destinations" required')}<datalist id="favorite-destinations">${state.preferences.destinations.map(item=>`<option value="${esc(item)}">`).join('')}</datalist>${inputField('country','Pays ou territoire','text',current.country)}${selectField('travelers','Nombre de voyageurs',[1,2,3,4,5,6,7,8],current.travelers)}${inputField('startDate','Date de départ','date',current.startDate,'required')}${inputField('endDate','Date de retour','date',current.endDate,'required')}${selectField('currency','Devise',['EUR','USD','CAD','GBP','MAD','MUR','SCR','JPY','THB'],current.currency)}${inputField('totalBudget','Budget total','number',current.totalBudget,'min="0" step="50"')}${textareaField('notes','Objectif ou notes du voyage',current.notes)}</div>`,
    submitLabel: isEdit ? 'Mettre à jour' : 'Créer le voyage',
    onSubmit: form => {
      const data = formDataObject(form);
      if (data.endDate < data.startDate) return toast('La date de retour doit suivre la date de départ.');
      let droppedDays = 0;
      if (isEdit) {
        Object.assign(trip, data, { travelers: Number(data.travelers), totalBudget: asNumber(data.totalBudget) });
        droppedDays = syncTripDays(trip);
      } else {
        const newTrip = { id: uid('trip'), ...data, travelers:Number(data.travelers), totalBudget:asNumber(data.totalBudget), days:[], expenses:[], reservations:[], checklist:[], resources:[] };
        syncTripDays(newTrip);
        state.trips.push(newTrip);
        state.activeTripId = newTrip.id;
      }
      saveState(isEdit ? (droppedDays ? `Voyage mis à jour. ${droppedDays} journée(s) hors dates retirée(s).` : 'Voyage mis à jour.') : 'Nouveau voyage créé.');
      closeModal(); renderTripSelect(); renderPage();
    }
  });
}

function openDayForm(day = null) {
  const trip = activeTrip();
  const current = day || { date: trip.endDate || trip.startDate || todayIso(), title:'', location:'' };
  openModal({ eyebrow:'Programme', title: day ? 'Modifier la journée' : 'Ajouter une journée', body:`<div class="form-grid">${inputField('date','Date','date',current.date,'required')}${inputField('title','Titre de la journée','text',current.title,'required')}${inputField('location','Zone principale','text',current.location,'class="full"')}</div>`, onSubmit: form => {
    const data = formDataObject(form);
    if (day) Object.assign(day, data);
    else trip.days.push({ id:uid('day'), ...data, activities:[] });
    trip.days.sort((a,b)=>a.date.localeCompare(b.date));
    saveState('Journée enregistrée.'); closeModal(); renderPage();
  }});
}

function openActivityForm(day, activity = null) {
  const current = activity || { time:'09:00', endTime:'10:30', title:'', category: activityCategoryFromPreferences(), location:'', lat:'', lng:'', cost:0, status:'idée', bookingUrl:'', notes:'' };
  const categoryOptions = Object.entries(CATEGORIES).map(([value,[icon,label]]) => ({value,label:`${icon} ${label}`}));
  openModal({ eyebrow: formatDate(day.date,{weekday:'long',day:'numeric',month:'long'}), title: activity ? 'Modifier l’activité' : 'Ajouter une activité', body:`<div class="form-grid">${inputField('time','Début','time',current.time)}${inputField('endTime','Fin','time',current.endTime)}${inputField('title','Activité','text',current.title,'required class="full"')}${selectField('category','Catégorie',categoryOptions,current.category)}${selectField('status','Statut',['idée','potentiel','sélectionné','à réserver','réservé'],current.status)}${inputField('location','Lieu','text',current.location)}${inputField('cost','Coût estimé','number',current.cost,'min="0" step="1"')}${inputField('lat','Latitude','number',current.lat,'step="any"')}${inputField('lng','Longitude','number',current.lng,'step="any"')}${inputField('bookingUrl','Lien de réservation','url',current.bookingUrl,'class="full"')}${textareaField('notes','Notes',current.notes)}</div>`, onSubmit: form => {
    const data = formDataObject(form);
    data.cost = asNumber(data.cost);
    data.lat = data.lat === '' ? '' : Number(data.lat);
    data.lng = data.lng === '' ? '' : Number(data.lng);
    if (activity) Object.assign(activity, data);
    else day.activities.push({ id:uid('act'), ...data });
    day.activities.sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
    saveState('Activité enregistrée.'); closeModal(); renderPage();
  }});
}

function activityCategoryFromPreferences() {
  const mapPref = { Randonnée:'rando', VTT:'vtt', Tennis:'tennis', Golf:'golf' };
  return mapPref[state.preferences.activities[0]] || 'visite';
}

function openExpenseForm(expense = null) {
  const trip = activeTrip();
  const current = expense || { label:'', category:'Activités', planned:0, actual:0, paid:false, date:'' };
  openModal({ eyebrow:'Budget', title: expense ? 'Modifier la dépense' : 'Ajouter une dépense', body:`<div class="form-grid">${inputField('label','Libellé','text',current.label,'required')}${selectField('category','Catégorie',EXPENSE_CATEGORIES,current.category)}${inputField('planned','Montant prévu','number',current.planned,'min="0" step="1"')}${inputField('actual','Montant réel','number',current.actual,'min="0" step="1"')}${inputField('date','Date','date',current.date)}<div class="field"><label><input name="paid" type="checkbox" value="yes" style="width:18px" ${current.paid ? 'checked' : ''}> Déjà payé</label></div></div>`, onSubmit: form => {
    const data = formDataObject(form); data.planned=asNumber(data.planned); data.actual=asNumber(data.actual); data.paid=data.paid==='yes';
    if (expense) Object.assign(expense,data); else trip.expenses.push({id:uid('exp'),...data});
    saveState('Dépense enregistrée.'); closeModal(); renderPage();
  }});
}

function openReservationForm(reservation = null) {
  const trip = activeTrip();
  const current = reservation || { type:'Hébergement', name:'', provider:'', start:trip.startDate, end:trip.endDate, confirmation:'', cost:0, url:'', notes:'' };
  openModal({ eyebrow:'Logistique', title:reservation?'Modifier la réservation':'Ajouter une réservation', body:`<div class="form-grid">${selectField('type','Type',RESERVATION_TYPES,current.type)}${inputField('name','Nom','text',current.name,'required')}${inputField('provider','Prestataire','text',current.provider)}${inputField('confirmation','Numéro de confirmation','text',current.confirmation)}${inputField('start','Début','date',current.start)}${inputField('end','Fin','date',current.end)}${inputField('cost','Coût','number',current.cost,'min="0" step="1"')}${inputField('url','Lien','url',current.url)}${textareaField('notes','Notes',current.notes)}</div>`, onSubmit:form=>{
    const data=formDataObject(form); data.cost=asNumber(data.cost);
    if(reservation) Object.assign(reservation,data); else trip.reservations.push({id:uid('res'),...data});
    saveState('Réservation enregistrée.'); closeModal(); renderPage();
  }});
}

function openChecklistForm(item = null) {
  const trip=activeTrip(); const current=item||{label:'',group:'À faire',assignee:'Famille',done:false};
  const assignees=['Famille',...state.preferences.travelers];
  openModal({eyebrow:'Préparation',title:item?'Modifier l’élément':'Ajouter un élément',body:`<div class="form-grid">${inputField('label','Élément','text',current.label,'required class="full"')}${inputField('group','Groupe','text',current.group,'list="check-groups"')}<datalist id="check-groups"><option value="Documents"><option value="Bagages"><option value="À faire"><option value="Santé"><option value="Maison"></datalist>${selectField('assignee','Responsable',assignees,current.assignee)}<div class="field full"><label><input name="done" type="checkbox" value="yes" style="width:18px" ${current.done?'checked':''}> Déjà terminé</label></div></div>`,onSubmit:form=>{
    const data=formDataObject(form);data.done=data.done==='yes';if(item)Object.assign(item,data);else trip.checklist.push({id:uid('chk'),...data});saveState('Checklist mise à jour.');closeModal();renderPage();
  }});
}

function openResourceForm(resource = null, defaults = {}) {
  const trip=activeTrip(); const current={title:'',type:'Destination',url:'',notes:'',location:'',lat:'',lng:'',status:'potentiel',...defaults,...(resource||{})};
  const preferred=[...state.preferences.activities.filter(item=>RESOURCE_TYPES.includes(item)),...RESOURCE_TYPES.filter(item=>!state.preferences.activities.includes(item))];
  openModal({eyebrow:'Inspiration',title:resource?'Modifier la ressource':'Ajouter une inspiration',body:`<div class="form-grid">${inputField('title','Titre','text',current.title,'required')}${selectField('type','Type',preferred,current.type)}${selectField('status','Statut',['potentiel','sélectionné'],current.status)}${inputField('location','Lieu','text',current.location)}${inputField('url','Lien','url',current.url,'class="full"')}${inputField('lat','Latitude','number',current.lat,'step="any"')}${inputField('lng','Longitude','number',current.lng,'step="any"')}${textareaField('notes','Notes',current.notes)}</div>`,onSubmit:form=>{
    const data=formDataObject(form);data.lat=data.lat===''?'':Number(data.lat);data.lng=data.lng===''?'':Number(data.lng);if(resource)Object.assign(resource,data);else trip.resources.push({id:uid('src'),...data});saveState('Inspiration enregistrée.');closeModal();renderPage();
  }});
}

function openGeocodeSearch() {
  openModal({ eyebrow:'Carte', title:'Rechercher un lieu', submitLabel:'Rechercher', body:`<div class="form-grid"><div class="field full"><label for="field-query">Nom du lieu</label><input id="field-query" name="query" placeholder="Ex. golf de Batalha, Açores" required><span class="hint">Recherche via Photon et OpenStreetMap, sans clé API.</span></div><div class="full" id="geocode-results"></div></div>`, onSubmit: async form => {
    const query = formDataObject(form).query;
    const resultsNode = $('#geocode-results');
    resultsNode.innerHTML = '<p class="muted">Recherche en cours...</p>';
    $('#modal-submit').disabled = true;
    try {
      const response = await fetch(`https://photon.komoot.io/api/?limit=6&q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Recherche indisponible');
      const data = await response.json();
      const features = data.features || [];
      resultsNode.innerHTML = features.length ? features.map((feature,index) => {
        const p=feature.properties||{}; const [lng,lat]=feature.geometry.coordinates; const label=[p.name,p.city,p.state,p.country].filter(Boolean).join(', ');
        return `<button type="button" class="card card-pad" style="display:block;width:100%;text-align:left;margin-top:8px;cursor:pointer" data-geocode-index="${index}" data-title="${esc(p.name||query)}" data-location="${esc(label)}" data-lat="${lat}" data-lng="${lng}"><strong>📍 ${esc(label)}</strong><br><small class="muted">${lat.toFixed(5)}, ${lng.toFixed(5)}</small></button>`;
      }).join('') : '<p class="muted">Aucun résultat. Précisez le pays ou la région.</p>';
      $$('[data-geocode-index]', resultsNode).forEach(button => button.addEventListener('click', () => {
        const result={title:button.dataset.title,location:button.dataset.location,lat:Number(button.dataset.lat),lng:Number(button.dataset.lng)};
        closeModal();openResourceForm(null,result);
      }));
    } catch(error) { resultsNode.innerHTML=`<p class="muted">${esc(error.message)}. Vous pouvez saisir les coordonnées manuellement.</p>`; }
    finally { $('#modal-submit').disabled=false; }
  }});
}

function moveActivity(dayId, activityId, direction) {
  const day=activeTrip().days.find(item=>item.id===dayId); if(!day)return;
  const index=day.activities.findIndex(item=>item.id===activityId); const target=index+direction;
  if(index<0||target<0||target>=day.activities.length)return;
  [day.activities[index],day.activities[target]]=[day.activities[target],day.activities[index]];
  saveState();renderPage();
}

function moveActivityBetweenDays(fromDayId,toDayId,activityId) {
  const trip=activeTrip(); const from=trip.days.find(item=>item.id===fromDayId); const to=trip.days.find(item=>item.id===toDayId); if(!from||!to)return;
  const index=from.activities.findIndex(item=>item.id===activityId); if(index<0)return;
  const [activity]=from.activities.splice(index,1); to.activities.push(activity); to.activities.sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
  saveState('Activité déplacée.');renderPage();
}

function exportData() {
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const link=document.createElement('a');
  link.href=url;link.download=`escapade-backup-${todayIso()}.json`;link.click();URL.revokeObjectURL(url);toast('Sauvegarde exportée.');
}

async function importData(file) {
  try { const data=JSON.parse(await file.text()); if(!Array.isArray(data.trips)||!data.trips.length) throw new Error('Format non reconnu'); state=normalizeState(data);ensureActiveTrip();saveState('Sauvegarde importée.');setTheme(state.theme||'light');renderTripSelect();renderPage(); }
  catch(error){toast(`Import impossible: ${error.message}`);}
}

function deleteById(collection,id) { const index=collection.findIndex(item=>item.id===id); if(index>=0)collection.splice(index,1); }

function addPreference(kind,inputId) {
  const value=$(inputId)?.value.trim(); if(!value)return;
  const key=kind==='destination'?'destinations':kind==='activity'?'activities':'travelers';
  if(!state.preferences[key].includes(value))state.preferences[key].push(value);
  saveState('Préférence ajoutée.');renderPage();
}

function removePreference(kind,index) {
  const key=kind==='destination'?'destinations':kind==='activity'?'activities':'travelers';state.preferences[key].splice(Number(index),1);saveState();renderPage();
}

function handleAction(action,node) {
  const trip=activeTrip();
  const findDay=id=>trip.days.find(item=>item.id===id);
  const findActivity=(dayId,id)=>findDay(dayId)?.activities.find(item=>item.id===id);
  switch(action) {
    case 'go-itinerary': navigate('itinerary'); break;
    case 'go-budget': navigate('budget'); break;
    case 'go-checklist': navigate('checklist'); break;
    case 'add-day': openDayForm(); break;
    case 'edit-day': openDayForm(findDay(node.dataset.id)); break;
    case 'delete-day': if(confirm('Supprimer cette journée et ses activités ?')){deleteById(trip.days,node.dataset.id);saveState('Journée supprimée.');renderPage();}break;
    case 'sync-days': {const dropped=syncTripDays(trip);saveState(dropped?`${dropped} journée(s) hors dates retirée(s) avec leurs activités.`:'Journées synchronisées avec les dates.');renderPage();break;}
    case 'add-activity': openActivityForm(findDay(node.dataset.id)); break;
    case 'edit-activity': openActivityForm(findDay(node.dataset.day),findActivity(node.dataset.day,node.dataset.id)); break;
    case 'delete-activity': {const day=findDay(node.dataset.day);if(day&&confirm('Supprimer cette activité ?')){deleteById(day.activities,node.dataset.id);saveState('Activité supprimée.');renderPage();}break;}
    case 'move-up': moveActivity(node.dataset.day,node.dataset.id,-1);break;
    case 'move-down': moveActivity(node.dataset.day,node.dataset.id,1);break;
    case 'add-expense': openExpenseForm();break;
    case 'edit-expense': openExpenseForm(trip.expenses.find(item=>item.id===node.dataset.id));break;
    case 'delete-expense': if(confirm('Supprimer cette dépense ?')){deleteById(trip.expenses,node.dataset.id);saveState('Dépense supprimée.');renderPage();}break;
    case 'edit-budget': openModal({eyebrow:'Budget',title:'Modifier l’enveloppe',body:`<div class="form-grid">${inputField('totalBudget','Budget total','number',trip.totalBudget,'min="0" step="50"')}${selectField('currency','Devise',['EUR','USD','CAD','GBP','MAD','MUR','SCR','JPY','THB'],trip.currency)}</div>`,onSubmit:form=>{const data=formDataObject(form);trip.totalBudget=asNumber(data.totalBudget);trip.currency=data.currency;saveState('Budget mis à jour.');closeModal();renderPage();}});break;
    case 'toggle-paid': { const item=trip.expenses.find(x=>x.id===node.dataset.id);if(item){item.paid=node.checked;saveState();renderPage();}break; }
    case 'add-reservation': openReservationForm();break;
    case 'edit-reservation': openReservationForm(trip.reservations.find(item=>item.id===node.dataset.id));break;
    case 'delete-reservation': if(confirm('Supprimer cette réservation ?')){deleteById(trip.reservations,node.dataset.id);saveState('Réservation supprimée.');renderPage();}break;
    case 'add-check': openChecklistForm();break;
    case 'edit-check': openChecklistForm(trip.checklist.find(item=>item.id===node.dataset.id));break;
    case 'delete-check': if(confirm('Supprimer cet élément ?')){deleteById(trip.checklist,node.dataset.id);saveState('Élément supprimé.');renderPage();}break;
    case 'toggle-check': {const item=trip.checklist.find(x=>x.id===node.dataset.id);if(item){item.done=node.checked;saveState();renderPage();}break;}
    case 'add-resource': openResourceForm();break;
    case 'edit-resource': openResourceForm(trip.resources.find(item=>item.id===node.dataset.id));break;
    case 'delete-resource': if(confirm('Supprimer cette inspiration ?')){deleteById(trip.resources,node.dataset.id);saveState('Inspiration supprimée.');renderPage();}break;
    case 'geocode-search': openGeocodeSearch();break;
    case 'edit-trip': openTripForm(trip);break;
    case 'duplicate-trip': {const copyTrip=clone(trip);copyTrip.id=uid('trip');copyTrip.name=`${trip.name} - copie`;state.trips.push(copyTrip);state.activeTripId=copyTrip.id;saveState('Voyage dupliqué.');renderTripSelect();renderPage();break;}
    case 'delete-trip': if(state.trips.length===1){toast('Conservez au moins un voyage.');break;} if(confirm(`Supprimer « ${trip.name} » ?`)){deleteById(state.trips,trip.id);state.activeTripId=state.trips[0].id;saveState('Voyage supprimé.');renderTripSelect();renderPage();}break;
    case 'add-destination-pref': addPreference('destination','#new-destination-pref');break;
    case 'add-activity-pref': addPreference('activity','#new-activity-pref');break;
    case 'add-traveler-pref': addPreference('traveler','#new-traveler-pref');break;
    case 'export-data': exportData();break;
    case 'import-data': $('#import-file').click();break;
    case 'reset-data': if(confirm('Réinitialiser toutes les données locales ?')){state=sampleState();saveState('Données réinitialisées.');setTheme('light');renderTripSelect();renderPage();}break;
  }
}

function bindGlobalEvents() {
  window.addEventListener('hashchange',()=>{currentPage=location.hash.replace('#','')||'overview';updateNav();renderPage();});
  document.addEventListener('click',event=>{
    const pageLink=event.target.closest('[data-page]'); if(pageLink){event.preventDefault();navigate(pageLink.dataset.page);return;}
    const actionNode=event.target.closest('[data-action]'); if(actionNode){handleAction(actionNode.dataset.action,actionNode);return;}
    const themeNode=event.target.closest('[data-set-theme]'); if(themeNode){setTheme(themeNode.dataset.setTheme);renderPage();return;}
    const removePref=event.target.closest('[data-remove-pref]');if(removePref){removePreference(removePref.dataset.removePref,removePref.dataset.index);return;}
    const mapDay=event.target.closest('[data-map-day]');if(mapDay){currentMapDay=mapDay.dataset.mapDay;renderPage();return;}
  });
  $('#trip-select').addEventListener('change',event=>{state.activeTripId=event.target.value;currentMapDay='all';saveState();renderPage();});
  $('#new-trip-btn').addEventListener('click',()=>openTripForm());
  $('#theme-btn').addEventListener('click',()=>setTheme(state.theme==='dark'?'light':'dark'));
  $('#print-btn').addEventListener('click',()=>window.print());
  $('#export-btn').addEventListener('click',exportData);
  $('#import-btn').addEventListener('click',()=>$('#import-file').click());
  $('#import-file').addEventListener('change',event=>{const file=event.target.files[0];if(file)importData(file);event.target.value='';});
  $('#modal-close').addEventListener('click',closeModal);$('#modal-cancel').addEventListener('click',closeModal);
  $('#modal-backdrop').addEventListener('click',event=>{if(event.target===event.currentTarget)closeModal();});
  $('#modal-form').addEventListener('submit',event=>{event.preventDefault();if(modalSubmitHandler)modalSubmitHandler(event.currentTarget);});
  document.addEventListener('keydown',event=>{
    if($('#modal-backdrop').classList.contains('hidden'))return;
    if(event.key==='Escape'){closeModal();return;}
    if(event.key==='Tab'){
      const focusables=$$('#modal-backdrop button, #modal-backdrop input, #modal-backdrop select, #modal-backdrop textarea, #modal-backdrop a[href]').filter(node=>!node.disabled&&node.offsetParent!==null);
      if(!focusables.length)return;
      const first=focusables[0],last=focusables[focusables.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
}

function boot() {
  ensureActiveTrip();
  setTheme(state.theme || 'light');
  renderTripSelect();
  updateNav();
  renderPage();
  bindGlobalEvents();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(()=>{});
}

boot();
