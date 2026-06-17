// ═══════════════════════════════════════════════════════════════
//  Phone Equalizer — UI Renderer & App Logic
// ═══════════════════════════════════════════════════════════════

import { PHONES, DEFAULT_WEIGHTS } from './data.js';
import { scorePhone } from './scorer.js';

let currentWeights = { ...DEFAULT_WEIGHTS };

export function initApp() {
    renderSliders();
    renderRankings();
    loadFromURL();
    setupThemeToggle();
}

function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
}

function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    themeToggle.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
}

function renderSliders() {
    const container = document.getElementById('sliderContainer');
    container.innerHTML = '';
    const categories = [
        { key: 'os_rom', label: 'OS ROM', max: 50, default: DEFAULT_WEIGHTS.os_rom },
        { key: 'battery', label: 'Battery', max: 40, default: DEFAULT_WEIGHTS.battery },
        { key: 'price', label: 'Price', max: 30, default: DEFAULT_WEIGHTS.price },
        { key: 'storage', label: 'Storage', max: 30, default: DEFAULT_WEIGHTS.storage },
        { key: 'charging', label: 'Charging', max: 30, default: DEFAULT_WEIGHTS.charging },
        { key: 'display', label: 'Display', max: 25, default: DEFAULT_WEIGHTS.display },
        { key: 'camera', label: 'Camera', max: 30, default: DEFAULT_WEIGHTS.camera }
    ];

    categories.forEach(cat => {
        const group = document.createElement('div');
        group.className = 'slider-group';

        const label = document.createElement('div');
        label.className = 'slider-label';
        label.innerHTML = `
            <span>${cat.label}</span>
            <span class="val" id="val_${cat.key}">${currentWeights[cat.key]}</span>
        `;
        group.appendChild(label);

        const input = document.createElement('input');
        input.type = 'range';
        input.min = 0;
        input.max = cat.max;
        input.value = currentWeights[cat.key];
        input.dataset.key = cat.key;
        input.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            currentWeights[cat.key] = val;
            document.getElementById(`val_${cat.key}`).textContent = val;
            updateTotalWeight();
            renderRankings();
        });
        group.appendChild(input);
        container.appendChild(group);
    });
    updateTotalWeight();
}

function updateTotalWeight() {
    const total = Object.values(currentWeights).reduce((a, b) => a + b, 0);
    document.getElementById('totalWeightDisplay').textContent = Math.round(total);
}

function renderRankings() {
    const container = document.getElementById('rankingsContainer');
    const countDisplay = document.getElementById('countDisplay');

    // Score each phone
    const scored = PHONES.map(phone => {
        const result = scorePhone(phone, currentWeights);
        return { phone, result };
    });

    // Sort: deal-breakers last, then by total score descending
    const sorted = [...scored].sort((a, b) => {
        if (a.result.dealBreaker && !b.result.dealBreaker) return 1;
        if (!a.result.dealBreaker && b.result.dealBreaker) return -1;
        return b.result.total - a.result.total;
    });

    const qualified = sorted.filter(s => !s.result.dealBreaker);
    countDisplay.textContent = `${qualified.length} qualified · ${sorted.filter(s => s.result.dealBreaker).length} excluded`;

    container.innerHTML = '';
    sorted.forEach((item, idx) => {
        const { phone, result } = item;
        const card = document.createElement('div');
        card.className = 'phone-card';
        if (result.dealBreaker) card.classList.add('deal-breaker');
        if (idx === 0 && !result.dealBreaker) card.classList.add('rank-1');
        if (idx === 1 && !result.dealBreaker) card.classList.add('rank-2');
        if (idx === 2 && !result.dealBreaker) card.classList.add('rank-3');

        const rankDisplay = result.dealBreaker ? '✕' : `#${idx + 1}`;

        const badgeClass = result.isGlobal ? 'badge-global' : 'badge-china';
        const badgeLabel = result.isGlobal ? 'Global' : 'China';

        card.innerHTML = `
            <div class="rank">${rankDisplay}</div>
            <div class="info">
                <div class="name">
                    ${phone.model}
                    <span class="badge ${badgeClass}">${badgeLabel}</span>
                    ${result.dealBreaker ? '<span class="deal-breaker-tag">excluded</span>' : ''}
                </div>
                <div class="specs">
                    <span>💰 $${phone.price_usd}</span>
                    <span>🔋 ${phone.battery_mAh} mAh</span>
                    <span>⚡ ${phone.charging_W}W</span>
                    <span>📷 ${phone.camera_quality} NR</span>
                    <span>📱 ${phone.display_size_inches}"</span>
                    <span>💾 ${phone.storage_gb}GB</span>
                </div>
            </div>
            <div class="score-wrap">
                <div class="score">${result.total.toFixed(1)}</div>
                <div class="max">/ ${result.totalMax.toFixed(1)}</div>
                <div class="pct">${result.pct.toFixed(0)}%</div>
            </div>
        `;

        card.addEventListener('click', () => {
            if (!result.dealBreaker) {
                showWhy(phone, result);
            }
        });

        container.appendChild(card);
    });

    // Auto-show top phone
    const top = sorted.find(s => !s.result.dealBreaker);
    if (top) {
        showWhy(top.phone, top.result);
    }
}

function showWhy(phone, result) {
    const panel = document.getElementById('whyPanel');
    panel.classList.add('visible');

    const breakdown = document.getElementById('whyBreakdown');
    const text = document.getElementById('whyText');

    // Build explanation
    const categories = [
        { label: 'OS ROM', key: 'os_rom' },
        { label: 'Battery', key: 'battery' },
        { label: 'Price', key: 'price' },
        { label: 'Storage', key: 'storage' },
        { label: 'Charging', key: 'charging' },
        { label: 'Display', key: 'display' },
        { label: 'Camera', key: 'camera' }
    ];

    const parts = categories.map(c => {
        const s = result[c.key];
        return `<span class="cat"><strong>${c.label}</strong> ${s.scaled.toFixed(1)}/<span class="pts">${s.max}</span> (${s.note})</span>`;
    });

    breakdown.innerHTML = parts.join('');

    // Build narrative
    const topCategory = categories
        .map(c => ({ ...c, scaled: result[c.key].scaled, max: result[c.key].max }))
        .sort((a, b) => (b.scaled / b.max) - (a.scaled / a.max))[0];

    const secondCategory = categories
        .map(c => ({ ...c, scaled: result[c.key].scaled, max: result[c.key].max }))
        .sort((a, b) => (b.scaled / b.max) - (a.scaled / a.max))[1];

    text.innerHTML = `
        <strong>${phone.model}</strong> scored <strong>${result.total.toFixed(1)}</strong> out of ${result.totalMax.toFixed(1)} (${result.pct.toFixed(0)}%).
        It excelled in <strong>${topCategory.label}</strong> (${topCategory.scaled.toFixed(1)}/${topCategory.max})
        and <strong>${secondCategory.label}</strong> (${secondCategory.scaled.toFixed(1)}/${secondCategory.max}).
        ${result.isGlobal ? 'Global ROM adds 25 points (preferred).' : 'China ROM is 15 points (acceptable).'}
        ${phone.price_usd > 1000 ? 'Price is above $1000, but the exponential decay still gives partial credit.' : `Price at $${phone.price_usd} is in the sweet spot.`}
        ${phone.battery_mAh > 7500 ? `The ${phone.battery_mAh} mAh battery gives a nice bonus above the 7500 mAh sweet spot.` : `Battery at ${phone.battery_mAh} mAh is in the sweet spot.`}
    `;
}

export function resetWeights() {
    currentWeights = { ...DEFAULT_WEIGHTS };
    // Update sliders
    document.querySelectorAll('#sliderContainer input[type="range"]').forEach(input => {
        const key = input.dataset.key;
        input.value = currentWeights[key];
        document.getElementById(`val_${key}`).textContent = currentWeights[key];
    });
    updateTotalWeight();
    renderRankings();
}

export function copyWeights() {
    const text = Object.entries(currentWeights)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('copyWeightsBtn');
        btn.textContent = '✅ Copied!';
        setTimeout(() => btn.textContent = '📋 Copy weights', 2000);
    }).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        const btn = document.getElementById('copyWeightsBtn');
        btn.textContent = '✅ Copied!';
        setTimeout(() => btn.textContent = '📋 Copy weights', 2000);
    });
}

export function shareConfiguration() {
    const params = new URLSearchParams();
    Object.entries(currentWeights).forEach(([k, v]) => {
        params.set(k, v);
    });
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url).then(() => {
        const btn = document.getElementById('shareBtn');
        btn.textContent = '✅ Link copied!';
        setTimeout(() => btn.textContent = '🔗 Share this configuration', 2000);
    }).catch(() => {
        // Fallback: show in alert
        alert(`Share this URL:\n${url}`);
    });
}

function loadFromURL() {
    const params = new URLSearchParams(window.location.search);
    let loaded = false;
    const keys = Object.keys(DEFAULT_WEIGHTS);
    keys.forEach(key => {
        if (params.has(key)) {
            const val = parseFloat(params.get(key));
            if (!isNaN(val) && val >= 0) {
                currentWeights[key] = val;
                loaded = true;
            }
        }
    });
    if (loaded) {
        // Update sliders
        document.querySelectorAll('#sliderContainer input[type="range"]').forEach(input => {
            const key = input.dataset.key;
            if (currentWeights[key] !== undefined) {
                input.value = currentWeights[key];
                document.getElementById(`val_${key}`).textContent = currentWeights[key];
            }
        });
        updateTotalWeight();
        renderRankings();
    }
}
