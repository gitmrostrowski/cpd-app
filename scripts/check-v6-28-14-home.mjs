import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import postcss from 'postcss';
const page=readFileSync('app/page.tsx','utf8');
const action=readFileSync('components/home/HomeAction.tsx','utf8');
for(const route of ['/dla-medyka','/dla-placowki','/dla-organizatora','/login','/rejestracja','/regulamin','/polityka-prywatnosci']) assert((page+action).includes(`"${route}"`),route);
assert(!page.includes('href="#"'));
assert(!page.includes('20 000'));
assert(page.includes('dane przykładowe'));
assert(page.includes('Raporty zbiorcze w przygotowaniu'));
assert(page.includes('Obsługa uczestników w przygotowaniu'));
for(const match of page.matchAll(/href="([^"]+)"/g)) {
 const route=match[1];
 if(route.startsWith('#')) assert(page.includes(`id="${route.slice(1)}"`),route);
 else if(route.startsWith('/')) assert(existsSync(`app${route==='/'?'':route}/page.tsx`),route);
}
for(const match of page.matchAll(/src="([^"]+)"/g)) assert(existsSync('public'+match[1]),match[1]);
for(let i=0;i<4;i++) { assert(page.includes(`id="tnav-${i}"`)); assert(page.includes(`id="tpane-${i}"`)); assert(page.includes(`aria-controls="tpane-${i}"`)); }
postcss.parse(readFileSync('app/home-v14.css','utf8')).walkRules(rule=> {
 if(rule.parent.type==='atrule' && /keyframes$/.test(rule.parent.name)) return;
 for(const selector of rule.selectors) assert(selector.startsWith('.crpe-home-v14'),selector);
});
console.log('Home v14: routes, assets, scope of offers, tab associations and CSS isolation verified');

