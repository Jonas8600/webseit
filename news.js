(function () {
  const NEWS_JSON_PATH = "assets/news.json";   // Pfad ggf. anpassen
  const list = document.getElementById("news-list");
  const FALLBACK_IMAGE = "assets/news_fallback.jpg"; // optional

  const fmtDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString("de-DE", { year: "numeric", month: "2-digit", day: "2-digit" });
    } catch {
      return iso || "";
    }
  };

  const createCard = (item) => {
    const a = document.createElement("a");
    a.className = "news-card";
    if (item.link) {
      a.href = item.link;
      a.target = "_blank";
      a.rel = "noopener";
    } else {
      a.href = "javascript:void(0)";
    }

    const img = document.createElement("img");
    img.loading = "lazy";
    img.src = item.image || FALLBACK_IMAGE;
    img.alt = item.title || "News";
    img.onerror = () => (img.src = FALLBACK_IMAGE);

    const body = document.createElement("div");
    body.className = "news-body";

    const h = document.createElement("h3");
    h.textContent = item.title || "Ohne Titel";

    const d = document.createElement("div");
    d.className = "news-date";
    d.textContent = fmtDate(item.date);

    const p = document.createElement("p");
    p.textContent = item.text || "";

    body.append(h, d, p);
    a.append(img, body);
    return a;
  };

  async function loadNews() {
    try {
      const res = await fetch(NEWS_JSON_PATH, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        list.innerHTML = `<div class="news-empty">Noch keine News vorhanden.</div>`;
        return;
      }

      // Neueste zuerst (nach Datum absteigend)
      data.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

      list.innerHTML = "";
      data.forEach((item) => list.appendChild(createCard(item)));
    } catch (err) {
      console.error("News laden fehlgeschlagen:", err);
      list.innerHTML = `<div class="news-error">Die News konnten nicht geladen werden. Bitte später erneut versuchen.</div>`;
    }
  }

  loadNews();
})();
