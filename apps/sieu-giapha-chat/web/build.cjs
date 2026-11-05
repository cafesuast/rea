// Tạo web/index.html (bản chạy độc lập) từ ../index.html (bản Artifact trong Claude).
// Dùng: node web/build.cjs
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const title = (src.match(/<title>([^<]*)<\/title>/) || [, "Siêu GiaPha chat"])[1];
const body = src.replace(/<title>[^<]*<\/title>\s*/, "").replace(/<meta name="claude:[^>]*>\s*/g, "");
const head = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="Gia phả có chat, ngày giỗ âm lịch, gia phả song song lịch sử, Siêu Từ Điển Việt – Anh và khóa tiếng Anh giao tiếp.">
<meta name="theme-color" content="#f2f2f7" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="GiaPha chat">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<script src="config.js"></script>
<script>if(window.SGP_CONFIG&&SGP_CONFIG.supabaseUrl)document.write('<script src="vendor/supabase-js-2.118.0.js"><\\/script>')</script>
<script src="sgp-runtime.js"></script>
</head>
<body>
`;
fs.writeFileSync(path.join(__dirname, "index.html"), head + body + "\n</body>\n</html>\n");
console.log("web/index.html:", Math.round((head.length + body.length) / 1024), "KB");
