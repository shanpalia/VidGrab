import fs from 'node:fs';

const homePath = 'src/components/HomePage.tsx';
let home = fs.readFileSync(homePath, 'utf8');
const startMarker = '      {/* Top Header Section with Original VidGrab Wordmark & Shan Palia Credit */}';
const endMarker = '      {/* TOP ADDRESS BAR (Large rounded address bar with NEXT → and NO Grab button) */}';
const start = home.indexOf(startMarker);
const end = home.indexOf(endMarker, start + startMarker.length);
if (start >= 0 && end > start) {
  home = home.slice(0, start) + home.slice(end);
  console.log('[ui] removed duplicate Home branding header');
} else {
  console.log('[ui] Home branding header already removed/not found');
}

// Do not hide the app Header on mobile. The Android native layer is responsible
// for status-bar/cutout insets, while the Header remains visible above app content.
const appPath = 'src/App.tsx';
let app = fs.readFileSync(appPath, 'utf8');
app = app.replace(
  "{!isBrowser && <div className=\"hidden md:block\"><Header activeTab={activeTab} onNavigate={navigate} filesCount={files.length} /></div>}",
  "{!isBrowser && <Header activeTab={activeTab} onNavigate={navigate} filesCount={files.length} />}"
);
app = app.replace(
  "{!isBrowser && <Header activeTab={activeTab} onNavigate={navigate} filesCount={files.length} />}",
  "{!isBrowser && <Header activeTab={activeTab} onNavigate={navigate} filesCount={files.length} />}"
);

fs.writeFileSync(appPath, app);
console.log('[ui] mobile app header kept visible; browser keeps its own toolbar');
