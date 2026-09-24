import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import postcss from 'postcss';
// Home v15: produkt w hero, uczciwy zakres ról, izolowane style, tokeny wspólne z aplikacją.
const page=readFileSync('app/page.tsx','utf8');
const action=readFileSync('components/home/HomeAction.tsx','utf8');
const chrome=readFileSync('components/home/MarketingChrome.tsx','utf8');
for(const hash of chrome.matchAll(/a\("#([^"]+)"\)/g)) assert(page.includes(`id="${hash[1]}"`),'Kotwica nawigacji: '+hash[1]);
const css=readFileSync('app/home-v15.css','utf8');
for(const route of ['/dla-medyka','/dla-placowki','/dla-organizatora','/login','/rejestracja','/regulamin','/polityka-prywatnosci','/bezpieczenstwo','/baza-szkolen']) assert((page+action+chrome).includes(`"${route}"`),route);
assert(!page.includes('href="#"'),'Brak martwych linków');
assert(page.includes('Dane przykładowe'),'Podgląd panelu oznaczony jako przykład');
assert(page.includes('Raporty zbiorcze w przygotowaniu'),'Zakres placówki');
assert(page.includes('Obsługa uczestników w przygotowaniu'),'Zakres organizatora');
assert(page.includes('className="ruler"'),'Linijka okresu w hero');
assert(!/<img\b/.test(page),'Ilustracje zbudowane z interfejsu, bez zdjęć stockowych');
assert(!/Montserrat/.test(page),'Home używa fontu aplikacji');
assert(css.includes('--brand:#1D4ED8'),'Kolor marki zgodny z crpe-visual');
for(const match of (page+chrome).matchAll(/href="([^"]+)"/g)){
  const route=match[1];
  if(route.startsWith('#')) assert(page.includes(`id="${route.slice(1)}"`),route);
  else if(route.startsWith('/')) assert(existsSync(`app${route==='/'?'':route}/page.tsx`),route);
}
for(let i=0;i<4;i++){assert(page.includes(`id="tnav-${i}"`));assert(page.includes(`id="tpane-${i}"`));assert(page.includes(`aria-controls="tpane-${i}"`));}
postcss.parse(css).walkRules(rule=>{
  if(rule.parent.type==='atrule'&&/keyframes$/.test(rule.parent.name)) return;
  for(const selector of rule.selectors) assert(selector.startsWith('.crpe-home-v15'),selector);
});
console.log('Home v15: routes, zakres ról, zakładki, tokeny i izolacja CSS zweryfikowane');
