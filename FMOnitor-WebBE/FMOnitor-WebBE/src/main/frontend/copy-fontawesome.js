// Copies the Font Awesome Free CSS + webfonts out of node_modules and into
// src/main/resources/static/fontawesome/ so Spring serves them as ordinary
// static assets. The old React app pulled icons in as a JS component library
// (@fortawesome/react-fontawesome); the server-rendered templates just use
// the plain <i class="fa-solid fa-..."> markup that the CSS drives, so we
// only need the stylesheet and its font files.
//
// Run it with:  npm run icons
// (re-run only when the fontawesome-free version in package.json changes.)

const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'node_modules', '@fortawesome', 'fontawesome-free');
const dest = path.join(__dirname, '..', 'resources', 'static', 'fontawesome');

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const f = path.join(from, entry.name);
    const t = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(f, t);
    else fs.copyFileSync(f, t);
  }
}

// all.min.css references ../webfonts/* relatively, so the two folders have to
// sit next to each other exactly like they do inside the package.
fs.mkdirSync(path.join(dest, 'css'), { recursive: true });
fs.copyFileSync(
  path.join(src, 'css', 'all.min.css'),
  path.join(dest, 'css', 'all.min.css'),
);
copyDir(path.join(src, 'webfonts'), path.join(dest, 'webfonts'));

console.log('Font Awesome copied to', path.relative(process.cwd(), dest));
