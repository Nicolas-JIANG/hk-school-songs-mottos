(() => {
  const schools = Array.isArray(window.SCHOOLS) ? window.SCHOOLS : [];
  const fieldLabels = window.SCHOOL_FIELD_LABELS || {};

  const FIELD = {
    id: "id",
    code: "No.",
    nameZh: "校名",
    nameEn: "School Name",
    category: "種類",
    region: "地區",
    district: "校網",
    schoolLevel: "中學/小學",
    sponsor: "辦學團體",
    website: "學校官方網址"
  };

  const keywordInput = document.getElementById("keyword");
  const categoryFilter = document.getElementById("categoryFilter");
  const regionFilter = document.getElementById("regionFilter");
  const districtFilter = document.getElementById("districtFilter");
  const resultsEl = document.getElementById("results");
  const resultCountEl = document.getElementById("resultCount");
  const searchBtn = document.getElementById("searchBtn");

  function label(key) {
    return fieldLabels[key] || key;
  }

  function textValue(record, key) {
    const value = record[key];
    return value === undefined || value === null ? "" : String(value).trim();
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function searchableText(record) {
    return [
      textValue(record, FIELD.code),
      textValue(record, FIELD.nameZh),
      textValue(record, FIELD.nameEn),
      textValue(record, FIELD.category),
      textValue(record, FIELD.region),
      textValue(record, FIELD.district),
      textValue(record, FIELD.sponsor),
      textValue(record, FIELD.website)
    ]
      .join(" ")
      .toLowerCase();
  }

  function scoreSchool(record, query) {
    if (!query) return 1;

    const q = normalize(query);
    const primaryFields = [
      textValue(record, FIELD.code),
      textValue(record, FIELD.nameZh),
      textValue(record, FIELD.nameEn)
    ]
      .filter(Boolean)
      .map((value) => value.toLowerCase());

    let score = 0;
    primaryFields.forEach((field) => {
      if (field === q) score += 120;
      else if (field.startsWith(q)) score += 80;
      else if (field.includes(q)) score += 45;
    });

    if (searchableText(record).includes(q)) score += 20;
    return score;
  }

  function uniqueValues(key) {
    return [...new Set(schools.map((record) => textValue(record, key)).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "zh-Hant")
    );
  }

  function appendOptions(selectEl, key) {
    uniqueValues(key).forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      selectEl.appendChild(option);
    });
  }

  function appendMetaLine(parent, content) {
    const line = document.createElement("p");
    line.textContent = content;
    parent.appendChild(line);
  }

  function renderResults() {
    const query = keywordInput.value;
    const category = categoryFilter.value;
    const region = regionFilter.value;
    const district = districtFilter.value;

    const filtered = schools
      .filter((record) => (!category ? true : textValue(record, FIELD.category) === category))
      .filter((record) => (!region ? true : textValue(record, FIELD.region) === region))
      .filter((record) => (!district ? true : textValue(record, FIELD.district) === district))
      .map((record) => ({ record, score: scoreSchool(record, query) }))
      .filter((entry) => (query ? entry.score > 0 : true))
      .sort((a, b) => {
        const codeA = textValue(a.record, FIELD.code);
        const codeB = textValue(b.record, FIELD.code);
        return b.score - a.score || codeA.localeCompare(codeB, "en");
      });

    resultCountEl.textContent = `顯示 ${filtered.length} 間學校`;
    resultsEl.replaceChildren();

    if (filtered.length === 0) {
      const empty = document.createElement("p");
      empty.className = "card card-empty";
      empty.textContent = "找不到符合條件的學校。";
      resultsEl.appendChild(empty);
      return;
    }

    filtered.forEach(({ record }) => {
      const card = document.createElement("a");
      card.className = "card";
      card.href = `detail.html?id=${encodeURIComponent(textValue(record, FIELD.id))}`;

      const title = document.createElement("h3");
      const zhName = textValue(record, FIELD.nameZh);
      const enName = textValue(record, FIELD.nameEn);
      title.textContent = zhName && enName ? `${zhName} / ${enName}` : zhName || enName || textValue(record, FIELD.code);
      card.appendChild(title);

      appendMetaLine(card, `${label(FIELD.code)}：${textValue(record, FIELD.code)}`);
      appendMetaLine(card, `${label(FIELD.category)}：${textValue(record, FIELD.category) || "未提供"}`);
      appendMetaLine(
        card,
        `${label(FIELD.region)}：${textValue(record, FIELD.region) || "未提供"} | ${label(FIELD.district)}：${textValue(record, FIELD.district) || "未提供"}`
      );
      appendMetaLine(card, `${label(FIELD.sponsor)}：${textValue(record, FIELD.sponsor) || "未提供"}`);

      const pill = document.createElement("span");
      pill.className = "pill";
      pill.textContent = "查看詳情";
      card.appendChild(pill);

      resultsEl.appendChild(card);
    });
  }

  appendOptions(categoryFilter, FIELD.category);
  appendOptions(regionFilter, FIELD.region);
  appendOptions(districtFilter, FIELD.district);
  renderResults();

  keywordInput.addEventListener("input", renderResults);
  categoryFilter.addEventListener("change", renderResults);
  regionFilter.addEventListener("change", renderResults);
  districtFilter.addEventListener("change", renderResults);
  searchBtn.addEventListener("click", renderResults);
})();
