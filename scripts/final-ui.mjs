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
fs.writeFileSync(homePath, home);

const appPath = 'src/App.tsx';
let app = fs.readFileSync(appPath, 'utf8');
// The HomePage is the actual mobile app header/search surface. The separate
// desktop Header must never consume Android status-bar space or overlay the
// phone punch-hole area. Keep it only on wide screens through CSS.
app = app.replace("{!isBrowser && <Header activeTab={activeTab} onNavigate={navigate} filesCount={files.length} />}", "{!isBrowser && <div className=\"hidden md:block\"><Header activeTab={activeTab} onNavigate={navigate} filesCount={files.length} /></div>}");
// Keep one VidGrab bottom navigation on app screens; browser has its own
// toolbar and must not render a second bottom navigation.
fs.writeFileSync(appPath, app);
console.log('[ui] final mobile header/navigation rules applied');
