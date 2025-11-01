// App state and helpers
const LS_KEY = 'app_gastos_v1'
const $ = sel => document.querySelector(sel)
const $$ = sel => Array.from(document.querySelectorAll(sel))

// currency formatter
const fmt = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

// initial binding
const desc = $('#desc'), amount = $('#amount'), type = $('#type'), date = $('#date')
const addBtn = $('#addBtn'), clearBtn = $('#clearBtn'), listEl = $('#list')
const saldoEl = $('#saldo'), entradasEl = $('#entradas'), saidasEl = $('#saidas')
const chartEl = $('#chart'), miniList = $('#mini-list')
const exportBtn = $('#exportBtn'), importBtn = $('#importBtn'), fileInput = $('#fileInput')
const q = $('#q'), filterType = $('#filterType'), applyFilter = $('#applyFilter'), resetFilter = $('#resetFilter')
const filterMonth = $('#filterMonth'), filterAll = $('#filterAll')

let state = { items: [] }

function load() {
    try {
        const raw = localStorage.getItem(LS_KEY)
        if (raw) state = JSON.parse(raw)
    } catch (e) { console.error(e) }
}
function save() {
    localStorage.setItem(LS_KEY, JSON.stringify(state))
}

function addTransaction(tx) {
    tx.id = Date.now() + Math.random().toString(36).slice(2, 8)
    state.items.push(tx)
    save(); render()
}

function removeTransaction(id) {
    state.items = state.items.filter(t => t.id !== id)
    save(); render()
}

function clearAll() {
    if (!confirm('Deseja apagar todas as transações?')) return
    state.items = []
    save(); render()
}

function parseValue(v, t) {
    let val = Number(v)
    if (isNaN(val)) val = 0
    // expenses are stored as negative amounts for easier math
    return t === 'expense' ? -Math.abs(val) : Math.abs(val)
}

function totals(items) {
    const entradas = items.filter(i => i.amount > 0).reduce((s, i) => s + i.amount, 0)
    const saidas = items.filter(i => i.amount < 0).reduce((s, i) => s + i.amount, 0)
    const saldo = entradas + saidas
    return { entradas, saidas, saldo }
}

function groupByMonth(items) {
    // return last 12 months totals
    const map = {}
    items.forEach(i => {
        const d = new Date(i.date)
        const key = `${d.getFullYear()}-${('0' + (d.getMonth() + 1)).slice(-2)}`
        map[key] = (map[key] || 0) + i.amount
    })
    // build last 12 months labels
    const labels = []
    const values = []
    const now = new Date()
    for (let k = 11; k >= 0; k--) {
        const d = new Date(now.getFullYear(), now.getMonth() - k, 1)
        const key = `${d.getFullYear()}-${('0' + (d.getMonth() + 1)).slice(-2)}`
        labels.push(d.toLocaleString('pt-BR', { month: 'short', year: 'numeric' }))
        values.push(map[key] || 0)
    }
    return { labels, values }
}

// Simple canvas chart (no external libs)
function drawChart(labels, values) {
    const canvas = chartEl
    const ctx = canvas.getContext('2d')
    // resize for high-dpi
    const ratio = window.devicePixelRatio || 1
    const w = canvas.clientWidth, h = canvas.clientHeight
    canvas.width = Math.floor(w * ratio); canvas.height = Math.floor(h * ratio)
    ctx.scale(ratio, ratio)
    // clear
    ctx.clearRect(0, 0, w, h)
    // layout
    const padding = 32
    const chartW = w - padding * 2; const chartH = h - padding * 2
    const max = Math.max(10, ...values.map(v => Math.abs(v)))
    // draw grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
        const y = padding + (chartH / 4) * i
        ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(padding + chartW, y); ctx.stroke();
    }
    // draw bars
    const barW = chartW / labels.length * 0.7
    labels.forEach((lab, idx) => {
        const v = values[idx]
        const x = padding + (chartW / labels.length) * idx + ((chartW / labels.length - barW) / 2)
        const zeroY = padding + chartH / 2
        const barH = (Math.abs(v) / max) * (chartH / 2)
        if (v >= 0) {
            ctx.fillStyle = 'rgba(22,163,74,0.85)'
            ctx.fillRect(x, zeroY - barH, barW, barH)
        } else {
            ctx.fillStyle = 'rgba(239,68,68,0.85)'
            ctx.fillRect(x, zeroY, barW, barH)
        }
        // label
        ctx.fillStyle = 'rgba(255,255,255,0.7)'
        ctx.font = '11px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText(lab.split(' ')[0], x + barW / 2, padding + chartH + 14)
    })

    // center line
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.beginPath(); ctx.moveTo(padding, padding + chartH / 2); ctx.lineTo(padding + chartW, padding + chartH / 2); ctx.stroke()
}

function renderList(items) {
    listEl.innerHTML = ''
    if (items.length === 0) { listEl.innerHTML = '<div class="empty">Sem transações</div>'; return }
    items.slice().reverse().forEach(i => {
        const el = document.createElement('div'); el.className = 'tx ' + (i.amount > 0 ? 'income' : 'expense')
        el.innerHTML = `
          <div class="badge">${i.amount > 0 ? '+' : "-"}${Math.abs(i.amount).toFixed(0)}</div>
          <div class="meta">
            <p><strong>${escapeHtml(i.desc)}</strong></p>
            <div class="small">${new Date(i.date).toLocaleDateString()} • ${fmt(i.amount)}</div>
          </div>
          <div>
            <button class="btn btn-ghost del" data-id="${i.id}">Excluir</button>
          </div>`
        listEl.appendChild(el)
    })
    // attach delete handlers
    $$('.del').forEach(btn => btn.onclick = () => removeTransaction(btn.dataset.id))
}

function renderMini(items) {
    miniList.innerHTML = ''
    const last = items.slice(-7).reverse()
    if (last.length === 0) { miniList.innerHTML = '<div class="empty">Nenhuma</div>'; return }
    last.forEach(i => {
        const el = document.createElement('div'); el.className = 'tx ' + (i.amount > 0 ? 'income' : 'expense')
        el.style.padding = '8px'
        el.innerHTML = `<div class="meta"><p>${escapeHtml(i.desc)}</p><div class="small">${new Date(i.date).toLocaleDateString()}</div></div><div><strong>${fmt(i.amount)}</strong></div>`
        miniList.appendChild(el)
    })
}

function renderQuick(items) {
    const c = $('#quick'); c.innerHTML = ''
    const last = items.slice(-5).reverse()
    if (last.length === 0) { c.innerHTML = '<div class="small-muted">Sem registros</div>'; return }
    last.forEach(i => {
        const d = document.createElement('div'); d.style.display = 'flex'; d.style.justifyContent = 'space-between'; d.style.marginBottom = '6px';
        d.innerHTML = `<div class="small-muted">${escapeHtml(i.desc)}</div><div>${fmt(i.amount)}</div>`
        c.appendChild(d)
    })
}

function escapeHtml(s) { return (s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])) }

function render(filteredItems = null) {
    const items = filteredItems || state.items
    // totals
    const t = totals(items)
    saldoEl.textContent = fmt(t.saldo)
    entradasEl.textContent = fmt(t.entradas)
    saidasEl.textContent = fmt(Math.abs(t.saidas))
    // lists
    renderList(items)
    renderMini(items)
    renderQuick(items)
    // chart
    const g = groupByMonth(items)
    drawChart(g.labels, g.values)
}

// filters and events
addBtn.onclick = () => {
    const d = desc.value.trim()
    const a = parseValue(amount.value, type.value)
    const dt = date.value || new Date().toISOString().slice(0, 10)
    if (!d) { alert('Descrição obrigatória'); desc.focus(); return }
    if (a === 0) { if (!confirm('Valor igual a 0. Deseja continuar?')) return }
    addTransaction({ desc: d, amount: a, date: dt, type: type.value })
    desc.value = ''; amount.value = ''; date.value = ''
}

clearBtn.onclick = clearAll

exportBtn.onclick = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'gastos.json'; a.click()
    URL.revokeObjectURL(url)
}

importBtn.onclick = () => fileInput.click()
fileInput.onchange = e => {
    const f = e.target.files[0]; if (!f) return
    const reader = new FileReader(); reader.onload = ev => {
        try {
            const parsed = JSON.parse(ev.target.result)
            if (parsed && Array.isArray(parsed.items)) {
                state.items = parsed.items
                save(); render()
                alert('Importado com sucesso')
            } else alert('Arquivo não tem o formato esperado')
        } catch (err) { alert('Erro ao ler o arquivo') }
    }
    reader.readAsText(f)
    fileInput.value = ''
}

applyFilter.onclick = () => {
    const qv = q.value.trim().toLowerCase()
    const tp = filterType.value
    let res = state.items.slice()
    if (tp !== 'all') res = res.filter(i => i.type === tp)
    if (qv) res = res.filter(i => i.desc.toLowerCase().includes(qv))
    render(res)
}
resetFilter.onclick = () => { q.value = ''; filterType.value = 'all'; render() }

filterMonth.onclick = () => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30)
    const res = state.items.filter(i => new Date(i.date) >= cutoff)
    render(res)
}
filterAll.onclick = () => render()

// initial load
load(); render()

// responsive redraw
window.addEventListener('resize', () => {
    const g = groupByMonth(state.items)
    drawChart(g.labels, g.values)
})

// sample data for first use
if (!state.items || state.items.length === 0) {
    state.items = [
        { id: 's1', desc: 'Salário', amount: 2500, date: new Date().toISOString().slice(0, 10), type: 'income' },
        { id: 's2', desc: 'Supermercado', amount: -320.45, date: new Date().toISOString().slice(0, 10), type: 'expense' },
        { id: 's3', desc: 'Freelance', amount: 420, date: new Date().toISOString().slice(0, 10), type: 'income' }
    ]
    save(); render()
}
