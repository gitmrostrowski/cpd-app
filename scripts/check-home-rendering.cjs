// Component rendering tests; no Supabase account or browser session is required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
let sessionUser = null;
const cache = new Map();
function load(file) {
  const resolved = path.resolve(file);
  if (cache.has(resolved)) return cache.get(resolved);
  const loadedModule = { exports: {} };
  function localRequire(name) {
    if (name === 'next/link') return { default: ({ children, ...props }) => React.createElement('a', props, children), __esModule: true };
    if (name === 'next/font/google') return { Montserrat: () => ({ variable: 'test-font' }) };
    if (name.endsWith('.css')) return {};
    if (name === '@/components/AuthProvider') return { useAuth: () => ({ user: sessionUser }) };
    // Verify that the session branch delegates to the existing full app Header.
    if (name === '@/components/Header') return { __esModule: true, default: () => React.createElement('header', { 'data-app-header': true }, 'Existing application navigation') };
    if (name.endsWith('initializeHome')) return { initializeHome: () => () => {} };
    if (name.startsWith('@/')) return load(name.slice(2) + '.tsx');
    return require(name);
  }
  const code = ts.transpileModule(fs.readFileSync(resolved,'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  new Function('require','module','exports',code)(localRequire,loadedModule,loadedModule.exports);
  cache.set(resolved,loadedModule.exports);
  return loadedModule.exports;
}
const Home=load('app/page.tsx').default;
const guest=renderToStaticMarkup(React.createElement(Home));
assert(guest.includes('Zaloguj się'));
assert(guest.includes('href="/rejestracja"'));
assert(!guest.includes('data-app-header'));
assert(guest.indexOf('<header') < guest.indexOf('<main'));
assert(guest.indexOf('<footer') > guest.indexOf('</main>'));
assert.equal((guest.match(/<main\b/g)||[]).length,1);
assert(guest.includes('id="home-content" tabindex="-1"'));
assert(guest.includes('href="#home-content"'));
assert(guest.includes('class="ruler"'));
assert(guest.includes('Raporty zbiorcze w przygotowaniu'));
assert(guest.includes('Obsługa uczestników w przygotowaniu'));
assert(guest.includes('id="dla-kogo"'));
assert(!guest.includes('<img'));
sessionUser={id:'test-account'};
const signedIn=renderToStaticMarkup(React.createElement(Home));
assert(signedIn.includes('data-app-header'));
assert(!signedIn.includes('Zaloguj się'));
assert(!signedIn.includes('Załóż konto'));
assert(signedIn.includes('href="/panel-cpd"'));
assert(!signedIn.includes('id="menuToggle"'));
assert(signedIn.includes('Dla placówki'));
console.log('PASS Home rendering: guest/account navigation, CTA, landmarks, skip link, role scope');
