(() => {
  const schools = Array.isArray(window.SCHOOLS) ? window.SCHOOLS : [];

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value.toLocaleString("en-US");
  }

  const primaryCount = schools.filter((record) => record["中學/小學"] === "小學").length;
  const secondaryCount = schools.filter((record) => record["中學/小學"] === "中學").length;

  setText("totalSchools", schools.length);
  setText("primarySchools", primaryCount);
  setText("secondarySchools", secondaryCount);
})();
