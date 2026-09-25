import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
// v6.31: Panel CPD – stan okresu na górze, rejestr i terminy obok siebie, limity zwinięte.
const panel=readFileSync('app/panel-cpd/CalculatorClient.tsx','utf8');
const order=['<section id="status"','<section id="aktywnosci"','<section id="terminy"','<section id="limity"'].map((m)=>panel.indexOf(m));
assert(order.every((i)=>i>0),'Wszystkie sekcje panelu muszą istnieć');
assert(order.every((i,k)=>k===0||i>order[k-1]),'Kolejność: stan okresu, aktywności, terminy, limity');
assert.match(panel,/Okres rozliczeniowy \{periodStart\}–\{periodEnd\}/,'Karta stanu nazywa okres');
assert.match(panel,/lg:grid-cols-\[minmax\(0,1fr\)_380px\]/,'Aktywności i terminy w dwóch kolumnach');
assert.match(panel,/const \[limitsOpen, setLimitsOpen\] = useState\(false\)/,'Limity domyślnie zwinięte');
assert.match(panel,/aria-controls="limity-szczegoly"/,'Przycisk rozwijania wskazuje szczegóły');
assert.match(panel,/if \(id === "limity"\) setLimitsOpen\(true\)/,'Zakładka Limity rozwija sekcję');
assert.match(panel,/useState<"curve" \| "bar">\("bar"\)/,'Domyślnie linijka okresu');
assert.doesNotMatch(panel,/Oś aktywności<\/h3>/,'Bez drugiej listy tych samych wpisów');
assert.doesNotMatch(panel,/Przy pozostałym czasie musisz zdobywać średnio/,'Tempo podajemy raz, w karcie stanu');
assert.match(panel,/replace\(\/\^Brak \/, ""\)/,'„Brakuje: certyfikatu”, nie „Brakuje: Brak certyfikatu”');
assert.doesNotMatch(panel,/rose-/,'Zaległości w kolorze tokenu danger');
console.log('v6.31: układ Panelu CPD zweryfikowany');
