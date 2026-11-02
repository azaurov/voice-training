import assert from 'node:assert/strict';
const store = {};
globalThis.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; } };
const ai = await import('../src/services/ai.js');
const metrics = { secs: 30, words: 60, wpm: 120, fillers: { um: 2 }, pauses: 1, pitchStd: 2.1 };
const ok = (obj) => ({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: '```json\n' + JSON.stringify(obj) + '\n```' } }] }) });
const fail = (status, message = 'Provider returned error') => ({ ok: false, status, json: async () => ({ error: { message } }) });
const FB = { overall: 'o', structure: 's', strengths: [], improvements: [], tip: 't' };

// stale saved model (the app's old default) falls back to a real one
store.vt_settings = JSON.stringify({ openrouterKey: 'k', aiModel: 'meta-llama/llama-3.3-70b-instruct:free' });
assert.equal(ai.getSelectedModel(), ai.FREE_MODELS[0].id);

// 429 on the first model -> next model is tried and its answer returned
let seen = [];
globalThis.fetch = async (url, opts) => { seen.push(JSON.parse(opts.body).model); return seen.length === 1 ? fail(429) : ok(FB); };
const fb = await ai.getLiveFeedback({ transcript: 'x '.repeat(30), metrics });
assert.equal(seen.length, 2); assert.notEqual(seen[0], seen[1]); assert.equal(fb.tip, 't'); assert.equal(fb._model, seen[1]);

// everything busy -> one clear error after trying ALL models, not a hang or a partial result
seen = []; globalThis.fetch = async (u, o) => { seen.push(1); return fail(503); };
await assert.rejects(ai.getLiveFeedback({ transcript: 'x', metrics }), /busy/);
assert.equal(seen.length, ai.FREE_MODELS.length);

// a bad key must stop immediately instead of burning every model
seen = []; globalThis.fetch = async () => { seen.push(1); return fail(401, 'No auth credentials'); };
await assert.rejects(ai.getLiveFeedback({ transcript: 'x', metrics }), /auth/i);
assert.equal(seen.length, 1);

// prompt is grounded in the transcript and the numbers
let body; globalThis.fetch = async (u, o) => { body = JSON.parse(o.body); return ok(FB); };
await ai.getLiveFeedback({ transcript: 'Tuesday is better', metrics });
const user = body.messages[1].content; assert.match(user, /Tuesday is better/); assert.match(user, /120 words\/min/); assert.match(user, /um x2/);

// no key -> explicit message, no request
store.vt_settings = '{}'; let called = false; globalThis.fetch = async () => { called = true; };
await assert.rejects(ai.getLiveFeedback({ transcript: 'x', metrics }), /API key/); assert.equal(called, false);
console.log('ai.test: all passed');
