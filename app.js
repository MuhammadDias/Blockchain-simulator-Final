// ================== LOGIC HAMBURGER MENU ==================
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('hamburger-btn');
  const navLinks = document.getElementById('nav-links');
  const navButtons = document.querySelectorAll('.nav-links button');

  // Toggle Menu saat Hamburger diklik
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('show-menu');
      hamburger.classList.toggle('active');
    });
  }

  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (window.innerWidth <= 868) {
        if (navLinks) navLinks.classList.remove('show-menu');
      }
    });
  });

  // NOTE: Logic "Show More" sebelumnya sudah dihapus
  // karena sekarang menggunakan CSS Hover.
});

// ================== HELPER GO TO PAGE (FROM CARD) ==================
window.goToPage = function (pageName) {
  showPage('page-' + pageName);
};

// ================== DATE & TIME ==================
function updateDateTime() {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));

  const dayName = days[now.getDay()];
  const date = now.getDate();
  const month = months[now.getMonth()];
  const year = now.getFullYear();

  const hh = now.getHours().toString().padStart(2, '0');
  const mm = now.getMinutes().toString().padStart(2, '0');
  const ss = now.getSeconds().toString().padStart(2, '0');

  const elH = document.getElementById('time-hh');
  const elM = document.getElementById('time-mm');
  const elS = document.getElementById('time-ss');

  if (elH && elM && elS) {
    elH.textContent = hh;
    elM.textContent = mm;
    elS.textContent = ss;
  }

  const elDate = document.getElementById('date-text');
  if (elDate) {
    elDate.textContent = `${dayName}, ${date} ${month} ${year}`;
  }
}
setInterval(updateDateTime, 1000);
updateDateTime();

// ================== SHA-256 ==================
async function sha256(msg) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(msg));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ================== NAVIGATION ==================
function showPage(pageId) {
  document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
  document.querySelectorAll('.page-special').forEach((p) => p.classList.remove('active'));
  document.querySelectorAll('.nav-links button').forEach((b) => b.classList.remove('active'));

  const targetPage = document.getElementById(pageId);
  if (targetPage) targetPage.classList.add('active');

  const tabId = 'tab-' + pageId.split('-')[1];
  const targetTab = document.getElementById(tabId);
  if (targetTab) targetTab.classList.add('active');

  window.scrollTo(0, 0);
}

['home', 'about', 'hash', 'block', 'chain', 'ecc', 'consensus'].forEach((p) => {
  const t = document.getElementById('tab-' + p);
  if (t) t.onclick = () => showPage('page-' + p);
});

// ================== HASH PAGE ==================
const hashInput = document.getElementById('hash-input');
if (hashInput) {
  hashInput.addEventListener('input', async (e) => {
    document.getElementById('hash-output').textContent = await sha256(e.target.value);
  });
}

// ================== BLOCK PAGE ==================
const blockData = document.getElementById('block-data');
const blockNonce = document.getElementById('block-nonce');
const blockHash = document.getElementById('block-hash');
const blockTimestamp = document.getElementById('block-timestamp');
const speedControl = document.getElementById('speed-control');
const btnMine = document.getElementById('btn-mine');

if (blockNonce) {
  blockNonce.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
    updateBlockHash();
  });
}
if (blockData) blockData.addEventListener('input', updateBlockHash);

async function updateBlockHash() {
  if (!blockData) return;
  const data = blockData.value;
  const nonce = blockNonce.value || '0';
  blockHash.textContent = await sha256(data + nonce);
}

if (btnMine) {
  btnMine.addEventListener('click', async () => {
    const data = blockData.value;
    const speedMultiplier = parseInt(speedControl.value) || 1;
    const baseBatch = 1000;
    const batchSize = baseBatch * speedMultiplier;
    const difficulty = '0000';
    const status = document.getElementById('mining-status');
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });

    blockTimestamp.value = timestamp;
    blockHash.textContent = '';
    blockNonce.value = '0';
    let nonce = 0;

    if (status) status.textContent = 'Sedang Mining...';

    async function mineStep() {
      const promises = [];
      for (let i = 0; i < batchSize; i++) {
        promises.push(sha256(data + timestamp + (nonce + i)));
      }
      const results = await Promise.all(promises);
      for (let i = 0; i < results.length; i++) {
        const h = results[i];
        if (h.startsWith(difficulty)) {
          blockNonce.value = nonce + i;
          blockHash.textContent = h;
          if (status) status.textContent = `Mining Selesai! (Nonce=${nonce + i})`;
          return;
        }
      }
      nonce += batchSize;
      blockNonce.value = nonce;
      if (status) status.textContent = `Mining... (Nonce=${nonce})`;
      setTimeout(mineStep, 0);
    }
    mineStep();
  });
}

// ================== BLOCKCHAIN PAGE ==================
const ZERO_HASH = '0'.repeat(64);
let blocks = [];
const chainDiv = document.getElementById('blockchain');

function renderChain() {
  if (!chainDiv) return;
  chainDiv.innerHTML = '';
  blocks.forEach((blk, i) => {
    const div = document.createElement('div');
    div.className = 'blockchain-block';
    div.innerHTML = `
        <h3 style="margin-top:0">Block #${blk.index}</h3>
        <label>Previous Hash:</label><div class="output" style="font-size:12px">${blk.previousHash}</div>
        <label>Data:</label><textarea rows="2" onchange="onChainDataChange(${i},this.value)">${blk.data}</textarea>
        <label>Timestamp:</label><div class="output" style="font-size:12px" id="timestamp-${i}">${blk.timestamp}</div>
        <label>Nonce:</label><div class="output" id="nonce-${i}">${blk.nonce}</div>
        <label>Hash:</label><div class="output" style="font-size:12px" id="hash-${i}">${blk.hash}</div>
        <button onclick="mineChainBlock(${i})" class="mine-btn" style="width:100%"> Mine</button>
        <div id="status-${i}" style="margin-top:5px; font-size:12px; color:blue;"></div>
        `;
    chainDiv.appendChild(div);
  });
}

function addChainBlock() {
  const idx = blocks.length;
  const prev = idx ? blocks[idx - 1].hash : ZERO_HASH;
  const blk = {
    index: idx,
    data: '',
    previousHash: prev,
    timestamp: '',
    nonce: 0,
    hash: '',
  };
  blocks.push(blk);
  renderChain();
}

window.onChainDataChange = function (i, val) {
  blocks[i].data = val;
  blocks[i].nonce = 0;
  blocks[i].timestamp = '';
  blocks[i].hash = '';
  for (let j = i + 1; j < blocks.length; j++) {
    blocks[j].previousHash = blocks[j - 1].hash;
    blocks[j].nonce = 0;
    blocks[j].timestamp = '';
    blocks[j].hash = '';
  }
  renderChain();
};

window.mineChainBlock = function (i) {
  const blk = blocks[i];
  const prev = blk.previousHash;
  const data = blk.data;
  const difficulty = '0000';
  const batchSize = 1000 * 50;
  blk.nonce = 0;
  blk.timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });

  const t0 = performance.now();
  const status = document.getElementById(`status-${i}`);
  const ndiv = document.getElementById(`nonce-${i}`);
  const hdiv = document.getElementById(`hash-${i}`);
  const tdiv = document.getElementById(`timestamp-${i}`);

  status.textContent = 'Mining...';
  async function step() {
    const promises = [];
    for (let j = 0; j < batchSize; j++) promises.push(sha256(prev + data + blk.timestamp + (blk.nonce + j)));
    const results = await Promise.all(promises);
    for (let j = 0; j < results.length; j++) {
      const h = results[j];
      if (h.startsWith(difficulty)) {
        blk.nonce += j;
        blk.hash = h;
        ndiv.textContent = blk.nonce;
        hdiv.textContent = h;
        tdiv.textContent = blk.timestamp;
        const dur = ((performance.now() - t0) / 1000).toFixed(3);
        status.textContent = `Selesai (${dur}s)`;
        status.style.color = 'green';
        return;
      }
    }
    blk.nonce += batchSize;
    ndiv.textContent = blk.nonce;
    setTimeout(step, 0);
  }
  step();
};

const btnAddBlock = document.getElementById('btn-add-block');
if (btnAddBlock) {
  btnAddBlock.onclick = addChainBlock;
  addChainBlock(); // Init first block
}

// ================== ECC DIGITAL SIGNATURE ==================
const ec = new elliptic.ec('secp256k1');
const eccPrivate = document.getElementById('ecc-private');
const eccPublic = document.getElementById('ecc-public');
const eccMessage = document.getElementById('ecc-message');
const eccSignature = document.getElementById('ecc-signature');
const eccVerifyResult = document.getElementById('ecc-verify-result');

function randomPrivateHex() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
function normHex(h) {
  if (!h) return '';
  return h.toLowerCase().replace(/^0x/, '');
}

if (document.getElementById('btn-generate-key')) {
  document.getElementById('btn-generate-key').onclick = () => {
    const priv = randomPrivateHex();
    const key = ec.keyFromPrivate(priv, 'hex');
    const pub = '04' + key.getPublic().getX().toString('hex').padStart(64, '0') + key.getPublic().getY().toString('hex').padStart(64, '0');
    eccPrivate.value = priv;
    eccPublic.value = pub;
    eccSignature.value = '';
    eccVerifyResult.textContent = '';
  };
}

if (document.getElementById('btn-sign')) {
  document.getElementById('btn-sign').onclick = async () => {
    const msg = eccMessage.value;
    if (!msg) {
      alert('Isi pesan!');
      return;
    }
    const priv = normHex(eccPrivate.value.trim());
    if (!priv) {
      alert('Private key kosong!');
      return;
    }
    const hash = await sha256(msg);
    const sig = ec.keyFromPrivate(priv, 'hex').sign(hash, { canonical: true }).toDER('hex');
    eccSignature.value = sig;
    eccVerifyResult.textContent = '';
  };
}

if (document.getElementById('btn-verify')) {
  document.getElementById('btn-verify').onclick = async () => {
    try {
      const msg = eccMessage.value,
        sig = normHex(eccSignature.value.trim()),
        pub = normHex(eccPublic.value.trim());
      if (!msg || !sig || !pub) {
        alert('Lengkapi semua field!');
        return;
      }
      const key = ec.keyFromPublic(pub, 'hex');
      const valid = key.verify(await sha256(msg), sig);
      eccVerifyResult.textContent = valid ? ' Signature VALID!' : ' Signature TIDAK valid!';
      eccVerifyResult.style.color = valid ? '#00ff88' : '#ff4757';
    } catch (e) {
      eccVerifyResult.textContent = 'Error verifikasi';
    }
  };
}

// ================== KONSENSUS PAGE ==================
const ZERO = '0'.repeat(64);
let balances = { A: 100, B: 100, C: 100 };
let txPool = [];
let chainsConsensus = { A: [], B: [], C: [] };

function updateBalancesDOM() {
  ['A', 'B', 'C'].forEach((u) => {
    const el = document.getElementById('saldo-' + u);
    if (el) el.textContent = balances[u];
  });
}
function parseTx(line) {
  const m = line.match(/^([A-C])\s*->\s*([A-C])\s*:\s*(\d+)$/);
  if (!m) return null;
  return { from: m[1], to: m[2], amt: parseInt(m[3]) };
}

async function shaMine(prev, data, timestamp) {
  const diff = '000';
  const base = 1000;
  const batch = base * 50;
  return new Promise((resolve) => {
    let nonce = 0;
    async function loop() {
      const promises = [];
      for (let i = 0; i < batch; i++) promises.push(sha256(prev + data + timestamp + (nonce + i)));
      const results = await Promise.all(promises);
      for (let i = 0; i < results.length; i++) {
        const h = results[i];
        if (h.startsWith(diff)) {
          resolve({ nonce: nonce + i, hash: h });
          return;
        }
      }
      nonce += batch;
      setTimeout(loop, 0);
    }
    loop();
  });
}

async function createGenesisConsensus() {
  const diff = '000';
  const ts = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
  for (let u of ['A', 'B', 'C']) {
    let nonce = 0;
    let found = '';
    while (true) {
      const h = await sha256(ZERO + 'Genesis' + ts + nonce);
      if (h.startsWith(diff)) {
        found = h;
        break;
      }
      nonce++;
    }
    chainsConsensus[u] = [{ index: 0, prev: ZERO, data: 'Genesis Block: 100 coins', timestamp: ts, nonce, hash: found, invalid: false }];
  }
  renderConsensusChains();
  updateBalancesDOM();
}
createGenesisConsensus();

function renderConsensusChains() {
  ['A', 'B', 'C'].forEach((u) => {
    const cont = document.getElementById('chain-' + u);
    if (!cont) return;
    cont.innerHTML = '';
    chainsConsensus[u].forEach((blk, i) => {
      const d = document.createElement('div');
      d.className = 'chain-block' + (blk.invalid ? ' invalid' : '');
      d.innerHTML = `
          <div class="small"><strong>Block #${blk.index}</strong></div>
          <div class="small" style="font-size:10px; color:#555">Prev: ${blk.prev.substring(0, 10)}...</div>
          <textarea class="data" rows="2" style="font-size:12px; margin:5px 0;">${blk.data}</textarea>
          <div class="small" style="font-size:10px">Nonce: ${blk.nonce}</div>
          <div class="small" style="font-size:10px; font-weight:bold; color:#2980b9">Hash: ${blk.hash.substring(0, 15)}...</div>`;
      const ta = d.querySelector('textarea.data');
      ta.addEventListener('input', (e) => {
        chainsConsensus[u][i].data = e.target.value;
      });
      cont.appendChild(d);
    });
  });
}

['A', 'B', 'C'].forEach((u) => {
  const btn = document.getElementById('send-' + u);
  if (btn) {
    btn.onclick = () => {
      const amt = parseInt(document.getElementById('amount-' + u).value);
      const to = document.getElementById('receiver-' + u).value;
      if (amt <= 0) {
        alert('Jumlah > 0');
        return;
      }
      if (balances[u] < amt) {
        alert('Saldo tidak cukup');
        return;
      }
      const tx = `${u} -> ${to} : ${amt}`;
      txPool.push(tx);
      document.getElementById('mempool').value = txPool.join('\n');
    };
  }
});

if (document.getElementById('btn-mine-all')) {
  document.getElementById('btn-mine-all').onclick = async () => {
    if (txPool.length === 0) {
      alert('Tidak ada transaksi.');
      return;
    }
    const parsed = [];
    for (const t of txPool) {
      const tx = parseTx(t);
      if (!tx) {
        alert('Format salah: ' + t);
        return;
      }
      parsed.push(tx);
    }
    const tmp = { ...balances };
    for (const tx of parsed) {
      if (tmp[tx.from] < tx.amt) {
        alert('Saldo ' + tx.from + ' tidak cukup.');
        return;
      }
      tmp[tx.from] -= tx.amt;
      tmp[tx.to] += tx.amt;
    }
    const ts = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
    const data = txPool.join(' | ');
    const mining = ['A', 'B', 'C'].map(async (u) => {
      const prev = chainsConsensus[u].at(-1).hash;
      const r = await shaMine(prev, data, ts);
      chainsConsensus[u].push({ index: chainsConsensus[u].length, prev, data, timestamp: ts, nonce: r.nonce, hash: r.hash, invalid: false });
    });
    await Promise.all(mining);
    balances = tmp;
    updateBalancesDOM();
    txPool = [];
    document.getElementById('mempool').value = '';
    renderConsensusChains();
    alert('✅ Mining selesai!');
  };
}

if (document.getElementById('btn-verify-consensus')) {
  document.getElementById('btn-verify-consensus').onclick = async () => {
    try {
      for (const u of ['A', 'B', 'C']) {
        for (let i = 1; i < chainsConsensus[u].length; i++) {
          const blk = chainsConsensus[u][i];
          const expectedPrev = i === 0 ? ZERO : chainsConsensus[u][i - 1].hash;
          const recomputed = await sha256(blk.prev + blk.data + blk.timestamp + blk.nonce);
          blk.invalid = recomputed !== blk.hash || blk.prev !== expectedPrev;
        }
      }
      renderConsensusChains();
      alert('Verifikasi selesai.');
    } catch (err) {
      alert('Error verifikasi.');
    }
  };
}

if (document.getElementById('btn-consensus')) {
  document.getElementById('btn-consensus').onclick = async () => {
    try {
      const users = ['A', 'B', 'C'];
      const maxLen = Math.max(...users.map((u) => chainsConsensus[u].length));
      for (let i = 0; i < maxLen; i++) {
        const candidates = users.map((u) => chainsConsensus[u][i]).filter((b) => b && !b.invalid);
        if (candidates.length === 0) continue;
        const freq = {};
        let majority = candidates[0];
        for (const blk of candidates) {
          const key = blk.hash + blk.data;
          freq[key] = (freq[key] || 0) + 1;
          if (freq[key] > (freq[majority.hash + majority.data] || 0)) majority = blk;
        }
        for (const u of users) {
          const chain = chainsConsensus[u];
          if (!chain[i]) continue;
          if (chain[i].invalid) chain[i] = { ...majority, invalid: false };
          if (i > 0 && chain[i]) chain[i].prev = chain[i - 1].hash;
        }
      }
      renderConsensusChains();
      alert('Konsensus tercapai.');
    } catch (e) {
      alert('Error konsensus.');
    }
  };
}
