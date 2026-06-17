--- js/scorer.js (原始)


+++ js/scorer.js (修改后)
// ═══════════════════════════════════════════════════════════════
//  Phone Equalizer — Scoring Engine
//  Ported from phone_scorer.py v4
// ═══════════════════════════════════════════════════════════════

import { DEAL_BREAKERS } from './data.js';

export function scoreBattery(mah) {
    if (mah < 6500) return 0;
    if (mah <= 7500) return ((mah - 6500) / 1000) * 20;
    if (mah >= 10000) return 23;
    return 20 + ((mah - 7500) / 2500) * 3;
}

export function scorePrice(usd) {
    if (usd <= 500) return 10;
    if (usd <= 800) return 10 - ((usd - 500) / 300) * 4;
    if (usd <= 1000) return 6 - ((usd - 800) / 200) * 3;
    return Math.max(0, 3 * Math.exp(-0.002 * (usd - 1000)));
}

export function scoreStorage(gb) {
    if (gb >= 1024) return 20;
    if (gb >= 512) return 15;
    if (gb >= 256) return 10;
    return 5;
}

export function scoreCharging(w) {
    if (w >= 120) return 20;
    if (w >= 100) return 10;
    if (w >= 90) return 5;
    return 0;
}

export function scoreDisplay(inches) {
    if (inches >= 6.9) return 12;
    if (inches >= 6.78) return 10;
    return 0;
}

export function scoreCamera(nanoreview) {
    if (nanoreview >= 95) return 13 + ((nanoreview - 95) / 5) * 2;
    if (nanoreview >= 85) return 10 + ((nanoreview - 85) / 10) * 3;
    if (nanoreview >= 70) return 5 + ((nanoreview - 70) / 15) * 5;
    return Math.max(0, (nanoreview / 70) * 5);
}

export function isDealBreaker(phone) {
    return phone.battery_mAh < DEAL_BREAKERS.battery_mAh ||
        phone.charging_W < DEAL_BREAKERS.charging_W ||
        phone.display_size_inches < DEAL_BREAKERS.display_size_inches;
}

export function scorePhone(phone, weights) {
    const isGlobal = phone.os_type.toLowerCase().includes('global');
    const osScore = isGlobal ? 25 : 15;

    const bat = scoreBattery(phone.battery_mAh);
    const price = scorePrice(phone.price_usd);
    const stor = scoreStorage(phone.storage_gb);
    const chg = scoreCharging(phone.charging_W);
    const disp = scoreDisplay(phone.display_size_inches);
    const cam = scoreCamera(phone.camera_quality);

    // Default max points for each category (v4)
    const defaultMax = {
        os_rom: 25,
        battery: 23,
        price: 10,
        storage: 20,
        charging: 20,
        display: 12,
        camera: 15
    };

    const scale = (score, category) => {
        const max = defaultMax[category];
        const w = weights[category];
        return score * (w / max);
    };

    const scaled = {
        os_rom: scale(osScore, 'os_rom'),
        battery: scale(bat, 'battery'),
        price: scale(price, 'price'),
        storage: scale(stor, 'storage'),
        charging: scale(chg, 'charging'),
        display: scale(disp, 'display'),
        camera: scale(cam, 'camera')
    };

    const total = Object.values(scaled).reduce((a, b) => a + b, 0);
    const totalMax = Object.values(weights).reduce((a, b) => a + b, 0);

    return {
        os_rom: { points: osScore, scaled: scaled.os_rom, max: weights.os_rom, note: isGlobal ? 'global ROM' : 'china ROM' },
        battery: { points: bat, scaled: scaled.battery, max: weights.battery, note: `${phone.battery_mAh} mAh` },
        price: { points: price, scaled: scaled.price, max: weights.price, note: `$${phone.price_usd}` },
        storage: { points: stor, scaled: scaled.storage, max: weights.storage, note: `${phone.storage_gb} GB` },
        charging: { points: chg, scaled: scaled.charging, max: weights.charging, note: `${phone.charging_W} W` },
        display: { points: disp, scaled: scaled.display, max: weights.display, note: `${phone.display_size_inches}"` },
        camera: { points: cam, scaled: scaled.camera, max: weights.camera, note: `NR ${phone.camera_quality}` },
        total: total,
        totalMax: totalMax,
        pct: totalMax > 0 ? (total / totalMax) * 100 : 0,
        dealBreaker: isDealBreaker(phone),
        isGlobal: isGlobal
    };
}
