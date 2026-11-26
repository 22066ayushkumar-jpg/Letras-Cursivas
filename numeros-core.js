// Conversor de números a letras en español — lógica pura (testeable en Node).
// Escala larga española: 10^6 = un millón, 10^12 = un billón. Máximo: 999.999.999.999.999,99.

const UNITS = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
const TEENS = { 10: 'diez', 11: 'once', 12: 'doce', 13: 'trece', 14: 'catorce', 15: 'quince', 16: 'dieciséis', 17: 'diecisiete', 18: 'dieciocho', 19: 'diecinueve', 20: 'veinte' };
const TWENTIES = { 21: 'veintiuno', 22: 'veintidós', 23: 'veintitrés', 24: 'veinticuatro', 25: 'veinticinco', 26: 'veintiséis', 27: 'veintisiete', 28: 'veintiocho', 29: 'veintinueve' };
const TENS = { 30: 'treinta', 40: 'cuarenta', 50: 'cincuenta', 60: 'sesenta', 70: 'setenta', 80: 'ochenta', 90: 'noventa' };
const HUNDREDS_M = { 200: 'doscientos', 300: 'trescientos', 400: 'cuatrocientos', 500: 'quinientos', 600: 'seiscientos', 700: 'setecientos', 800: 'ochocientos', 900: 'novecientos' };
const HUNDREDS_F = { 200: 'doscientas', 300: 'trescientas', 400: 'cuatrocientas', 500: 'quinientas', 600: 'seiscientas', 700: 'setecientas', 800: 'ochocientas', 900: 'novecientas' };

// ctx: { fem, apocope } — apocope=true cuando detrás viene un sustantivo masculino
// o mil/millones (veintiuno -> veintiún, uno -> un).
function under100(n, ctx) {
  if (n < 10) {
    if (n === 1) return ctx.fem ? 'una' : ctx.apocope ? 'un' : 'uno';
    return UNITS[n];
  }
  if (n <= 20) return TEENS[n];
  if (n < 30) {
    if (n === 21) return ctx.fem ? 'veintiuna' : ctx.apocope ? 'veintiún' : 'veintiuno';
    return TWENTIES[n];
  }
  const t = Math.floor(n / 10) * 10;
  const u = n % 10;
  if (u === 0) return TENS[t];
  const unit = u === 1 ? (ctx.fem ? 'una' : ctx.apocope ? 'un' : 'uno') : UNITS[u];
  return `${TENS[t]} y ${unit}`;
}

function under1000(n, ctx) {
  if (n < 100) return under100(n, ctx);
  if (n === 100) return 'cien';
  const h = Math.floor(n / 100) * 100;
  const r = n % 100;
  const hw = h === 100 ? 'ciento' : ctx.fem ? HUNDREDS_F[h] : HUNDREDS_M[h];
  return r === 0 ? hw : `${hw} ${under100(r, ctx)}`;
}

// Convierte un entero (Number, seguro hasta 10^15) a cardinal.
// opts: { fem=false, noun=false } noun=true si detrás va un sustantivo masculino (moneda).
export function cardinal(num, opts = {}) {
  const fem = !!opts.fem;
  if (num === 0) return 'cero';
  const neg = num < 0;
  let n = Math.abs(Math.floor(num));
  const parts = [];
  const billones = Math.floor(n / 1e12);
  const millones = Math.floor((n % 1e12) / 1e6);
  const miles = Math.floor((n % 1e6) / 1e3);
  const resto = n % 1e3;
  if (billones > 0) {
    if (billones === 1) parts.push('un billón');
    else parts.push(`${under1000(billones, { fem: false, apocope: true })} billones`);
    if (millones === 0 && miles === 0 && resto === 0 && opts.noun) parts[parts.length - 1] += ' de';
  }
  if (millones > 0) {
    if (millones === 1) parts.push('un millón');
    else parts.push(`${under1000(millones, { fem: false, apocope: true })} millones`);
    if (miles === 0 && resto === 0 && opts.noun) parts[parts.length - 1] += ' de';
  }
  if (miles > 0) {
    if (miles === 1) parts.push('mil');
    else parts.push(`${under1000(miles, { fem, apocope: true })} mil`);
  }
  if (resto > 0) {
    parts.push(under1000(resto, { fem, apocope: !!opts.noun && !fem }));
  }
  return (neg ? 'menos ' : '') + parts.join(' ');
}

// Decimales: la parte decimal se lee como número; los ceros a la izquierda se nombran.
export function withDecimals(intPart, decStr, opts = {}) {
  const base = cardinal(intPart, opts);
  if (!decStr || /^0+$/.test(decStr)) return base;
  const zeros = decStr.match(/^0*/)[0].length;
  const val = parseInt(decStr, 10);
  const decWords = (zeros > 0 && val > 0 ? 'cero '.repeat(zeros) : '') + (val > 0 ? cardinal(val, {}) : '');
  return `${base} coma ${decWords.trim()}`;
}

// --- Ordinales (1 a 999.999) ---
const ORD_UNITS = { 1: 'primero', 2: 'segundo', 3: 'tercero', 4: 'cuarto', 5: 'quinto', 6: 'sexto', 7: 'séptimo', 8: 'octavo', 9: 'noveno' };
const ORD_TENS = { 10: 'décimo', 20: 'vigésimo', 30: 'trigésimo', 40: 'cuadragésimo', 50: 'quincuagésimo', 60: 'sexagésimo', 70: 'septuagésimo', 80: 'octogésimo', 90: 'nonagésimo' };
const ORD_HUND = { 100: 'centésimo', 200: 'ducentésimo', 300: 'tricentésimo', 400: 'cuadringentésimo', 500: 'quingentésimo', 600: 'sexcentésimo', 700: 'septingentésimo', 800: 'octingentésimo', 900: 'noningentésimo' };
const ORD_MIL = { 1: 'milésimo', 2: 'dosmilésimo', 3: 'tresmilésimo', 4: 'cuatromilésimo', 5: 'cincomilésimo', 6: 'seismilésimo', 7: 'sietemilésimo', 8: 'ochomilésimo', 9: 'nuevemilésimo' };

function ordinalUnder1000(n) {
  const parts = [];
  const h = Math.floor(n / 100) * 100;
  const r = n % 100;
  if (h) parts.push(ORD_HUND[h]);
  if (r > 0) {
    if (r <= 9) parts.push(ORD_UNITS[r]);
    else if (r === 10) parts.push('décimo');
    else if (r === 11) parts.push('undécimo');
    else if (r === 12) parts.push('duodécimo');
    else if (r < 20) parts.push({ 13: 'decimotercero', 14: 'decimocuarto', 15: 'decimoquinto', 16: 'decimosexto', 17: 'decimoséptimo', 18: 'decimoctavo', 19: 'decimonoveno' }[r]);
    else {
      const t = Math.floor(r / 10) * 10;
      const u = r % 10;
      parts.push(ORD_TENS[t]);
      if (u) parts.push(ORD_UNITS[u]);
    }
  }
  return parts.join(' ');
}

export function ordinal(n, fem = false) {
  if (n < 1 || n > 999999) return null;
  const parts = [];
  const miles = Math.floor(n / 1000);
  const resto = n % 1000;
  if (miles > 0) {
    if (miles === 1) parts.push('milésimo');
    else if (miles < 10) parts.push(ORD_MIL[miles]);
    else {
      // 10.000+ : diezmilésimo, cienmilésimo… composición regular
      const m = ordinalUnder1000(miles);
      parts.push(m + ' milésimo');
    }
  }
  if (resto > 0) parts.push(ordinalUnder1000(resto));
  let out = parts.join(' ');
  if (fem) out = out.split(' ').map((w) => (w.endsWith('o') ? w.slice(0, -1) + 'a' : w)).join(' ');
  return out;
}

// --- Entrada del usuario: acepta 1.234,56 / 1,234.56 / 1234,56 / 1234.56 / espacios ---
export function parseSpanishNumber(raw) {
  let s = String(raw).trim().replace(/\s+/g, '');
  if (!s) return null;
  let neg = false;
  if (s.startsWith('-')) { neg = true; s = s.slice(1); }
  s = s.replace(/[$€]/g, '');
  if (!/^[\d.,]+$/.test(s)) return null;
  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  let intStr, decStr = '';
  if (lastDot >= 0 && lastComma >= 0) {
    const decSep = Math.max(lastDot, lastComma);
    intStr = s.slice(0, decSep).replace(/[.,]/g, '');
    decStr = s.slice(decSep + 1);
  } else if (lastComma >= 0) {
    if (/^\d{1,3}(,\d{3})+$/.test(s)) intStr = s.replace(/,/g, '');
    else { const i = s.indexOf(','); intStr = s.slice(0, i); decStr = s.slice(i + 1); }
  } else if (lastDot >= 0) {
    if (/^\d{1,3}(\.\d{3})+$/.test(s)) intStr = s.replace(/\./g, '');
    else { const i = s.indexOf('.'); intStr = s.slice(0, i); decStr = s.slice(i + 1); }
  } else intStr = s;
  if (intStr.length > 15) return null;
  const intVal = parseInt(intStr || '0', 10);
  return { neg, intVal, decStr };
}

// --- Monedas y formato cheque ---
export const CURRENCIES = {
  EUR: { name: ['euro', 'euros'], cents: ['céntimo', 'céntimos'], style: 'ES' },
  MXN: { name: ['peso', 'pesos'], cents: ['centavo', 'centavos'], style: 'MX' },
  USD: { name: ['dólar', 'dólares'], cents: ['centavo', 'centavos'], style: 'GEN' },
  COP: { name: ['peso', 'pesos'], cents: ['centavo', 'centavos'], style: 'CO' },
  PEN: { name: ['sol', 'soles'], cents: ['céntimo', 'céntimos'], style: 'PE' },
  ARS: { name: ['peso', 'pesos'], cents: ['centavo', 'centavos'], style: 'AR' },
  CLP: { name: ['peso', 'pesos'], cents: null, style: 'CL' },
};

export function currencyText(parsed, code) {
  const cur = CURRENCIES[code];
  if (!cur) return null;
  let { neg, intVal, decStr } = parsed;
  let cents = 0;
  if (cur.style === 'CL') {
    // Chile redondea al peso (Ley 18.267): sin decimales.
    const decVal = decStr ? parseInt((decStr + '00').slice(0, 2), 10) : 0;
    if (decVal >= 50) intVal += 1;
    decStr = '';
  } else {
    cents = decStr ? parseInt((decStr + '00').slice(0, 2), 10) : 0;
    if (decStr && decStr.length > 2 && parseInt(decStr[2], 10) >= 5) {
      cents += 1;
      if (cents === 100) { cents = 0; intVal += 1; }
    }
  }
  const noApocope = cur.style === 'PE'; // SUNAT: "veintiuno soles", sin apócope
  const amount = cardinal(intVal, { noun: !noApocope });
  const coinName = intVal === 1 ? cur.name[0] : cur.name[1];
  const plain = `${amount} ${coinName}` + (cents > 0 ? ` con ${cardinal(cents, {})} ${cents === 1 ? cur.cents[0] : cur.cents[1]}` : '');
  const frac = String(cents).padStart(2, '0') + '/100';
  let cheque;
  const upper = (t) => t.toUpperCase();
  switch (cur.style) {
    case 'ES':
      cheque = plain; // España: la fracción va en letras, nunca 50/100
      break;
    case 'MX':
      cheque = `${upper(amount)} ${upper(cur.name[1])} ${frac} M.N.`;
      break;
    case 'CO':
      cheque = cents > 0 ? `${upper(amount)} ${upper(cur.name[1])} CON ${frac} M/CTE` : `${upper(amount)} ${upper(cur.name[1])} M/CTE`;
      break;
    case 'PE':
      cheque = `${upper(amount)} CON ${frac} ${upper(cur.name[1])}`;
      break;
    case 'AR':
      cheque = `${upper(amount)} ${upper(cur.name[1])} CON ${frac}`;
      break;
    case 'CL':
      cheque = `${upper(amount)} ${upper(cur.name[1])}`;
      break;
    default:
      cheque = `${upper(amount)} ${upper(cur.name[1])} CON ${frac}`;
  }
  return { plain: (neg ? 'menos ' : '') + plain, cheque: (neg ? 'MENOS ' : '') + cheque };
}

// --- Inverso: letras -> número (cardinales básicos) ---
const WORD_VALUES = {
  cero: 0, uno: 1, un: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9,
  diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciséis: 16, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
  veinte: 20, veintiuno: 21, veintiún: 21, veintiuna: 21, veintidós: 22, veintidos: 22, veintitrés: 23, veintitres: 23, veinticuatro: 24, veinticinco: 25, veintiséis: 26, veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29,
  treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90,
  cien: 100, ciento: 100, doscientos: 200, doscientas: 200, trescientos: 300, trescientas: 300, cuatrocientos: 400, cuatrocientas: 400,
  quinientos: 500, quinientas: 500, seiscientos: 600, seiscientas: 600, setecientos: 700, setecientas: 700, ochocientos: 800, ochocientas: 800, novecientos: 900, novecientas: 900,
};
export function wordsToNumber(text) {
  let s = ' ' + String(text).toLowerCase().replace(/[^a-záéíóúñ\s]/g, ' ').replace(/\s+/g, ' ') + ' ';
  let neg = false;
  if (s.includes(' menos ')) { neg = true; s = s.replace(' menos ', ' '); }
  let decVal = null;
  const comaIdx = s.indexOf(' coma ');
  if (comaIdx >= 0) {
    const decText = s.slice(comaIdx + 6).trim();
    s = s.slice(0, comaIdx);
    const d = wordsToNumber(decText);
    if (d === null) return null;
    decVal = String(d);
  }
  const scales = [[' billones ', 1e12], [' billón ', 1e12], [' millones ', 1e6], [' millón ', 1e6], [' mil ', 1e3]];
  let total = 0;
  let rest = s;
  for (const [token, mult] of scales) {
    const idx = rest.indexOf(token);
    if (idx >= 0) {
      const before = rest.slice(0, idx).trim();
      const part = before === '' ? 1 : smallWords(before);
      if (part === null) return null;
      total += part * mult;
      rest = rest.slice(idx + token.length);
    }
  }
  // "mil" al final sin espacio (p.ej. "dos mil")
  const tail = smallWords(rest.trim());
  if (tail === null) return null;
  total += tail;
  const result = neg ? -total : total;
  return decVal !== null ? `${result},${decVal}` : result;
}
function smallWords(s) {
  if (!s) return 0;
  const tokens = s.split(' ').filter((t) => t && t !== 'y' && t !== 'de');
  let val = 0;
  for (const t of tokens) {
    if (!(t in WORD_VALUES)) return null;
    val += WORD_VALUES[t];
  }
  return val;
}
