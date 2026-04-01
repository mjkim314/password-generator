/* ─────────────────────────────────
   공통 상수 & 유틸
───────────────────────────────── */
const CHARS = {
  upper:  'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower:  'abcdefghijklmnopqrstuvwxyz',
  number: '0123456789',
  symbol: '!@#$%^&*()-_=+[]{}|;:,.<>?'
};

const COMMON_PASSWORDS = new Set([
  'password','123456','12345678','qwerty','abc123','monkey','1234567',
  'letmein','trustno1','dragon','baseball','iloveyou','master','sunshine',
  'ashley','bailey','passw0rd','shadow','123123','654321','superman',
  'qazwsx','michael','football','password1','password123','welcome',
  '123456789','1234567890','admin','login','hello','password!',
  'qwerty123','abc1234','1q2w3e4r','111111','0987654321'
]);

const SEQ_PATTERNS = [
  'abcdefghijklmnopqrstuvwxyz',
  'qwertyuiopasdfghjklzxcvbnm',
  '01234567890'
];

function randomChar(str) {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return str[a[0] % str.length];
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    const j = a[0] % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

/* ─────────────────────────────────
   탭 전환
───────────────────────────────── */
function switchTab(tab) {
  ['gen','check'].forEach(t => {
    document.getElementById('tab-' + t).classList.toggle('active', t === tab);
    document.getElementById('page-' + t).classList.toggle('active', t === tab);
  });
}

/* ─────────────────────────────────
   비밀번호 생성기
───────────────────────────────── */
const genState = {
  upper: true, lower: true, number: true, symbol: true,
  password: '', history: []
};

let autoTimer;

function toggleOption(key, cls) {
  const keys = ['upper','lower','number','symbol'];
  const activeCount = keys.filter(k => genState[k]).length;
  if (genState[key] && activeCount <= 1) {
    showToast('⚠ 최소 1개 이상 선택해야 합니다');
    return;
  }
  genState[key] = !genState[key];
  const el = document.getElementById('tog-' + key);
  genState[key] ? el.classList.add(cls) : el.classList.remove(cls);
}

function generate() {
  const len = parseInt(document.getElementById('lengthSlider').value);
  let pool = '';
  const guaranteed = [];

  ['upper','lower','number','symbol'].forEach(k => {
    if (genState[k]) { pool += CHARS[k]; guaranteed.push(randomChar(CHARS[k])); }
  });

  if (!pool) { showToast('⚠ 문자 종류를 선택해주세요'); return; }

  const arr = [...guaranteed];
  for (let i = arr.length; i < len; i++) arr.push(randomChar(pool));
  shuffle(arr);

  genState.password = arr.join('');
  renderPassword(genState.password);
  updateGenStrength(genState.password);
  addHistory(genState.password);
}

function renderPassword(pw) {
  const el = document.getElementById('passwordDisplay');
  el.classList.add('flash');
  setTimeout(() => {
    el.innerHTML = pw.split('').map(c => {
      if (/[A-Z]/.test(c)) return `<span class="char-uppercase">${c}</span>`;
      if (/[a-z]/.test(c)) return `<span class="char-lowercase">${c}</span>`;
      if (/[0-9]/.test(c)) return `<span class="char-number">${c}</span>`;
      return `<span class="char-symbol">${c}</span>`;
    }).join('');
    el.classList.remove('flash');
  }, 80);
}

function updateGenStrength(pw) {
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 16) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;

  const labels = ['','약함','보통','강함','매우 강함'];
  const colors = ['','#ff6b6b','#ffa94d','#7b61ff','#00ff88'];
  const bars   = score <= 1 ? 1 : score <= 2 ? 2 : score <= 3 ? 3 : 4;

  for (let i = 1; i <= 4; i++) {
    const f = document.getElementById('genFill' + i);
    f.style.width      = i <= bars ? '100%' : '0%';
    f.style.background = colors[bars];
  }
  document.getElementById('genStrengthText').textContent = labels[bars] || '—';
}

async function copyPassword() {
  if (!genState.password) { showToast('먼저 비밀번호를 생성하세요'); return; }
  try {
    await navigator.clipboard.writeText(genState.password);
    const btn = document.getElementById('copyBtn');
    btn.classList.add('copied');
    btn.textContent = '✓ 복사됨';
    setTimeout(() => { btn.classList.remove('copied'); btn.textContent = '⧉ 복사'; }, 2000);
    showToast('✓ 클립보드에 복사되었습니다');
  } catch { showToast('복사 실패 — 수동으로 복사해주세요'); }
}

function addHistory(pw) {
  genState.history.unshift(pw);
  if (genState.history.length > 8) genState.history.pop();
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById('historyList');
  if (!genState.history.length) {
    list.innerHTML = '<div class="empty-history">아직 생성된 비밀번호가 없습니다</div>';
    return;
  }
  list.innerHTML = genState.history.map(pw => `
    <div class="history-item">
      <div class="history-pw">${escapeHtml(pw)}</div>
      <div class="history-meta">
        <div class="history-len">${pw.length}자</div>
        <button class="history-copy" onclick="copyText('${escapeHtml(pw)}')" title="복사">⧉</button>
      </div>
    </div>
  `).join('');
}

function clearHistory() {
  genState.history = [];
  renderHistory();
  showToast('기록이 삭제되었습니다');
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('✓ 복사되었습니다');
  } catch { showToast('복사 실패'); }
}

/* ─────────────────────────────────
   강도 체크 페이지
───────────────────────────────── */
function hasSequential(pw) {
  const lower = pw.toLowerCase();
  for (const pat of SEQ_PATTERNS) {
    for (let i = 0; i <= pat.length - 3; i++) {
      const fwd = pat.slice(i, i + 3);
      const rev = fwd.split('').reverse().join('');
      if (lower.includes(fwd) || lower.includes(rev)) return true;
    }
  }
  return false;
}

function hasRepeating(pw) { return /(.)\1\1/.test(pw); }

function calcEntropy(pw) {
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/[0-9]/.test(pw)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) pool += 32;
  return pool > 0 ? Math.round(pw.length * Math.log2(pool)) : 0;
}

function setCheck(id, pass, badge) {
  const el = document.getElementById(id);
  el.className = 'check-item ' + (pass ? 'pass' : 'fail');
  el.querySelector('.check-icon').textContent  = pass ? '✓' : '✗';
  el.querySelector('.check-badge').textContent = badge;
}

function analyzePassword(pw) {
  document.getElementById('clearBtn').style.display = pw.length > 0 ? 'block' : 'none';
  const isEmpty = pw.length === 0;

  if (isEmpty) {
    document.querySelectorAll('.check-item').forEach(el => {
      el.className = 'check-item';
      el.querySelector('.check-icon').textContent  = '?';
      el.querySelector('.check-badge').textContent = '—';
    });
  } else {
    const lenPass   = pw.length >= 8;
    const lenStrong = pw.length >= 16;
    setCheck('chk-len',    lenPass,                     lenStrong ? '16자+' : pw.length + '자');
    setCheck('chk-upper',  /[A-Z]/.test(pw),            /[A-Z]/.test(pw)     ? '포함' : '없음');
    setCheck('chk-lower',  /[a-z]/.test(pw),            /[a-z]/.test(pw)     ? '포함' : '없음');
    setCheck('chk-num',    /[0-9]/.test(pw),            /[0-9]/.test(pw)     ? '포함' : '없음');
    setCheck('chk-sym',    /[^a-zA-Z0-9]/.test(pw),    /[^a-zA-Z0-9]/.test(pw) ? '포함' : '없음');
    setCheck('chk-repeat', !hasRepeating(pw),           !hasRepeating(pw)    ? '없음' : '있음');
    setCheck('chk-seq',    !hasSequential(pw),          !hasSequential(pw)   ? '없음' : '있음');
    const isCommon = COMMON_PASSWORDS.has(pw.toLowerCase());
    setCheck('chk-common', !isCommon,                   !isCommon            ? '안전' : '위험');
  }

  /* 점수 */
  let score = 0;
  if (!isEmpty) {
    if (pw.length >= 8)              score += 15;
    if (pw.length >= 12)             score += 10;
    if (pw.length >= 16)             score += 10;
    if (/[A-Z]/.test(pw))           score += 10;
    if (/[a-z]/.test(pw))           score += 10;
    if (/[0-9]/.test(pw))           score += 10;
    if (/[^a-zA-Z0-9]/.test(pw))   score += 15;
    if (!hasRepeating(pw))          score += 5;
    if (!hasSequential(pw))         score += 10;
    if (!COMMON_PASSWORDS.has(pw.toLowerCase())) score += 5;
  }
  score = Math.min(100, score);

  /* 링 */
  const circumference = 2 * Math.PI * 35;
  const ring   = document.getElementById('ringFill');
  const offset = isEmpty ? circumference : circumference - (score / 100) * circumference;
  ring.style.strokeDashoffset = offset;

  const ringColor = score < 30 ? '#ff6b6b' : score < 55 ? '#ffa94d' : score < 75 ? '#7b61ff' : '#00ff88';
  ring.style.stroke = ringColor;
  document.getElementById('scoreNum').textContent = isEmpty ? '—' : score;

  /* 라벨 */
  const labelMap = [[90,'매우 강함'],[75,'강함'],[55,'보통'],[30,'약함'],[0,'취약']];
  const subMap   = [
    [90,'매우 안전한 비밀번호입니다 🎉'],
    [75,'괜찮은 비밀번호입니다'],
    [55,'조금 더 강화해보세요'],
    [30,'개선이 필요합니다'],
    [0, '즉시 변경을 권장합니다']
  ];

  let labelText = '입력 대기', subText = '비밀번호를 입력하면 분석합니다';
  if (!isEmpty) {
    labelText = labelMap.find(([t]) => score >= t)?.[1] ?? '취약';
    subText   = subMap.find(([t])   => score >= t)?.[1] ?? '즉시 변경을 권장합니다';
  }

  document.getElementById('bigLabel').textContent = labelText;
  document.getElementById('bigSub').textContent   = subText;
  document.getElementById('bigLabel').style.color = isEmpty ? 'var(--text)' : ringColor;

  /* 엔트로피 */
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/[0-9]/.test(pw)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) pool += 32;

  document.getElementById('eLen').textContent  = isEmpty ? '—' : pw.length;
  document.getElementById('ePool').textContent = isEmpty || !pool ? '—' : pool;
  document.getElementById('eBits').textContent = isEmpty || !pool ? '—' : calcEntropy(pw);
}

function toggleVisibility() {
  const inp = document.getElementById('checkInput');
  const btn = document.getElementById('visBtn');
  if (inp.type === 'password') { inp.type = 'text';     btn.textContent = '🙈'; }
  else                         { inp.type = 'password'; btn.textContent = '👁'; }
}

function clearInput() {
  const inp = document.getElementById('checkInput');
  inp.value = '';
  inp.type = 'password';
  document.getElementById('visBtn').textContent = '👁';
  document.getElementById('clearBtn').style.display = 'none';
  analyzePassword('');
  inp.focus();
}

/* FAQ 토글 */
function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const isOpen = item.classList.contains('open');
  item.classList.toggle('open', !isOpen);
  btn.setAttribute('aria-expanded', !isOpen);
}

/* Init — 초기에는 자동 생성 없음 */
