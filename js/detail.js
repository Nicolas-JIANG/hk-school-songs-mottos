(() => {
  const schools = Array.isArray(window.SCHOOLS) ? window.SCHOOLS : [];
  const content = document.getElementById("detailContent");
  const crumbName = document.getElementById("crumbName");
  const backBtn = document.getElementById("backBtn");

  function typeLabel(type) {
    if (type === "primary") return "Primary";
    if (type === "secondary") return "Secondary";
    return "Other";
  }

  function paragraphize(text) {
    return (text || "")
      .split(/\n+/)
      .filter(Boolean)
      .map((line) => `<p>${line}</p>`)
      .join("");
  }

  function getSchoolById() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id") || "";
    return schools.find((school) => school.id === id);
  }

  function renderNotFound() {
    content.innerHTML = `
      <h1>School not found</h1>
      <p>The requested school does not exist in this dataset.</p>
      <p><a class="link" href="index.html">Return to search</a></p>
    `;
  }

  function renderSchool(school) {
    const title = `${school.nameZh || ""}${school.nameEn ? ` / ${school.nameEn}` : ""}`;
    crumbName.textContent = title;

    const refs = (school.references || [])
      .map((ref) => `<li><a class="link" href="${ref}" target="_blank" rel="noopener noreferrer">${ref}</a></li>`)
      .join("");

    content.innerHTML = `
      <h1>${title}</h1>
      <p><strong>Type:</strong> ${typeLabel(school.type)}</p>
      <p><strong>District:</strong> ${school.district || "Not available"}</p>

      <section class="section">
        <h2>School Introduction</h2>
        <p>${school.intro || "Introduction not available."}</p>
      </section>

      <section class="section">
        <h2>Motto</h2>
        <p><strong>Chinese:</strong> ${school.mottoZh || "Not available"}</p>
        <p><strong>English:</strong> ${school.mottoEn || "Not available"}</p>
      </section>

      <section class="section">
        <h2>School Song</h2>
        ${school.songLyrics ? paragraphize(school.songLyrics) : "<p>Song content not available.</p>"}
      </section>

      <section class="section">
        <h2>External Links</h2>
        <p>
          <a class="link" href="${school.officialWebsite || "#"}" target="_blank" rel="noopener noreferrer">
            Official Website
          </a>
        </p>
        ${refs ? `<h3>Other References</h3><ul>${refs}</ul>` : ""}
      </section>

      <section class="section">
        <h2>Data Source / Disclaimer</h2>
        <p>Information is for reference only. Please verify with the official school website.</p>
      </section>
    `;
  }

  backBtn.addEventListener("click", () => {
    if (document.referrer) {
      window.history.back();
      return;
    }
    window.location.href = "index.html";
  });

  const school = getSchoolById();
  if (!school) renderNotFound();
  else renderSchool(school);
})();
