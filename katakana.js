// Transliterador a katakana por sonido, pensado para nombres y palabras en
// español (la j suena ハ行, la g ante e/i también, la c ante e/i suena s, etc.).
// Es una aproximación fonética: el japonés no tiene todos los sonidos del español.
const KATA = {
  a: 'ア', i: 'イ', u: 'ウ', e: 'エ', o: 'オ',
  ka: 'カ', ki: 'キ', ku: 'ク', ke: 'ケ', ko: 'コ',
  sa: 'サ', shi: 'シ', su: 'ス', se: 'セ', so: 'ソ',
  ta: 'タ', chi: 'チ', tsu: 'ツ', te: 'テ', to: 'ト',
  na: 'ナ', ni: 'ニ', nu: 'ヌ', ne: 'ネ', no: 'ノ',
  ha: 'ハ', hi: 'ヒ', fu: 'フ', he: 'ヘ', ho: 'ホ',
  ma: 'マ', mi: 'ミ', mu: 'ム', me: 'メ', mo: 'モ',
  ya: 'ヤ', yu: 'ユ', yo: 'ヨ',
  ra: 'ラ', ri: 'リ', ru: 'ル', re: 'レ', ro: 'ロ',
  wa: 'ワ', wi: 'ウィ', we: 'ウェ', wo: 'ヲ',
  ga: 'ガ', gu: 'グ', go: 'ゴ',
  za: 'サ', zu: 'ス', ze: 'セ', zo: 'ソ',
  da: 'ダ', de: 'デ', do: 'ド',
  ba: 'バ', bi: 'ビ', bu: 'ブ', be: 'ベ', bo: 'ボ',
  pa: 'パ', pi: 'ピ', pu: 'プ', pe: 'ペ', po: 'ポ',
  kya: 'キャ', kyu: 'キュ', kyo: 'キョ',
  sha: 'シャ', shu: 'シュ', sho: 'ショ',
  cha: 'チャ', chu: 'チュ', cho: 'チョ', che: 'チェ',
  nya: 'ニャ', nyu: 'ニュ', nyo: 'ニョ',
  hya: 'ヒャ', hyu: 'ヒュ', hyo: 'ヒョ',
  mya: 'ミャ', myu: 'ミュ', myo: 'ミョ',
  rya: 'リャ', ryu: 'リュ', ryo: 'リョ',
  gya: 'ギャ', gyu: 'ギュ', gyo: 'ギョ',
  bya: 'ビャ', byu: 'ビュ', byo: 'ビョ',
  pya: 'ピャ', pyu: 'ピュ', pyo: 'ピョ',
  // Sonidos del español
  ca: 'カ', co: 'コ', cu: 'ク', ce: 'セ', ci: 'シ',
  que: 'ケ', qui: 'キ',
  ja: 'ハ', ji: 'ヒ', je: 'ヘ', jo: 'ホ', ju: 'フ',
  ge: 'ヘ', gi: 'ヒ', gue: 'ゲ', gui: 'ギ',
  lla: 'ヤ', lle: 'エ', lli: 'イ', llo: 'ヨ', llu: 'ユ',
  'ña': 'ニャ', 'ñe': 'ネ', 'ñi': 'ニ', 'ño': 'ニョ', 'ñu': 'ニュ',
  va: 'バ', ve: 'ベ', vi: 'ビ', vo: 'ボ', vu: 'ブ',
  la: 'ラ', le: 'レ', li: 'リ', lo: 'ロ', lu: 'ル',
  xa: 'クサ', xe: 'クセ', xi: 'クシ', xo: 'クソ', xu: 'クス',
};
const KEYS = Object.keys(KATA).sort((a, b) => b.length - a.length);

export function toKatakana(input) {
  let s = String(input).toLowerCase()
    .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ü/g, 'u');
  let out = '';
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === ' ') { out += '・'; i++; continue; }
    if (!/[a-zñh]/.test(c)) { out += c; i++; continue; }
    if (c === 'h' && s[i + 1] !== 'c') { i++; continue; } // h muda del español
    if (c === 'r' && s[i + 1] === 'r') { i++; continue; } // rr = una r fuerte
    if (/[kpst]/.test(c) && s[i + 1] === c) {
      const key = KEYS.find((k) => s.slice(i + 1).startsWith(k));
      if (key) { out += 'ッ' + KATA[key]; i += 1 + key.length; continue; }
    }
    if (c === 'n' && !['na', 'ni', 'nu', 'ne', 'no', 'nya', 'nyu', 'nyo'].some((k) => s.slice(i).startsWith(k))) {
      out += 'ン'; i++; continue;
    }
    if (c === 'm' && (s[i + 1] === 'b' || s[i + 1] === 'p')) { out += 'ン'; i++; continue; }
    const key = KEYS.find((k) => s.slice(i).startsWith(k));
    if (key) { out += KATA[key]; i += key.length; continue; }
    const lone = { k: 'ク', g: 'グ', t: 'ト', d: 'ド', s: 'ス', z: 'ス', b: 'ブ', p: 'プ', f: 'フ', j: 'フ', l: 'ル', r: 'ル', v: 'ブ', x: 'クス', c: 'ク' };
    if (lone[c]) { out += lone[c]; i++; continue; }
    out += c; i++;
  }
  return out;
}
