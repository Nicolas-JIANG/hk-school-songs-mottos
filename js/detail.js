(() => {
  const schools = Array.isArray(window.SCHOOLS) ? window.SCHOOLS : [];
  const fieldLabels = window.SCHOOL_FIELD_LABELS || {};

  const FIELD = {
    id: "id",
    code: "No.",
    schoolLevel: "中學/小學",
    nameZh: "校名",
    nameEn: "School Name",
    website: "學校官方網址",
    category: "種類",
    region: "地區",
    district: "校網",
    sex: "性別",
    religion: "宗教背景",
    sponsor: "辦學團體",
    year: "成立年份",
    medium: "主要教學語言",
    mottoZh: "中文校訓",
    mottoEn: "英文校訓",
    mottoNote: "校訓說明",
    songLanguage: "校歌語言",
    songZh: "中文校歌歌詞",
    songEn: "英文校歌歌詞",
    songUrl: "校歌網址",
    youtube: "Youtube"
  };

  const content = document.getElementById("detailContent");
  const crumbName = document.getElementById("crumbName");
  const backBtn = document.getElementById("backBtn");

  function label(key) {
    return fieldLabels[key] || key;
  }

  function textValue(record, key) {
    const value = record[key];
    return value === undefined || value === null ? "" : String(value).trim();
  }

  function getRecordById() {
    const params = new URLSearchParams(window.location.search);
    const id = (params.get("id") || "").trim().toLowerCase();
    return schools.find((record) => textValue(record, FIELD.id).toLowerCase() === id);
  }

  function createSection(titleText) {
    const section = document.createElement("section");
    section.className = "section";
    const title = document.createElement("h2");
    title.textContent = titleText;
    section.appendChild(title);
    return section;
  }

  function createFieldRow(key, value) {
    const row = document.createElement("div");
    row.className = "field-row";

    const term = document.createElement("dt");
    term.textContent = label(key);
    row.appendChild(term);

    const description = document.createElement("dd");
    description.textContent = value;
    row.appendChild(description);

    return row;
  }

  function createLinkRow(key, url) {
    const row = document.createElement("div");
    row.className = "field-row";

    const term = document.createElement("dt");
    term.textContent = label(key);
    row.appendChild(term);

    const description = document.createElement("dd");
    const link = document.createElement("a");
    link.className = "link";
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = url;
    description.appendChild(link);
    row.appendChild(description);

    return row;
  }

  function appendFieldList(section, record, keys, options = {}) {
    const list = document.createElement("dl");
    list.className = "field-list";
    let rendered = 0;

    keys.forEach((key) => {
      const value = textValue(record, key);
      if (!value && !options.showEmpty) return;
      list.appendChild(createFieldRow(key, value || "未提供"));
      rendered += 1;
    });

    if (rendered > 0) {
      section.appendChild(list);
      return true;
    }

    return false;
  }

  function appendTextBlock(section, key, value) {
    if (!value) return false;

    const block = document.createElement("div");
    block.className = "text-block";

    const title = document.createElement("h3");
    title.textContent = label(key);
    block.appendChild(title);

    value.split(/\n+/).filter(Boolean).forEach((line) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = line;
      block.appendChild(paragraph);
    });

    section.appendChild(block);
    return true;
  }

  function appendLinks(section, record) {
    const list = document.createElement("dl");
    list.className = "field-list";
    let rendered = 0;

    [FIELD.website, FIELD.songUrl, FIELD.youtube].forEach((key) => {
      const value = textValue(record, key);
      if (!value) return;
      list.appendChild(createLinkRow(key, value));
      rendered += 1;
    });

    if (rendered === 0) return false;
    section.appendChild(list);
    return true;
  }

  function renderNotFound() {
    const title = document.createElement("h1");
    title.textContent = "找不到學校資料";
    const message = document.createElement("p");
    message.textContent = "此頁面的 id 未對應到目前資料集。";
    const link = document.createElement("a");
    link.className = "link";
    link.href = "index.html";
    link.textContent = "返回搜尋頁";

    content.replaceChildren(title, message, link);
  }

  function renderRecord(record) {
    const zhName = textValue(record, FIELD.nameZh);
    const enName = textValue(record, FIELD.nameEn);
    const titleText = zhName && enName ? `${zhName} / ${enName}` : zhName || enName || "未命名學校";

    crumbName.textContent = titleText;
    document.title = titleText;

    const title = document.createElement("h1");
    title.textContent = titleText;

    const codeLine = document.createElement("p");
    codeLine.className = "detail-subtitle";
    const subtitleParts = [];
    if (textValue(record, FIELD.schoolLevel)) {
      subtitleParts.push(`${label(FIELD.schoolLevel)}：${textValue(record, FIELD.schoolLevel)}`);
    }
    if (textValue(record, FIELD.category)) {
      subtitleParts.push(`${label(FIELD.category)}：${textValue(record, FIELD.category)}`);
    }
    codeLine.textContent = subtitleParts.join(" | ");

    const basicSection = createSection("基本資料");
    appendFieldList(basicSection, record, [
      FIELD.schoolLevel,
      FIELD.nameZh,
      FIELD.nameEn,
      FIELD.category,
      FIELD.region,
      FIELD.district,
      FIELD.sex,
      FIELD.religion,
      FIELD.sponsor,
      FIELD.year,
      FIELD.medium
    ]);

    const mottoSection = createSection("校訓");
    if (!appendFieldList(mottoSection, record, [FIELD.mottoZh, FIELD.mottoEn, FIELD.mottoNote])) {
      const empty = document.createElement("p");
      empty.textContent = "未提供校訓資料。";
      mottoSection.appendChild(empty);
    }

    const songSection = createSection("校歌");
    let songRendered = false;
    songRendered = appendFieldList(songSection, record, [FIELD.songLanguage]) || songRendered;
    songRendered = appendTextBlock(songSection, FIELD.songZh, textValue(record, FIELD.songZh)) || songRendered;
    songRendered = appendTextBlock(songSection, FIELD.songEn, textValue(record, FIELD.songEn)) || songRendered;
    if (!songRendered) {
      const empty = document.createElement("p");
      empty.textContent = "未提供校歌內容。";
      songSection.appendChild(empty);
    }

    const linksSection = createSection("連結");
    if (!appendLinks(linksSection, record)) {
      const empty = document.createElement("p");
      empty.textContent = "未提供可用連結。";
      linksSection.appendChild(empty);
    }

    content.replaceChildren(title, codeLine, basicSection, mottoSection, songSection, linksSection);
  }

  backBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  const record = getRecordById();
  if (!record) {
    renderNotFound();
    return;
  }

  renderRecord(record);
})();
