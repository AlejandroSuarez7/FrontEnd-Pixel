const STRONG_AMOUNT_LABELS = [
  ['valor de la transferencia', 105],
  ['valor de la transaccion', 103],
  ['valor de la operacion', 103],
  ['valor transferido', 100],
  ['monto transferido', 100],
  ['valor enviado', 98],
  ['monto enviado', 98],
  ['total pagado', 96],
  ['valor pagado', 96],
  ['pago realizado', 94],
  ['la cantidad de', 92],
  ['transferiste', 90],
  ['enviaste', 90],
  ['pagaste', 90],
  ['transferencia', 76],
  ['monto', 74],
  ['total', 70],
  ['valor', 62],
];

const NON_AMOUNT_LABELS = [
  ['saldo disponible', 125],
  ['saldo anterior', 120],
  ['saldo actual', 120],
  ['numero de cuenta', 118],
  ['saldo', 110],
  ['4x1000', 105],
  ['impuesto', 100],
  ['comision', 100],
  ['tarifa', 95],
  ['cuenta', 92],
  ['referencia', 90],
  ['comprobante', 90],
  ['documento', 90],
  ['telefono', 90],
  ['celular', 90],
  ['autorizacion', 85],
  ['nit', 85],
  ['cus', 85],
  ['gmf', 85],
  ['iva', 80],
];

const PLATFORM_PATTERNS = [
  ['Bancolombia', /\bbancolombia\b/, 100],
  ['Nequi', /\bnequi\b/, 100],
  ['Daviplata', /\bdavi\s*plata\b/, 100],
  ['Davivienda', /\bdavivienda\b/, 100],
  ['Banco de Bogota', /\bbanco\s+de\s+bogota\b/, 100],
  ['Banco de Occidente', /\bbanco\s+de\s+occidente\b/, 100],
  ['Banco Popular', /\bbanco\s+popular\b/, 100],
  ['Banco AV Villas', /\b(?:banco\s+)?av\s+villas\b/, 100],
  ['BBVA', /\bbbva\b/, 100],
  ['Scotiabank Colpatria', /\b(?:scotiabank\s+colpatria|colpatria)\b/, 96],
  ['Itau', /\bitau\b/, 96],
  ['Nu', /\b(?:nu\s*bank|nu)\b/, 94],
  ['Dale', /\bdale!?\b/, 94],
  ['Movii', /\bmovii\b/, 94],
  ['Transfiya', /\btransfiya\b/, 94],
  ['PSE', /\bpse\b/, 92],
  ['Banco Caja Social', /\b(?:banco\s+)?caja\s+social\b/, 92],
  ['Mercado Pago', /\bmercado\s+pago\b/, 92],
  ['Bold', /\bbold\b/, 88],
];

const MONTHS = {
  enero: 1, ene: 1, january: 1, jan: 1,
  febrero: 2, feb: 2, february: 2,
  marzo: 3, mar: 3, march: 3,
  abril: 4, abr: 4, april: 4, apr: 4,
  mayo: 5, may: 5,
  junio: 6, jun: 6, june: 6,
  julio: 7, jul: 7, july: 7,
  agosto: 8, ago: 8, august: 8, aug: 8,
  septiembre: 9, setiembre: 9, sep: 9, sept: 9, september: 9,
  octubre: 10, oct: 10, october: 10,
  noviembre: 11, nov: 11, november: 11,
  diciembre: 12, dic: 12, dec: 12, december: 12,
};

const REFERENCE_LABELS = [
  ['numero de referencia', 100],
  ['referencia de transferencia', 100],
  ['referencia de pago', 98],
  ['numero de comprobante', 98],
  ['numero de transaccion', 98],
  ['id de transaccion', 98],
  ['codigo de operacion', 98],
  ['numero de operacion', 96],
  ['comprobante no', 96],
  ['comprobante nro', 96],
  ['cus', 96],
  ['autorizacion', 92],
  ['referencia', 90],
  ['comprobante', 88],
  ['transaccion', 84],
  ['operacion', 82],
  ['codigo', 72],
];

const DATE_LABELS = [
  ['fecha de transaccion', 100],
  ['fecha de operacion', 100],
  ['fecha del pago', 100],
  ['transferencia realizada', 94],
  ['realizado el', 94],
  ['enviado el', 92],
  ['fecha', 86],
];

const RECEIPT_PROFILES = {
  Bancolombia: { amountLabels: ['valor de la transferencia'], referenceLabels: ['comprobante'] },
  Nequi: { amountLabels: ['valor enviado', 'monto enviado', 'enviaste'], referenceLabels: ['referencia'] },
  Nu: { amountLabels: ['la cantidad de'], referenceLabels: ['cus'] },
};

const cleanText = value => String(value || '')
  .replace(/\u00a0/g, ' ')
  .replace(/[|¦]/g, 'I')
  .replace(/[ \t]+/g, ' ')
  .trim();

export const normalizeReceiptText = value => cleanText(value)
  .replace(/Ã¡/gi, 'a')
  .replace(/Ã©/gi, 'e')
  .replace(/Ã­/gi, 'i')
  .replace(/Ã³/gi, 'o')
  .replace(/Ãº/gi, 'u')
  .replace(/Ã±/gi, 'n')
  .replace(/Â/g, '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const createLines = text => cleanText(text)
  .split(/\r?\n/)
  .map(raw => raw.trim())
  .filter(Boolean)
  .map((raw, index) => ({ raw, normalized: normalizeReceiptText(raw), index }));

const getContext = (lines, index, radius = 1) => lines
  .filter(line => Math.abs(line.index - index) <= radius)
  .map(line => ({ ...line, distance: Math.abs(line.index - index) }));

const highestPhraseScore = (context, phrases) => context.reduce((best, line) => {
  const distanceFactor = line.distance === 0 ? 1 : 0.62;
  const lineScore = phrases.reduce(
    (score, [phrase, weight]) => line.normalized.includes(phrase)
      ? Math.max(score, weight * distanceFactor)
      : score,
    0,
  );
  return Math.max(best, lineScore);
}, 0);

const closestPhraseScore = (line, matchIndex, matchLength, phrases) => phrases.reduce(
  (best, [phrase, weight]) => {
    let phraseIndex = line.indexOf(phrase);
    let phraseBest = 0;
    while (phraseIndex >= 0) {
      const phraseEnd = phraseIndex + phrase.length;
      const matchEnd = matchIndex + matchLength;
      const distance = phraseEnd <= matchIndex
        ? matchIndex - phraseEnd
        : phraseIndex >= matchEnd
          ? phraseIndex - matchEnd
          : 0;
      const factor = distance <= 12 ? 1 : distance <= 35 ? 0.7 : distance <= 70 ? 0.35 : 0;
      phraseBest = Math.max(phraseBest, weight * factor);
      phraseIndex = line.indexOf(phrase, phraseIndex + phrase.length);
    }
    return Math.max(best, phraseBest);
  },
  0,
);

const daysInMonth = (year, month) => {
  if (month === 2) return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
};

const toIsoDate = (year, month, day) => {
  const numericYear = Number(year);
  const numericMonth = Number(month);
  const numericDay = Number(day);
  if (!Number.isInteger(numericYear) || numericYear < 1900 || numericYear > 2100) return null;
  if (!Number.isInteger(numericMonth) || numericMonth < 1 || numericMonth > 12) return null;
  if (!Number.isInteger(numericDay) || numericDay < 1 || numericDay > daysInMonth(numericYear, numericMonth)) return null;
  return `${String(numericYear).padStart(4, '0')}-${String(numericMonth).padStart(2, '0')}-${String(numericDay).padStart(2, '0')}`;
};

export const parseColombianMoney = (rawValue) => {
  const value = cleanText(rawValue)
    .replace(/\b(?:cop|col\s*\$?)\b/gi, '')
    .replace(/[$]/g, '')
    .replace(/^s\s*(?=\d)/i, '')
    .replace(/\s+/g, '')
    .replace(/[^\d.,-]/g, '');

  if (!value || value.startsWith('-') || !/\d/.test(value)) return null;

  const dots = (value.match(/\./g) || []).length;
  const commas = (value.match(/,/g) || []).length;
  const lastDot = value.lastIndexOf('.');
  const lastComma = value.lastIndexOf(',');
  let normalized;

  if (dots && commas) {
    const decimalIndex = Math.max(lastDot, lastComma);
    const decimalDigits = value.length - decimalIndex - 1;
    normalized = decimalDigits === 1 || decimalDigits === 2
      ? `${value.slice(0, decimalIndex).replace(/[.,]/g, '')}.${value.slice(decimalIndex + 1)}`
      : value.replace(/[.,]/g, '');
  } else if (dots || commas) {
    const separator = dots ? '.' : ',';
    const count = dots || commas;
    const index = value.lastIndexOf(separator);
    const trailingDigits = value.length - index - 1;
    if (count === 1 && (trailingDigits === 1 || trailingDigits === 2)) {
      normalized = `${value.slice(0, index)}.${value.slice(index + 1)}`;
    } else {
      normalized = value.replace(/[.,]/g, '');
    }
  } else {
    normalized = value;
  }

  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount) : null;
};

const amountPattern = /(?:\b(?:COP|COL)\s*|\$\s*|\bS\s*(?=\d))?\d{1,3}(?:[.\s,]\d{3})+(?:[.,]\d{1,2})?|(?:\b(?:COP|COL)\s*|\$\s*)\d{3,12}(?:[.,]\d{1,2})?|\b\d{4,12}\b/gi;

const profileBoost = (context, labels = []) => labels.some(
  label => context.some(line => line.normalized.includes(label)),
) ? 16 : 0;

export const rankAmountCandidates = (text, profile = {}) => {
  const lines = createLines(text);
  const candidates = [];

  lines.forEach((line) => {
    const context = getContext(lines, line.index);
    const adjacentContext = context.filter(item => item.distance > 0);
    const hasPercentage = /%/.test(line.raw);
    const hasDate = /\b(?:19|20)\d{2}[-/.]\d{1,2}[-/.]\d{1,2}\b|\b\d{1,2}[-/.]\d{1,2}[-/.](?:19|20)?\d{2}\b/.test(line.raw);

    for (const match of line.raw.matchAll(amountPattern)) {
      const value = parseColombianMoney(match[0]);
      if (!value) continue;
      const matchIndex = match.index || 0;
      const currencyContext = line.raw.slice(Math.max(0, matchIndex - 5), matchIndex + match[0].length);
      const hasCurrency = /\$|\b(?:cop|col)\b/i.test(currencyContext);
      const positiveNearby = closestPhraseScore(
        line.normalized,
        matchIndex,
        match[0].length,
        STRONG_AMOUNT_LABELS,
      );
      const positiveScore = positiveNearby || highestPhraseScore(adjacentContext, STRONG_AMOUNT_LABELS);
      const negativeScore = closestPhraseScore(
        line.normalized,
        matchIndex,
        match[0].length,
        NON_AMOUNT_LABELS,
      );
      const digits = match[0].replace(/\D/g, '');
      let score = positiveScore + profileBoost(context, profile.amountLabels);
      if (hasCurrency) score += 24;
      if (/[.,\s]\d{3}/.test(match[0])) score += 12;
      if (value >= 1000 && value <= 100000000) score += 10;
      if (negativeScore) score -= positiveScore >= 90 ? negativeScore * 0.45 : negativeScore;
      if (hasPercentage) score -= 120;
      if (hasDate) score -= 120;
      if (digits.length >= 10 && !/[.,\s]/.test(match[0]) && positiveScore < 80) score -= 90;

      candidates.push({
        value,
        raw: match[0].trim(),
        context: context.map(item => item.raw).join(' | '),
        line: line.raw,
        lineIndex: line.index,
        score: Math.round(score),
      });
    }
  });

  return candidates
    .filter(candidate => candidate.score > -30)
    .sort((left, right) => right.score - left.score || left.lineIndex - right.lineIndex);
};

const isInvalidReference = (value, context) => {
  if (!value || value.length < 4 || value.length > 100) return true;
  if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}$/.test(value)) return true;
  if (/^(?:19|20)\d{2}$/.test(value)) return true;
  if (/[$]/.test(context)) return true;
  return false;
};

export const rankReferenceCandidates = (text, profile = {}) => {
  const lines = createLines(text);
  const candidates = [];

  lines.forEach((line, position) => {
    REFERENCE_LABELS.forEach(([label, baseScore]) => {
      const labelIndex = line.normalized.indexOf(label);
      if (labelIndex < 0) return;

      const afterLabel = line.normalized
        .slice(labelIndex + label.length)
        .replace(/^\s*(?:no\.?|nro\.?|numero)?\s*[:#.-]?\s*/, '');
      const sameLineMatch = afterLabel.match(/^([a-z0-9][a-z0-9._-]{3,99})\b/i);
      const nextLine = lines[position + 1];
      const nextLineMatch = nextLine?.normalized.match(/^([a-z0-9][a-z0-9._-]{3,99})\b/i);
      const normalizedValue = sameLineMatch?.[1] || nextLineMatch?.[1];
      const sourceLine = sameLineMatch ? line.raw : nextLine?.raw || '';
      const rawValue = normalizedValue
        ? sourceLine.match(new RegExp(normalizedValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))?.[0] || normalizedValue
        : null;
      if (!rawValue) return;

      const context = `${line.raw}${sameLineMatch ? '' : ` | ${nextLine?.raw || ''}`}`;
      if (!/\d/.test(rawValue) || isInvalidReference(rawValue, context)) return;
      const negativeContext = normalizeReceiptText(context);
      let score = baseScore + (sameLineMatch ? 8 : 0) + profileBoost(getContext(lines, line.index), profile.referenceLabels);
      if (/\b(?:cuenta|telefono|celular|documento|nit)\b/.test(negativeContext)) score -= 90;
      if (/^\d{10}$/.test(rawValue) && baseScore < 88) score -= 20;

      candidates.push({
        value: rawValue.slice(0, 100),
        label,
        context,
        lineIndex: line.index,
        score: Math.round(score),
      });
    });
  });

  return candidates.sort((left, right) => right.score - left.score || left.lineIndex - right.lineIndex);
};

export const extractPaymentReference = text => rankReferenceCandidates(text)[0]?.value || null;

const collectDateMatches = (line) => {
  const matches = [];
  const normalized = line.normalized;
  const isoPattern = /\b((?:19|20)\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/g;
  const localPattern = /\b(\d{1,2})[-/.](\d{1,2})[-/.]((?:19|20)?\d{2})\b/g;
  const wordsPattern = /\b(\d{1,2})(?:\s+de)?\s+(enero|ene|january|jan|febrero|feb|february|marzo|mar|march|abril|abr|april|apr|mayo|may|junio|jun|june|julio|jul|july|agosto|ago|august|aug|septiembre|setiembre|sep|sept|september|octubre|oct|october|noviembre|nov|november|diciembre|dic|dec|december)(?:\s+de)?\s+((?:19|20)\d{2})\b/g;

  for (const match of normalized.matchAll(isoPattern)) {
    const value = toIsoDate(match[1], match[2], match[3]);
    if (value) matches.push({ value, raw: match[0], ambiguous: false });
  }
  for (const match of normalized.matchAll(localPattern)) {
    const year = match[3].length === 2 ? `20${match[3]}` : match[3];
    const value = toIsoDate(year, match[2], match[1]);
    if (value) matches.push({ value, raw: match[0], ambiguous: Number(match[1]) <= 12 && Number(match[2]) <= 12 });
  }
  for (const match of normalized.matchAll(wordsPattern)) {
    const value = toIsoDate(match[3], MONTHS[match[2]], match[1]);
    if (value) matches.push({ value, raw: match[0], ambiguous: false });
  }
  return matches;
};

export const rankDateCandidates = (text) => {
  const lines = createLines(text);
  const candidates = [];
  lines.forEach((line) => {
    const context = getContext(lines, line.index);
    const contextScore = highestPhraseScore(context, DATE_LABELS);
    collectDateMatches(line).forEach(match => {
      candidates.push({
        ...match,
        context: context.map(item => item.raw).join(' | '),
        lineIndex: line.index,
        score: Math.round(45 + contextScore - (match.ambiguous ? 12 : 0)),
      });
    });
  });
  return candidates.sort((left, right) => right.score - left.score || left.lineIndex - right.lineIndex);
};

export const extractPaymentDate = text => rankDateCandidates(text)[0]?.value || null;

export const rankPlatformCandidates = (text) => {
  const normalized = normalizeReceiptText(text);
  return PLATFORM_PATTERNS
    .filter(([, pattern]) => pattern.test(normalized))
    .map(([value, , score]) => ({ value, score, context: value }))
    .sort((left, right) => right.score - left.score);
};

export const detectPaymentPlatform = text => rankPlatformCandidates(text)[0]?.value || null;

const clamp = value => Math.max(0, Math.min(100, Number(value) || 0));

export const parseGenericReceipt = (text, engineConfidence = 0, profile = {}) => {
  const amountCandidates = rankAmountCandidates(text, profile);
  const referenceCandidates = rankReferenceCandidates(text, profile);
  const dateCandidates = rankDateCandidates(text);
  const platformCandidates = rankPlatformCandidates(text);
  const bestAmount = amountCandidates[0] || null;
  const competingAmount = amountCandidates.find(candidate => candidate.value !== bestAmount?.value);
  const hasAmbiguousAmount = Boolean(
    bestAmount && competingAmount && Math.abs(bestAmount.score - competingAmount.score) <= 14,
  );
  const bestReference = referenceCandidates[0] || null;
  const bestDate = dateCandidates[0] || null;
  const bestPlatform = platformCandidates[0] || null;
  const amountConfidence = clamp(bestAmount?.score);
  const functionalConfidence = (
    amountConfidence * 0.55
    + (bestReference ? 14 : 0)
    + (bestDate ? 12 : 0)
    + (bestPlatform ? 8 : 0)
    + clamp(engineConfidence) * 0.11
  );
  const calidadLectura = Math.round(clamp(functionalConfidence));
  const fragmentedText = normalizeReceiptText(text).replace(/\s/g, '').length < 24;

  return {
    montoDetectado: bestAmount?.value ?? null,
    referenciaDetectada: bestReference?.value ?? null,
    fechaDetectada: bestDate?.value ?? null,
    bancoDetectado: bestPlatform?.value ?? null,
    calidadLectura,
    requiereRevisionManual: !bestAmount
      || amountConfidence < 60
      || hasAmbiguousAmount
      || Boolean(bestDate?.ambiguous)
      || fragmentedText
      || calidadLectura < 60,
    origenAnalisis: 'FRONTEND',
    amountCandidates,
    referenceCandidates,
    dateCandidates,
    platformCandidates,
  };
};

export const parseBancolombiaReceipt = (text, confidence) => parseGenericReceipt(
  text,
  confidence,
  RECEIPT_PROFILES.Bancolombia,
);

export const parseNequiReceipt = (text, confidence) => parseGenericReceipt(
  text,
  confidence,
  RECEIPT_PROFILES.Nequi,
);

export const parseNuReceipt = (text, confidence) => parseGenericReceipt(
  text,
  confidence,
  RECEIPT_PROFILES.Nu,
);

const SPECIFIC_PARSERS = {
  Bancolombia: parseBancolombiaReceipt,
  Nequi: parseNequiReceipt,
  Nu: parseNuReceipt,
};

export const analyzeReceiptText = (text, engineConfidence = 0) => {
  const platform = detectPaymentPlatform(text);
  const parser = SPECIFIC_PARSERS[platform];
  return parser
    ? parser(text, engineConfidence)
    : parseGenericReceipt(text, engineConfidence);
};
