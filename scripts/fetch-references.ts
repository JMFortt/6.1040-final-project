/**
 * One-shot download of the curated Commons sample. Not part of the running app.
 * Writes web/public/references and prints a catalog the seed module can keep.
 */
const items = [
  { key: "eltham-palace", title: "File:Eltham_Palace_DSC04264_(17023635625).jpg", tags: ["perspective"] },
  { key: "gold-pendant", title: "File:02023_Gold_pendant_from_the_first_centuries_AD_found_in_Oronska.jpg", tags: ["form", "lighting", "color"] },
  { key: "brass", title: "File:Brass.jpg", tags: ["perspective", "form"] },
  { key: "flowers-leaves-bugs", title: "File:Flowers,_leaves_and_bugs_(20795530082).jpg", tags: ["form", "color"] },
  { key: "tang-jade-dog", title: "File:Tang_Jade_Dog.jpg", tags: ["form"] },
  { key: "fontaine-diane", title: "File:Fontaine_Diane_Fountain_Diana_Anet_Louvre_MR_1581,_MR_sup_123.jpg", tags: ["perspective", "form", "anatomy"] },
  { key: "penacho", title: "File:Penacho_a_contraluz.jpg", tags: ["perspective", "anatomy"] },
  { key: "summer-palace-ornaments", title: "File:2014.08.27.125220_Ornaments_Sumeru_Lingjing_Summer_Palace_Beijing.jpg", tags: ["form"] },
  { key: "mother-of-pearl-button", title: "File:Iridescent_Mother-of-Pearl_Button_-_DPLA_-_eccaa0035af585598348daac7468ce98_(page_1).jpg", tags: ["lighting", "color"] },
  { key: "iron-rust-vase", title: "File:Chinese_-_Iridescent_Iron-Rust_Vase_-_Walters_492063_-_Front_View_B.jpg", tags: ["lighting", "color"] },
  { key: "karl-gummies", title: "File:Karl_Gummies_top_view.jpg", tags: ["lighting", "color"] },
  { key: "gummy-bear", title: "File:Gummy-bear_2006-06-02.jpg", tags: ["lighting", "color"] },
  { key: "ionic-capital", title: "File:Fragment_of_an_Ionic_capital,_175-150_BC,_marble,_from_Pergamon,_Turkey,_Antikensammlung_V4.2-143,_in_the_Neues_Museum,_Berlin_(01).jpg", tags: ["form"] },
  { key: "kolomenskaya-ball", title: "File:Moscow,_Kolomenskaya_Street,_safety_ball_on_fence_May_2025_01.jpg", tags: ["perspective", "lighting"] },
  { key: "lions-mane-jellyfish", title: "File:Lion's_mane_jellyfish_in_Gullmarn_fjord_at_Sämstad_3.jpg", tags: ["color", "form"] },
  { key: "augustus-bronze", title: "File:Augustus_Bronze_X23322_NAMAthens.jpg", tags: ["anatomy"] },
  { key: "guajillo", title: "File:Capsicum_annuum_(Guajillo)_-_dried.jpg", tags: ["form", "lighting"] },
];

const headers = { "User-Agent": "Redraw/1.0 (MIT 6.1040 student project; educational reference bank)", "Api-User-Agent": "Redraw/1.0 (MIT 6.1040 student project)" };

function plain(value: string | undefined) {
  if (!value) return "";
  const text = value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
  return text;
}

const params = new URLSearchParams({
  action: "query",
  format: "json",
  titles: items.map((item) => item.title).join("|"),
  prop: "imageinfo",
  iiprop: "url|size|mime|extmetadata",
  iiurlwidth: "1000",
  maxlag: "5",
});
const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { headers });
if (!response.ok) throw new Error(`Commons API ${response.status}`);
const body = await response.json() as {
  query: {
    normalized?: Array<{ from: string; to: string }>;
    pages: Record<string, { title: string; missing?: string; imageinfo?: Array<{ thumburl?: string; thumbwidth?: number; thumbheight?: number; url: string; width: number; height: number; mime: string; extmetadata?: Record<string, { value: string }> }> }>;
  };
};
const byTitle = new Map<string, (typeof body.query.pages)[string]>();
for (const page of Object.values(body.query.pages)) byTitle.set(page.title, page);
for (const name of body.query.normalized ?? []) {
  const page = byTitle.get(name.to);
  if (page) byTitle.set(name.from, page);
}
const dir = new URL("../web/public/references/", import.meta.url);
await Bun.write(new URL(".gitkeep", dir), "");

for (const item of items) {
  const page = byTitle.get(item.title);
  const info = page?.imageinfo?.[0];
  if (!info) throw new Error(`missing ${item.title}`);
  const longest = Math.max(info.width, info.height);
  const width = longest <= 960 ? info.width : Math.max(1, Math.round(info.width * (960 / longest)));
  const fileName = item.title.slice("File:".length);
  const rendition = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=${width}`;
  const image = await fetch(rendition, { headers, redirect: "follow" });
  if (!image.ok) throw new Error(`download ${item.key} ${image.status}`);
  const type = image.headers.get("content-type") ?? info.mime;
  const extension = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
  const bytes = new Uint8Array(await image.arrayBuffer());
  await Bun.write(new URL(`${item.key}.${extension}`, dir), bytes);
  const meta = info.extmetadata ?? {};
  const artist = plain(meta.Artist?.value);
  const attribution = plain(meta.Credit?.value);
  const license = plain(meta.LicenseShortName?.value) || "Public domain";
  const stripped = artist.replace(/Unknown author/gi, " ").replace(/Anonymous\s*\([^)]*\)/g, " ").replace(/\s+/g, " ").trim().replace(/\s*\([^)]*\)\s*$/, "");
  const name = stripped
    || (attribution.includes("Missouri Historical Society") ? "Missouri Historical Society" : "")
    || (attribution.includes("Walters Art Museum") ? "Walters Art Museum" : "")
    || "Unknown author";
  console.log(JSON.stringify({
    key: item.key,
    file: `${item.key}.${extension}`,
    bytes: bytes.byteLength,
    width,
    original: `${info.width}x${info.height}`,
    tags: item.tags,
    license,
    credit: `${name}, ${license}`.slice(0, 300),
    commons: `https://commons.wikimedia.org/wiki/${encodeURIComponent(item.title).replace(/%3A/g, ":").replace(/%2F/g, "/")}`,
  }));
}
