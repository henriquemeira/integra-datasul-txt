const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '..', 'doc');
const outputDir = path.join(__dirname, '..', 'src', 'layouts');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

function normalizeHeader(h) {
  return h
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function parseBool(v) {
  if (!v) return false;
  return /sim/i.test(v);
}

function parseNumberOrNull(v) {
  if (!v) return null;
  const n = Number(v.replace(/[^0-9.-]/g, ''));
  return Number.isNaN(n) ? null : n;
}

function parseCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length === 0) return [];
  const header = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1);
  return rows.map(line => {
    const cols = line.split(',').map(c => c.trim());
    const obj = {};
    for (let i = 0; i < header.length; i++) {
      const key = normalizeHeader(header[i]);
      const val = cols[i] === undefined ? '' : cols[i];
      obj[key] = val;
    }
    // normalize expected fields
    // map common header variants to expected keys
    if (obj['descri_o']) obj.descricao = obj['descri_o'];
    if (obj['descrição']) obj.descricao = obj['descrição'];
    if (obj['tam']) obj.tamanho = obj['tam'];
    if (obj['in_cio']) obj.inicio = obj['in_cio'];
    if (obj['t_rmino']) obj.fim = obj['t_rmino'];
    if (obj['término']) obj.fim = obj['término'];
    if (obj['obrig']) obj.obrigatorio = obj['obrig'];

    const obrigKey = Object.keys(obj).find(k => k.startsWith('obrig'));

    const out = {
      seq: parseNumberOrNull(obj.seq || obj.seq_ || obj['seq.'] || obj['seq'] || obj['seq,']) || null,
      descricao: obj.descricao || '',
      campo: obj.campo || '',
      tipo: obj.tipo || '',
      decimais: parseNumberOrNull(obj.decimais) || null,
      obrigatorio: parseBool(obrigKey ? obj[obrigKey] : obj.obrigatorio) || false,
      tamanho: parseNumberOrNull(obj.tamanho) || null,
      inicio: parseNumberOrNull(obj.inicio) || null,
      fim: parseNumberOrNull(obj.fim || obj.termino) || null,
      raw: obj,
    };
    return out;
  });
}

const files = fs.readdirSync(inputDir).filter(f => /layout-txt-integracao-datasul-tipo.*\.csv$/.test(f));
if (files.length === 0) {
  console.error('Nenhum CSV de layout encontrado em doc/.');
  process.exit(1);
}

files.forEach(f => {
  const full = path.join(inputDir, f);
  const data = parseCsv(full);
  const outName = f.replace(/\.csv$/i, '.json');
  const dest = path.join(outputDir, outName);
  fs.writeFileSync(dest, JSON.stringify(data, null, 2), 'utf8');
  console.log('Gerado', dest);
});

console.log('Concluído.');
