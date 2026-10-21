/* ---------- SERVICES MAP ---------- */
let servicesMapInstance = null;
let servicesMapMarkers = [];
let servicesAllData = [];
let servicesUserPos = null;
let servicesActiveFilter = "tutti";

function haversineKm(lat1, lng1, lat2, lng2){
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const SERVICE_TYPE_LABELS = { veterinario: "Veterinario", centro_ippico: "Centro ippico", negozio: "Negozio" };
const SERVICE_TYPE_ICONS = { veterinario: "fa-stethoscope", centro_ippico: "fa-horse-head", negozio: "fa-store" };

async function fetchOsmServices(lat, lng, radiusM){
  const query = `[out:json][timeout:20];(node["amenity"="veterinary"](around:${radiusM},${lat},${lng});node["leisure"="horse_riding"](around:${radiusM},${lat},${lng});node["sport"="equestrian"](around:${radiusM},${lat},${lng});node["shop"="equestrian"](around:${radiusM},${lat},${lng}););out center;`;
  const res = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: "data=" + encodeURIComponent(query) });
  if(!res.ok) throw new Error("overpass_http_" + res.status);
  const json = await res.json();
  return (json.elements || []).map(el => {
    const tags = el.tags || {};
    let tipo = "negozio";
    if(tags.amenity === "veterinary") tipo = "veterinario";
    else if(tags.leisure === "horse_riding" || tags.sport === "equestrian") tipo = "centro_ippico";
    else if(tags.shop === "equestrian") tipo = "negozio";
    return {
      id: "osm-" + el.id,
      tipo,
      nome: tags.name || SERVICE_TYPE_LABELS[tipo],
      indirizzo: [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" ") || null,
      telefono: tags.phone || tags["contact:phone"] || null,
      lat: el.lat, lng: el.lon,
      fonte: "osm",
    };
  });
}

function openServicesMap(){
  openModal("modal-services-map");
  servicesActiveFilter = "tutti";
  document.getElementById("services-list").innerHTML = '<div class="loading"><div class="spinner"></div> Cerco i servizi vicino a te...</div>';
  if(!navigator.geolocation){
    document.getElementById("services-list").innerHTML = '<div class="empty-state">Il tuo browser non supporta la geolocalizzazione.</div>';
    return;
  }
  navigator.geolocation.getCurrentPosition(async pos => {
    servicesUserPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    await loadServicesData();
  }, () => {
    document.getElementById("services-list").innerHTML = '<div class="empty-state">Attiva la posizione per vedere i servizi vicino a te.<br><button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="openServicesMap()">Riprova</button></div>';
  }, { enableHighAccuracy: false, timeout: 8000 });
}

async function loadServicesData(){
  document.getElementById("services-list").innerHTML = '<div class="loading"><div class="spinner"></div> Cerco i servizi vicino a te...</div>';
  let osmData = [];
  let curatedData = [];
  let osmError = false;
  try{
    [osmData, curatedData] = await Promise.all([
      fetchOsmServices(servicesUserPos.lat, servicesUserPos.lng, 15000),
      DB.listServices(),
    ]);
    if(osmData.length === 0){
      // niente entro 15km: prova un raggio più ampio prima di arrenderti
      osmData = await fetchOsmServices(servicesUserPos.lat, servicesUserPos.lng, 40000);
    }
  }catch(e){
    osmError = true;
    curatedData = await DB.listServices().catch(() => []);
  }
  const curated = (curatedData || []).map(s => ({ ...s, fonte: "curato" }));
  servicesAllData = [...curated, ...osmData]
    .map(s => ({ ...s, distanza: haversineKm(servicesUserPos.lat, servicesUserPos.lng, s.lat, s.lng) }))
    .sort((a, b) => a.distanza - b.distanza);
  initServicesMapView();
  if(servicesAllData.length === 0 && osmError){
    document.getElementById("services-list").innerHTML = '<div class="empty-state">Errore di connessione durante la ricerca. Riprova.<br><button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="loadServicesData()">Riprova</button></div>';
    return;
  }
  renderServicesList();
}

function initServicesMapView(){
  const el = document.getElementById("services-map-canvas");
  if(!el) return;
  if(servicesMapInstance){ servicesMapInstance.remove(); servicesMapInstance = null; }
  servicesMapInstance = L.map(el).setView([servicesUserPos.lat, servicesUserPos.lng], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(servicesMapInstance);
  L.circleMarker([servicesUserPos.lat, servicesUserPos.lng], { radius: 7, color: "#03491d", fillColor: "#03491d", fillOpacity: 1 }).addTo(servicesMapInstance).bindPopup("Tu sei qui");
  renderServicesMarkers();
}

function renderServicesMarkers(){
  if(!servicesMapInstance) return;
  servicesMapMarkers.forEach(m => servicesMapInstance.removeLayer(m));
  servicesMapMarkers = [];
  const filtered = servicesActiveFilter === "tutti" ? servicesAllData : servicesAllData.filter(s => s.tipo === servicesActiveFilter);
  filtered.forEach(s => {
    const marker = L.marker([s.lat, s.lng]).addTo(servicesMapInstance).bindPopup(`<b>${escapeHtml(s.nome)}</b><br>${SERVICE_TYPE_LABELS[s.tipo]}`);
    marker.on("click", () => focusServiceOnMap(s.id));
    servicesMapMarkers.push(marker);
  });
}

function filterServices(tipo){
  servicesActiveFilter = tipo;
  document.querySelectorAll("#services-map-chips .chip").forEach(c => c.classList.toggle("active", c.dataset.tipo === tipo));
  renderServicesMarkers();
  renderServicesList();
}

function renderServicesList(){
  const box = document.getElementById("services-list");
  const filtered = servicesActiveFilter === "tutti" ? servicesAllData : servicesAllData.filter(s => s.tipo === servicesActiveFilter);
  if(filtered.length === 0){
    box.innerHTML = '<div class="empty-state">Nessun servizio trovato nella zona.</div>';
    return;
  }
  box.innerHTML = filtered.map(s => `
    <div class="inbox-item" id="service-item-${s.id}" onclick="focusServiceOnMap('${s.id}')">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
        <div>
          <div style="font-weight:600"><span class="fa-icon"><i class="fa-solid ${SERVICE_TYPE_ICONS[s.tipo]}"></i></span> ${escapeHtml(s.nome)}${s.fonte === "curato" ? ' <span title="Verificato da Equo">★</span>' : ""}</div>
          <div class="muted" style="font-size:12px">${SERVICE_TYPE_LABELS[s.tipo]} · ${s.distanza.toFixed(1)} km${s.indirizzo ? " · " + escapeHtml(s.indirizzo) : ""}</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:8px" onclick="event.stopPropagation()">
        ${s.telefono ? `<a class="btn btn-outline btn-sm" href="tel:${escapeHtml(String(s.telefono).replace(/[^\d+]/g, ""))}"><span class="fa-icon"><i class="fa-solid fa-phone"></i></span> Chiama</a>` : ""}
        <a class="btn btn-outline btn-sm" href="https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}" target="_blank" rel="noopener"><span class="fa-icon"><i class="fa-solid fa-diamond-turn-right"></i></span> Indicazioni</a>
      </div>
    </div>
  `).join("");
}

function focusServiceOnMap(id){
  const s = servicesAllData.find(x => x.id === id);
  if(!s || !servicesMapInstance) return;
  servicesMapInstance.setView([s.lat, s.lng], 15);
  const marker = servicesMapMarkers.find(m => m.getLatLng().lat === s.lat && m.getLatLng().lng === s.lng);
  if(marker) marker.openPopup();
}

