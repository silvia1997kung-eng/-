const SHEET_ID = '1KhBNExGKX360EPlG8y6lYQ5T4yiC-mupl3juYOO7YsE';
const API_KEY = 'AIzaSyBjuKbCdZM4g2C0GkzbHVJkmfJMZGkulGI';
const BASE = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const params = event.queryStringParameters || {};
  const action = params.action;

  try {
    if (action === 'getData') {
      const [sRes, hRes] = await Promise.all([
        fetch(`${BASE}/values/students?key=${API_KEY}`),
        fetch(`${BASE}/values/history?key=${API_KEY}`)
      ]);
      const sData = await sRes.json();
      const hData = await hRes.json();
      const students = parseSheet(sData.values || []);
      const history = parseSheet(hData.values || []);
      return { statusCode: 200, headers, body: JSON.stringify({ students, history }) };
    }

    if (action === 'saveStudents' || action === 'saveHistory') {
      const sheetName = action === 'saveStudents' ? 'students' : 'history';
      const data = JSON.parse(decodeURIComponent(params.payload || '[]'));
      await clearAndWrite(sheetName, data);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'unknown action' }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};

function parseSheet(rows) {
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] || ''; });
    return obj;
  });
}

async function clearAndWrite(sheetName, dataArr) {
  await fetch(`${BASE}/values/${sheetName}:clear?key=${API_KEY}`, { method: 'POST' });
  if (!dataArr || dataArr.length === 0) return;
  const headers = Object.keys(dataArr[0]);
  const rows = [headers, ...dataArr.map(obj => headers.map(h => {
    const v = obj[h];
    if (v === null || v === undefined) return '';
    if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
    return String(v);
  }))];
  await fetch(`${BASE}/values/${sheetName}?valueInputOption=RAW&key=${API_KEY}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: rows })
  });
}
