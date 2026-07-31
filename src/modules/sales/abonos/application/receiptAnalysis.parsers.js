const MONEY_CONTEXT = [
  'monto',
  'total',
  'valor',
  'enviado',
  'enviaste',
  'pagado',
  'pagaste',
  'transferido',
  'transferencia',
];

const NON_AMOUNT_CONTEXT = [
  'saldo',
  'disponible',
  'telefono',
  'celular',
  'cuenta',
  'referencia',
  'transaccion',
  'operacion',
  'comprobante',
  'aprobacion',
  'fecha',
];

const PLATFORM_PATTERNS = [
  ['Nequi', /\bnequi\b/i],
  ['Daviplata', /\bdavi\s*plata\b/i],
  ['Bancolombia', /\bbancolombia\b/i],
  ['Banco de Bogota', /\bbanco\s+de\s+bogot[aá]\b/i],
  ['Davivienda', /\bdavivienda\b/i],
  ['Banco de Occidente', /\bbanco\s+de\s+occidente\b/i],
  ['Banco Popular', /\bbanco\s+popular\b/i],
  ['Banco AV Villas', /\b(?:banco\s+)?av\s+villas\b/i],
  ['BBVA', /\bbbva\b/i],
  ['Banco Caja Social', /\bcaja\s+social\b/i],
  ['Scotiabank Colpatria', /\b(?:scotiabank|colpatria)\b/i],
  ['Itau', /\bita[uú]\b/i],
  ['PSE', /\bpse\b/i],
  ['Movii', /\bmovii\b/i],
  ['Dale', /\bdale!?\b/i],
  ['Nu', /\bnu(?:bank)?\b/i],
  ['Mercado Pago', /\bmercado\s+pago\b/i],
  ['Bold', /\bbold\b/i],
];

const MONTHS = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
};

const cleanText = value => String(value || '').replace(/\u00a0/g, ' ').trim();
const normalizeContext = value => cleanText(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const toIsoDate = (year, month, day) => {
  const numericYear = Number(year);
  const numericMonth = Number(month);
  const numericDay = Number(day);
  if (
    !Number.isInteger(numericYear)
    || !Number.isInteger(numericMonth)
    || !Number.isInteger(numericDay)
  ) return null;

  const date = new Date(Date.UTC(numericYear, numericMonth - 1, numericDay));
  if (
    date.getUTCFullYear() !== numericYear
    || date.getUTCMonth() !== numericMonth - 1
    || date.getUTCDate() !== numericDay
  ) return null;

  return `${numericYear.toString().padStart(4, '0')}-${numericMonth
    .toString()
    .padStart(2, '0')}-${numericDay.toString().padStart(2, '0')}`;
};

export const parseColombianMoney = (rawValue) => {
  const value = cleanText(rawValue)
    .replace(/\b(?:cop|col\$)\b/gi, '')
    .replace(/\$/g, '')
    .replace(/\s+/g, '')
    .replace(/[^\d.,-]/g, '');

  if (!value || value.startsWith('-')) return null;

  const separators = [...value.matchAll(/[.,]/g)].map(match => match.index);
  const lastSeparator = separators.at(-1);
  let normalized = value;

  if (lastSeparator !== undefined) {
    const decimals = value.length - lastSeparator - 1;
    if (decimals > 0 && decimals <= 2 && separators.length > 1) {
      normalized = `${value.slice(0, lastSeparator).replace(/[.,]/g, '')}.${value.slice(lastSeparator + 1)}`;
    } else if (decimals > 0 && decimals <= 2 && separators.length === 1) {
      const integerPart = value.slice(0, lastSeparator);
      normalized = integerPart.length <= 3
        ? `${integerPart}.${value.slice(lastSeparator + 1)}`
        : value.replace(/[.,]/g, '');
    } else {
      normalized = value.replace(/[.,]/g, '');
    }
  }

  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount) : null;
};

const amountPattern = /(?:\bCOP\s*|\$\s*)?\d{1,3}(?:[.\s,]\d{3})+(?:[.,]\d{1,2})?|(?:\bCOP\s*|\$\s*)\d{4,9}\b|\b\d{4,9}\b/gi;

export const rankAmountCandidates = (text) => {
  const lines = cleanText(text).split(/\r?\n/);
  const candidates = [];

  lines.forEach((line, lineIndex) => {
    const normalizedLine = normalizeContext(line);
    const hasMoneyContext = MONEY_CONTEXT.some(word => normalizedLine.includes(word));
    const hasExcludedContext = NON_AMOUNT_CONTEXT.some(word => normalizedLine.includes(word));
    const hasCurrency = /\$|\bCOP\b/i.test(line);
    const hasPercentage = /%/.test(line);
    const hasDate = /\b(?:19|20)\d{2}[-/.]\d{1,2}[-/.]\d{1,2}\b|\b\d{1,2}[-/.]\d{1,2}[-/.](?:19|20)?\d{2}\b/.test(line);

    for (const match of line.matchAll(amountPattern)) {
      const amount = parseColombianMoney(match[0]);
      if (!amount) continue;

      const digits = match[0].replace(/\D/g, '');
      let score = 0;
      if (hasMoneyContext) score += 55;
      if (hasCurrency) score += 35;
      if (amount >= 1000) score += 15;
      if (amount >= 10000 && amount <= 10000000) score += 8;
      if (hasExcludedContext && !hasMoneyContext) score -= 70;
      if (hasPercentage) score -= 90;
      if (hasDate) score -= 90;
      if (digits.length >= 10 && !/[.,\s]/.test(match[0])) score -= 65;

      candidates.push({
        value: amount,
        raw: match[0].trim(),
        line: line.trim(),
        lineIndex,
        score,
      });
    }
  });

  return candidates
    .filter(candidate => candidate.score > -40)
    .sort((left, right) => right.score - left.score || right.value - left.value);
};

export const extractPaymentReference = (text) => {
  const lines = cleanText(text).split(/\r?\n/);
  const referencePattern = /\b(?:referencia|ref(?:erencia)?|n[uú]mero\s+de\s+(?:transacci[oó]n|operaci[oó]n)|transacci[oó]n|operaci[oó]n|aprobaci[oó]n)\b\s*[:#-]?\s*([a-z0-9][a-z0-9-]{3,99})|\bcomprobante\b\s*(?:n(?:ro|[uú]mero)?|[:#-])\s*([a-z0-9][a-z0-9-]{3,99})/i;

  for (const line of lines) {
    const match = line.match(referencePattern);
    if (!match) continue;
    const reference = (match[1] || match[2]).trim().slice(0, 100);
    if (!/^\d{1,3}(?:[.,]\d{3})+$/.test(reference)) return reference;
  }

  return null;
};

export const extractPaymentDate = (text) => {
  const value = cleanText(text);
  const isoMatch = value.match(/\b((?:19|20)\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (isoMatch) return toIsoDate(isoMatch[1], isoMatch[2], isoMatch[3]);

  const localMatch = value.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.]((?:19|20)?\d{2})\b/);
  if (localMatch) {
    const year = localMatch[3].length === 2 ? `20${localMatch[3]}` : localMatch[3];
    return toIsoDate(year, localMatch[2], localMatch[1]);
  }

  const wordsMatch = normalizeContext(value).match(
    /\b(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+de\s+((?:19|20)\d{2})\b/,
  );
  if (wordsMatch) return toIsoDate(wordsMatch[3], MONTHS[wordsMatch[2]], wordsMatch[1]);

  return null;
};

export const detectPaymentPlatform = (text) => {
  const value = cleanText(text);
  return PLATFORM_PATTERNS.find(([, pattern]) => pattern.test(value))?.[0] || null;
};

export const analyzeReceiptText = (text, engineConfidence = 0) => {
  const amountCandidates = rankAmountCandidates(text);
  const bestAmount = amountCandidates[0] || null;
  const competingAmount = amountCandidates.find(candidate => candidate.value !== bestAmount?.value);
  const hasAmbiguousAmount = Boolean(
    bestAmount
    && competingAmount
    && Math.abs(bestAmount.score - competingAmount.score) <= 15,
  );
  const referenciaDetectada = extractPaymentReference(text);
  const fechaDetectada = extractPaymentDate(text);
  const bancoDetectado = detectPaymentPlatform(text);
  const confidence = Math.max(0, Math.min(100, Number(engineConfidence) || 0));
  const completeness = [
    Boolean(bestAmount),
    Boolean(referenciaDetectada),
    Boolean(fechaDetectada),
    Boolean(bancoDetectado),
  ].filter(Boolean).length / 4;
  const calidadLectura = Math.round(Math.min(100, (confidence * 0.65) + (completeness * 35)));

  return {
    montoDetectado: bestAmount?.value ?? null,
    referenciaDetectada,
    fechaDetectada,
    bancoDetectado,
    calidadLectura,
    requiereRevisionManual: !bestAmount || hasAmbiguousAmount || calidadLectura < 60,
    origenAnalisis: 'FRONTEND',
    amountCandidates,
  };
};
