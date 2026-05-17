const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const store = getStore('coach-data');
  const action = (event.queryStringParameters || {}).action;

  try {
    if (action === 'getData') {
      const students = await store.get('students', { type: 'json' }) || [];
      const history = await store.get('history', { type: 'json' }) || [];
      return { statusCode: 200, headers, body: JSON.stringify({ students, history }) };
    }

    if (action === 'saveData') {
      const body = JSON.parse(event.body || '{}');
      await Promise.all([
        store.set('students', JSON.stringify(body.students || [])),
        store.set('history', JSON.stringify(body.history || []))
      ]);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'unknown action' }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
