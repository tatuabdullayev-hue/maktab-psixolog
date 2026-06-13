const BASE = 'https://maktab-psixolog.onrender.com/api';
const CONCURRENCY = 30;

const QUESTION_IDS = ['q1', 'q2', 'q4', 'q6', 'q8'];
const ANSWER_KEYS = ['A', 'B', 'C', 'D'];

const FIRST_NAMES = [
  'Aziz', 'Malika', 'Jasur', 'Dilnoza', 'Sardor', 'Nigora', 'Bekzod', 'Madina',
  'Otabek', 'Zarina', 'Sherzod', 'Gulnoza', 'Farrux', 'Shahnoza', 'Davron',
  'Kamola', 'Jamshid', 'Lola', 'Ulugbek', 'Sevara', 'Rustam', 'Feruza',
  'Anvar', 'Munisa', 'Bobur', 'Ziyoda', 'Eldor', 'Yulduz', 'Sanjar', 'Nilufar',
];
const LAST_NAMES = [
  'Karimov', 'Yusupova', 'Tashkentov', 'Rashidova', 'Aliyev', 'Nazarova',
  'Yoldashev', 'Saidova', 'Ergashev', 'Tursunova', 'Xolmatov', 'Ismoilova',
  'Rahimov', 'Egamova', 'Sultonov', 'Abdullayeva', 'Mirzayev', 'Qosimova',
  'Tojiyev', 'Yusupov', 'Nabiyeva', 'Ochilov', 'Karimova', 'Davlatov',
  'Xalilova', 'Norqulov', 'Saidov', 'Tashkentova', 'Berdiyev', 'Yunusova',
];
const CLASSES = ['7-A', '7-B', '8-A', '8-B', '9-A', '9-B', '10-A', '11-A'];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function runUser(i) {
  const start = Date.now();
  const firstName = pick(FIRST_NAMES);
  const lastName = pick(LAST_NAMES);
  const className = pick(CLASSES);
  try {
    const regRes = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName,
        lastName,
        className,
        schoolName: '53-maktab',
      }),
    });
    if (!regRes.ok) throw new Error(`register failed: ${regRes.status}`);
    const reg = await regRes.json();
    const token = reg.accessToken;

    const testsRes = await fetch(`${BASE}/tests`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!testsRes.ok) throw new Error(`tests fetch failed: ${testsRes.status}`);
    const tests = await testsRes.json();
    const test = tests[0];

    const answers = {};
    for (const qid of QUESTION_IDS) answers[qid] = pick(ANSWER_KEYS);

    const submitRes = await fetch(`${BASE}/tests/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ testId: test.id, answers }),
    });
    if (!submitRes.ok) throw new Error(`submit failed: ${submitRes.status}`);
    await submitRes.json();

    const elapsed = Date.now() - start;
    return { i, ok: true, elapsed, name: `${firstName} ${lastName}`, className };
  } catch (e) {
    const elapsed = Date.now() - start;
    return { i, ok: false, elapsed, error: e.message };
  }
}

async function main() {
  console.log(`Starting load test: ${CONCURRENCY} concurrent users against ${BASE}`);
  const overallStart = Date.now();
  const results = await Promise.all(
    Array.from({ length: CONCURRENCY }, (_, i) => runUser(i)),
  );
  const overallElapsed = Date.now() - overallStart;

  const ok = results.filter((r) => r.ok);
  const fail = results.filter((r) => !r.ok);
  const times = ok.map((r) => r.elapsed);
  const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  const max = times.length ? Math.max(...times) : 0;
  const min = times.length ? Math.min(...times) : 0;

  console.log(`\nTotal time: ${overallElapsed}ms`);
  console.log(`Success: ${ok.length}/${CONCURRENCY}`);
  console.log(`Failed: ${fail.length}/${CONCURRENCY}`);
  console.log(`Avg per-user time: ${avg.toFixed(0)}ms`);
  console.log(`Min: ${min}ms, Max: ${max}ms`);
  if (fail.length) {
    console.log('\nFailures:');
    fail.forEach((r) => console.log(`  user ${r.i}: ${r.error} (${r.elapsed}ms)`));
  }
}

main();
