--- js/data.js (原始)


+++ js/data.js (修改后)
// ═══════════════════════════════════════════════════════════════
//  Phone Equalizer — Data Module
//  Phone data copied from phones_clean.csv
// ═══════════════════════════════════════════════════════════════

export const PHONES = [
    { model: "Honor WIN", battery_mAh: 10000, charging_W: 120, camera_quality: 86, display_size_inches: 6.82, storage_gb: 256, ram_gb: 12, price_usd: 649, refresh_rate_hz: 185, os_type: "china ROM" },
    { model: "OPPO Find X9 Ultra", battery_mAh: 7050, charging_W: 100, camera_quality: 96, display_size_inches: 6.83, storage_gb: 256, ram_gb: 12, price_usd: 1199, refresh_rate_hz: 120, os_type: "china ROM" },
    { model: "Xiaomi 17 Ultra", battery_mAh: 6800, charging_W: 90, camera_quality: 96, display_size_inches: 6.9, storage_gb: 512, ram_gb: 12, price_usd: 999, refresh_rate_hz: 120, os_type: "china ROM" },
    { model: "Xiaomi 17", battery_mAh: 7000, charging_W: 100, camera_quality: 86, display_size_inches: 6.3, storage_gb: 256, ram_gb: 12, price_usd: 649, refresh_rate_hz: 120, os_type: "china ROM" },
    { model: "OnePlus 15", battery_mAh: 7300, charging_W: 120, camera_quality: 92, display_size_inches: 6.78, storage_gb: 256, ram_gb: 12, price_usd: 679, refresh_rate_hz: 165, os_type: "global ROM" },
    { model: "Vivo X300 Ultra", battery_mAh: 6600, charging_W: 100, camera_quality: 94, display_size_inches: 6.82, storage_gb: 256, ram_gb: 12, price_usd: 1099, refresh_rate_hz: 144, os_type: "china ROM" },
    { model: "Vivo X300 Pro", battery_mAh: 6510, charging_W: 90, camera_quality: 97, display_size_inches: 6.78, storage_gb: 256, ram_gb: 12, price_usd: 799, refresh_rate_hz: 120, os_type: "china ROM" },
    { model: "Iqoo 15T", battery_mAh: 8000, charging_W: 100, camera_quality: 79, display_size_inches: 6.82, storage_gb: 256, ram_gb: 12, price_usd: 699, refresh_rate_hz: 144, os_type: "china ROM" },
    { model: "Iqoo 15 Ultra", battery_mAh: 7400, charging_W: 100, camera_quality: 84, display_size_inches: 6.85, storage_gb: 512, ram_gb: 16, price_usd: 899, refresh_rate_hz: 144, os_type: "china ROM" },
    { model: "Iqoo 15", battery_mAh: 7000, charging_W: 100, camera_quality: 89, display_size_inches: 6.82, storage_gb: 256, ram_gb: 12, price_usd: 649, refresh_rate_hz: 144, os_type: "china ROM" },
    { model: "Iqoo Z11 Turbo", battery_mAh: 7600, charging_W: 100, camera_quality: 75, display_size_inches: 6.59, storage_gb: 256, ram_gb: 12, price_usd: 469, refresh_rate_hz: 144, os_type: "china ROM" },
    { model: "Iqoo Neo 11", battery_mAh: 7500, charging_W: 100, camera_quality: 74, display_size_inches: 6.82, storage_gb: 256, ram_gb: 12, price_usd: 459, refresh_rate_hz: 144, os_type: "china ROM" },
    { model: "Xiaomi 17 Pro Max", battery_mAh: 7500, charging_W: 100, camera_quality: 94, display_size_inches: 6.9, storage_gb: 512, ram_gb: 12, price_usd: 899, refresh_rate_hz: 120, os_type: "china ROM" },
    { model: "Redmi K90 Max", battery_mAh: 8550, charging_W: 100, camera_quality: 77, display_size_inches: 6.83, storage_gb: 256, ram_gb: 12, price_usd: 499, refresh_rate_hz: 165, os_type: "china ROM" },
    { model: "Redmagic 11S Pro Plus", battery_mAh: 7500, charging_W: 120, camera_quality: 77, display_size_inches: 6.65, storage_gb: 512, ram_gb: 16, price_usd: 1299, refresh_rate_hz: 144, os_type: "china ROM" },
    { model: "Realme GT8 Pro", battery_mAh: 7000, charging_W: 120, camera_quality: 86, display_size_inches: 6.79, storage_gb: 256, ram_gb: 12, price_usd: 639, refresh_rate_hz: 144, os_type: "china ROM" }
];

// ── Default weights (v4) ────────────────────────────────────────
export const DEFAULT_WEIGHTS = {
    os_rom: 25,
    battery: 23,
    price: 10,
    storage: 20,
    charging: 20,
    display: 12,
    camera: 15
};

// ── Deal-breaker thresholds ─────────────────────────────────────
export const DEAL_BREAKERS = {
    battery_mAh: 6500,
    charging_W: 90,
    display_size_inches: 6.78
};
