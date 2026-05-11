(() => {
  const resources = window.PROJECT_RESOURCES || {};
  const container = document.getElementById("resourceList");
  if (!container) return;

  const type = container.dataset.resourceType;
  const items = Array.isArray(resources[type]) ? resources[type] : [];

  function createCard(item) {
    const article = document.createElement("article");
    article.className = "resource-card";

    if (item.embedUrl) {
      const media = document.createElement("div");
      media.className = "video-frame";
      const iframe = document.createElement("iframe");
      iframe.src = item.embedUrl;
      iframe.title = item.titleEn || item.titleZh || "Embedded video";
      iframe.allow = "autoplay";
      iframe.allowFullscreen = true;
      media.appendChild(iframe);
      article.appendChild(media);
    }

    const meta = document.createElement("p");
    meta.className = "resource-meta";
    meta.textContent = [item.type, item.provider, item.status].filter(Boolean).join(" · ");
    article.appendChild(meta);

    const title = document.createElement("h2");
    title.textContent = [item.titleZh, item.titleEn].filter(Boolean).join(" / ");
    article.appendChild(title);

    const zh = document.createElement("p");
    zh.textContent = item.descriptionZh || "資料將於稍後加入。";
    article.appendChild(zh);

    if (item.descriptionEn) {
      const en = document.createElement("p");
      en.className = "en muted-text";
      en.textContent = item.descriptionEn;
      article.appendChild(en);
    }

    if (item.url) {
      const link = document.createElement("a");
      link.className = "btn secondary resource-action";
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Open external link";
      article.appendChild(link);
    } else {
      const badge = document.createElement("span");
      badge.className = "status-badge";
      badge.textContent = item.status || "Coming soon";
      article.appendChild(badge);
    }

    return article;
  }

  container.replaceChildren();

  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "資料將於稍後加入。";
    container.appendChild(empty);
    return;
  }

  items.forEach((item) => container.appendChild(createCard(item)));
})();
