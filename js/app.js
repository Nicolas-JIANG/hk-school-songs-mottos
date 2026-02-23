(() => {
  const schools = Array.isArray(window.SCHOOLS) ? window.SCHOOLS : [];
  const keywordInput = document.getElementById("keyword");
  const typeFilter = document.getElementById("typeFilter");
  const districtFilter = document.getElementById("districtFilter");
  const resultsEl = document.getElementById("results");
  const resultCountEl = document.getElementById("resultCount");
  const searchBtn = document.getElementById("searchBtn");

  function normalize(value) {
    return (value || "").toString().toLowerCase().trim();
  }

  function searchableText(school) {
    return [
      school.nameZh,
      school.nameEn,
      school.type,
      school.district,
      ...(school.aliases || [])
    ]
      .join(" ")
      .toLowerCase();
  }

  function scoreSchool(school, query) {
    if (!query) return 1;
    const q = normalize(query);
    const fields = [school.nameZh, school.nameEn, ...(school.aliases || [])].map(normalize);
    let score = 0;

    for (const field of fields) {
      if (!field) continue;
      if (field === q) score += 120;
      else if (field.startsWith(q)) score += 80;
      else if (field.includes(q)) score += 45;
    }

    const full = searchableText(school);
    if (full.includes(q)) score += 20;
    return score;
  }

  function buildDistrictFilter() {
    const districts = [...new Set(schools.map((s) => s.district).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b)
    );

    districts.forEach((district) => {
      const option = document.createElement("option");
      option.value = district;
      option.textContent = district;
      districtFilter.appendChild(option);
    });
  }

  function typeLabel(type) {
    if (type === "primary") return "Primary";
    if (type === "secondary") return "Secondary";
    return "Other";
  }

  function renderResults() {
    const query = keywordInput.value;
    const type = typeFilter.value;
    const district = districtFilter.value;

    const filtered = schools
      .filter((school) => (!type ? true : school.type === type))
      .filter((school) => (!district ? true : school.district === district))
      .map((school) => ({ school, score: scoreSchool(school, query) }))
      .filter((entry) => (query ? entry.score > 0 : true))
      .sort((a, b) => b.score - a.score || a.school.nameEn.localeCompare(b.school.nameEn));

    resultCountEl.textContent = `${filtered.length} school(s) found`;
    resultsEl.innerHTML = "";

    if (filtered.length === 0) {
      resultsEl.innerHTML = '<p class="card">No matching schools found.</p>';
      return;
    }

    filtered.forEach(({ school }) => {
      const card = document.createElement("a");
      card.className = "card";
      card.href = `detail.html?id=${encodeURIComponent(school.id)}`;
      card.innerHTML = `
        <h3>${school.nameZh || ""}${school.nameEn ? ` / ${school.nameEn}` : ""}</h3>
        <p>${typeLabel(school.type)}</p>
        <p>${school.district || "District not available"}</p>
        <span class="pill">View Details</span>
      `;
      resultsEl.appendChild(card);
    });
  }

  buildDistrictFilter();
  renderResults();

  keywordInput.addEventListener("input", renderResults);
  typeFilter.addEventListener("change", renderResults);
  districtFilter.addEventListener("change", renderResults);
  searchBtn.addEventListener("click", renderResults);
})();
