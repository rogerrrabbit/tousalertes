import './style.css'

const events = [
  { id: 'greece', title: 'Feux de forêt', place: 'Grèce centrale', type: 'fire', status: 'Actif', time: 'il y a 12 min', coordinates: [22.42, 38.84], intensity: 92 },
  { id: 'canada', title: 'Feux de forêt', place: 'Alberta, Canada', type: 'fire', status: 'Actif', time: 'il y a 28 min', coordinates: [-115.57, 54.22], intensity: 76 },
  { id: 'italy', title: 'Tempête', place: 'Mer Tyrrhénienne', type: 'storm', status: 'Surveillance', time: 'il y a 41 min', coordinates: [11.2, 40.4], intensity: 64 },
  { id: 'bangladesh', title: 'Inondations', place: 'Sylhet, Bangladesh', type: 'flood', status: 'Actif', time: 'il y a 1 h', coordinates: [91.87, 24.89], intensity: 83 },
  { id: 'iberia', title: 'Vigilance sécheresse', place: 'Péninsule ibérique', type: 'drought', status: 'Surveillance', time: 'il y a 2 h', coordinates: [-4.6, 40.25], intensity: 48 },
]

const basemaps = {
  topo: {
    version: 8,
    sources: { topo: { type: 'raster', tiles: ['https://a.tile.opentopomap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '© OpenTopoMap contributors' } },
    layers: [{ id: 'topo', type: 'raster', source: 'topo' }],
  },
  satellite: {
    version: 8,
    sources: { satellite: { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, attribution: 'Tiles © Esri' } },
    layers: [{ id: 'satellite', type: 'raster', source: 'satellite' }],
  },
}

document.querySelector('#app').innerHTML = `
  <header class="topbar">
    <a class="brand" href="/" aria-label="Tous Alertes — accueil"><span class="brand-mark">◉</span> tousalertes</a>
    <div class="live"><span></span> EN DIRECT <b>·</b> Mise à jour il y a 4 min</div>
    <button class="menu-button" aria-label="Ouvrir le menu">☰</button>
  </header>
  <main>
    <aside class="sidebar">
      <div class="sidebar-heading"><p class="eyebrow">VIGILANCE CLIMATIQUE</p><h1>Le monde,<br><em>en alerte.</em></h1></div>
      <div class="event-stats"><strong>127</strong><span>évènements suivis</span><strong class="fire-total">43</strong><span>incendies actifs</span></div>
      <div class="filters" aria-label="Filtres d'évènements">
        <button class="filter active" data-filter="all"><i></i>Tous <b>127</b></button>
        <button class="filter" data-filter="fire"><i></i>Incendies <b>43</b></button>
        <button class="filter" data-filter="flood"><i></i>Inondations <b>21</b></button>
        <button class="filter" data-filter="storm"><i></i>Tempêtes <b>18</b></button>
        <button class="filter" data-filter="drought"><i></i>Sécheresses <b>45</b></button>
      </div>
      <section class="feed"><div class="section-label">DERNIÈRES ALERTES <button id="refresh" aria-label="Actualiser les alertes">↻</button></div><div id="event-list"></div></section>
      <footer><a href="#sources">Sources de données</a><span>·</span><a href="#about">À propos</a></footer>
    </aside>
    <section class="map-area">
      <div id="map" aria-label="Carte des évènements climatiques mondiaux"></div>
      <p id="map-fallback" role="status" aria-live="polite" hidden>La carte est indisponible sur cet appareil. Les alertes restent accessibles ci-dessous.</p>
      <div class="map-controls">
        <div class="base-selector"><button data-base="topo" data-requires-map class="active">Carte topo</button><button data-base="satellite" data-requires-map>Satellite</button></div>
        <button id="locate" data-requires-map class="locate" aria-label="Me localiser">◎</button>
      </div>
      <div class="map-legend"><span><i class="legend-fire"></i>Incendie</span><span><i class="legend-flood"></i>Inondation</span><span><i class="legend-storm"></i>Tempête</span></div>
      <div class="focus-note"><span>◎</span><div><b>Focus incendies</b><br>Détections FIRMS / VIIRS<br>des dernières 24 heures</div><button id="focus-fires" data-requires-map>Voir sur la carte →</button></div>
    </section>
  </main>
`

let map
let maplibregl

function renderEvents(filter = 'all') {
  const visible = filter === 'all' ? events : events.filter((event) => event.type === filter)
  document.querySelector('#event-list').innerHTML = visible.map((event) => `
    <button class="event-card" data-event="${event.id}">
      <span class="event-dot ${event.type}"></span><span class="event-copy"><b>${event.title}</b><small>${event.place} · ${event.time}</small></span><span class="status ${event.status === 'Actif' ? 'active' : ''}">${event.status}</span>
    </button>`).join('')
  document.querySelectorAll('[data-event]').forEach((button) => button.addEventListener('click', () => focusEvent(events.find((event) => event.id === button.dataset.event))))
}

function focusEvent(event) {
  if (!map || !maplibregl) return
  map.flyTo({ center: event.coordinates, zoom: 5, essential: true })
  new maplibregl.Popup({ closeButton: false, offset: 16 }).setLngLat(event.coordinates).setHTML(`<strong>${event.title}</strong><br>${event.place}<br><small>${event.status} · ${event.time}</small>`).addTo(map)
}

function addEventLayers() {
  map.addSource('events', { type: 'geojson', data: { type: 'FeatureCollection', features: events.map((event) => ({ type: 'Feature', properties: event, geometry: { type: 'Point', coordinates: event.coordinates } })) } })
  map.addLayer({ id: 'event-glow', type: 'circle', source: 'events', paint: { 'circle-radius': ['interpolate', ['linear'], ['get', 'intensity'], 40, 15, 100, 34], 'circle-color': ['match', ['get', 'type'], 'fire', '#ff5b35', 'flood', '#36a8d8', 'storm', '#ae72e8', '#e9b949'], 'circle-opacity': 0.15 } })
  map.addLayer({ id: 'event-points', type: 'circle', source: 'events', paint: { 'circle-radius': 7, 'circle-color': ['match', ['get', 'type'], 'fire', '#ff5b35', 'flood', '#36a8d8', 'storm', '#ae72e8', '#e9b949'], 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' } })
}

async function initializeMap() {
  try {
    const module = await import('maplibre-gl')
    await import('maplibre-gl/dist/maplibre-gl.css')
    maplibregl = module.default
    map = new maplibregl.Map({ container: 'map', style: basemaps.topo, center: [9, 31], zoom: 2.1, attributionControl: false })
    map.addControl(new maplibregl.AttributionControl({ compact: true }))
    map.addControl(new maplibregl.NavigationControl(), 'bottom-right')
    map.on('style.load', addEventLayers)
    map.on('click', 'event-points', (event) => focusEvent(events.find((item) => item.id === event.features[0].properties.id)))
    map.on('mouseenter', 'event-points', () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', 'event-points', () => { map.getCanvas().style.cursor = '' })
  } catch (error) {
    console.error('Map initialization failed:', error)
    document.querySelector('#map-fallback').hidden = false
    document.querySelectorAll('[data-requires-map]').forEach((control) => {
      control.disabled = true
      control.setAttribute('aria-disabled', 'true')
    })
  }
}

document.querySelectorAll('.filter').forEach((button) => button.addEventListener('click', () => {
  document.querySelector('.filter.active').classList.remove('active')
  button.classList.add('active')
  renderEvents(button.dataset.filter)
}))
document.querySelectorAll('[data-base]').forEach((button) => button.addEventListener('click', () => {
  if (button.disabled) return
  document.querySelector('[data-base].active').classList.remove('active')
  button.classList.add('active')
  map?.setStyle(basemaps[button.dataset.base])
}))
document.querySelector('#focus-fires').addEventListener('click', () => { renderEvents('fire'); document.querySelector('[data-filter="fire"]').click(); map?.flyTo({ center: [10, 42], zoom: 3.5 }) })
document.querySelector('#locate').addEventListener('click', () => map?.flyTo({ center: [2.35, 48.86], zoom: 6 }))
document.querySelector('#refresh').addEventListener('click', (event) => { event.currentTarget.classList.add('spinning'); setTimeout(() => event.currentTarget.classList.remove('spinning'), 600) })
renderEvents()
initializeMap()
