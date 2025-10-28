(function () {
  const DATA_PATH = "assetsprojects.json";
  const listEl = document.getElementById("projects-list");

  // ---- Leaflet Map ----
  const map = L.map("map", {
    center: [50.0, 8.2], // grob Rhein-Main
    zoom: 7,
    zoomControl: true
  });

  // Helle / dunkle Basiskarten
  const lightTiles = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    { attribution: "&copy; OpenStreetMap", maxZoom: 19 }
  );
  const darkTiles = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    { attribution: "&copy; Carto, OpenStreetMap", maxZoom: 19 }
  );

  // Start-Theme setzen
  const isDark = document.body.classList.contains("dark");
  (isDark ? darkTiles : lightTiles).addTo(map);

  // Bei Theme-Wechsel Layer tauschen
  document.addEventListener("themechange", (e) => {
    const mode = e.detail.mode;
    if (mode === "dark") {
      map.removeLayer(lightTiles);
      darkTiles.addTo(map);
    } else {
      map.removeLayer(darkTiles);
      lightTiles.addTo(map);
    }
  });

  // Marker-Layer
  const markerGroup = L.layerGroup().addTo(map);

  // Kartenbereich an Fenstergröße anpassen
  function resizeMap() {
    const el = document.getElementById("map");
    el.style.height = Math.max(380, window.innerHeight * 0.55) + "px";
    map.invalidateSize();
  }
  window.addEventListener("resize", resizeMap);
  resizeMap();

  // Karte ausrichten auf alle Marker
  function fitToMarkers() {
    const bounds = L.latLngBounds([]);
    markerGroup.eachLayer((m) => bounds.extend(m.getLatLng()));
    if (bounds.isValid()) map.fitBounds(bounds.pad(0.2));
  }

  // Projekt-Karte (DOM) erzeugen
  function createCard(p, idx, marker) {
    const a = document.createElement("a");
    a.className = "project-card";
    a.href = p.link || "javascript:void(0)";
    a.target = p.link ? "_blank" : "_self";
    a.rel = p.link ? "noopener" : "";

    if (p.image) {
      const img = document.createElement("img");
      img.src = p.image;
      img.alt = p.title || "Projekt";
      img.loading = "lazy";
      a.appendChild(img);
    }

    const body = document.createElement("div");
    body.className = "project-body";

    const h = document.createElement("h3");
    h.textContent = p.title || `Projekt ${idx + 1}`;

    const t = document.createElement("p");
    t.textContent = p.text || "";

    body.append(h, t);
    a.appendChild(body);

    // Klick auf Card -> Karte auf Marker zoomen & Popup öffnen
    a.addEventListener("click", (ev) => {
      if (!p.link) ev.preventDefault(); // wenn kein externer Link
      if (marker) {
        map.setView(marker.getLatLng(), Math.max(map.getZoom(), 12), { animate: true });
        marker.openPopup();
      }
    });

    return a;
  }

  async function loadProjects() {
    try {
      const res = await fetch(DATA_PATH, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        listEl.innerHTML = "<div class='projects-empty'>Noch keine Projekte vorhanden.</div>";
        return;
      }

      listEl.innerHTML = "";
      markerGroup.clearLayers();

      data.forEach((p, idx) => {
        // Marker
        let marker = null;
        if (typeof p.lat === "number" && typeof p.lng === "number") {
          marker = L.marker([p.lat, p.lng]).addTo(markerGroup);

          const popupHtml = `
            <div style="min-width:180px">
              <strong>${p.title || "Projekt"}</strong><br/>
              ${p.text ? `<small>${p.text}</small><br/>` : ""}
              ${p.link ? `<a href="${p.link}" target="_blank" rel="noopener">Mehr erfahren</a>` : ""}
            </div>`;
          marker.bindPopup(popupHtml);

          // Klick auf Marker -> passende Card "highlighten"
          marker.on("click", () => {
            const all = document.querySelectorAll(".project-card");
            all.forEach((el) => el.classList.remove("active"));
            const card = document.querySelector(`.project-card[data-idx="${idx}"]`);
            if (card) {
              card.classList.add("active");
              card.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
          });
        }

        // Card
        const card = createCard(p, idx, marker);
        card.dataset.idx = String(idx);
        listEl.appendChild(card);
      });

      fitToMarkers();
    } catch (err) {
      console.error("Projekte laden fehlgeschlagen:", err);
      listEl.innerHTML = "<div class='projects-error'>Die Projekte konnten nicht geladen werden.</div>";
    }
  }

  loadProjects();
})();
