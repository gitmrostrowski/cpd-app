import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import postcss from 'postcss';
// Strony ról w systemie Home v15: wspólna nawigacja, zgodny zakres funkcji, izolowane style.
const role=readFileSync('components/RoleLandingPage.tsx','utf8');
const chrome=readFileSync('components/home/MarketingChrome.tsx','utf8');
const homeChrome=readFileSync('components/HomeChrome.tsx','utf8');
const pageContent=readFileSync('components/PageContent.tsx','utf8');
for(const r of ['medyk','placowka','organizator']) assert(readFileSync(`app/dla-${r==='medyk'?'medyka':r==='placowka'?'placowki':'organizatora'}/page.tsx`,'utf8').includes(`role="${r}"`),r);
assert(role.includes('MarketingNav')&&role.includes('MarketingFooter'),'Wspólna nawigacja i stopka');
assert(role.includes('crpe-home-v15 crpe-role'),'Strony ról dziedziczą system Home v15');
for(const path of ['/dla-medyka','/dla-placowki','/dla-organizatora']) assert(chrome.includes(`"${path}"`),path);
assert(homeChrome.includes('MARKETING_PATHS')&&pageContent.includes('MARKETING_PATHS'),'Bez podwójnego nagłówka i zagnieżdżonego <main>');
// Zakres zgodny z aplikacją
assert(role.includes('Status punktów zespołu i raporty zbiorcze w przygotowaniu'),'Placówka: raporty zbiorcze w przygotowaniu');
assert(role.includes('Obsługa uczestników'),'Organizator: obsługa uczestników w przygotowaniu');
assert(role.includes('href="/placowka"'),'Wejście dla osób z zaproszeniem');
assert(role.includes('href="/baza-szkolen"'),'Zgłoszenie szkolenia prowadzi do bazy');
assert(!/ZIP|eksport dokumentów|Zakres indywidualny/i.test(role),'Bez obietnic nieistniejących funkcji');
assert(!/<img\b/.test(role),'Ilustracje z interfejsu');
for(const match of role.matchAll(/href="([^"#]+)/g)){
  const route=match[1].split('#')[0];
  if(route.startsWith('/')) assert(existsSync(`app${route==='/'?'':route}/page.tsx`),route);
}
postcss.parse(readFileSync('app/role-v15.css','utf8')).walkRules(rule=>{
  if(rule.parent.type==='atrule'&&/keyframes$/.test(rule.parent.name)) return;
  for(const selector of rule.selectors) assert(selector.startsWith('.crpe-home-v15'),selector);
});
// Style Home nie mogą nadpisywać okna kontaktowego (Tailwind jest w warstwie).
const css=readFileSync('app/home-v15.css','utf8');
for(const tag of ['h1','h2','h3']) assert(css.includes(`.crpe-home-v15 ${tag}:where(:not([role="dialog"] *))`),tag);
console.log('Strony ról v15: nawigacja, zakres funkcji, trasy i izolacja CSS zweryfikowane');
