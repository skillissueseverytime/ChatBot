'use client';

/**
 * Device Fingerprinting Utilities
 * Generates a stable device ID without requiring any PII.
 * Uses crypto API for UUID generation, stored in localStorage.
 */

const STORAGE_KEY = 'controlled_anonymity_device_id';

export function generateUUID(): string {
    if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
        return window.crypto.randomUUID();
    }

    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function getDeviceId(): string {
    if (typeof window === 'undefined') return '';

    let deviceId = localStorage.getItem(STORAGE_KEY);

    if (!deviceId) {
        deviceId = generateUUID();
        localStorage.setItem(STORAGE_KEY, deviceId);
        console.log('Generated new device ID:', deviceId);
    }

    return deviceId;
}

export function clearDeviceId(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    console.log('Device ID cleared');
}

export async function getDeviceIdHash(): Promise<string> {
    const deviceId = getDeviceId();

    if (typeof window !== 'undefined' && window.crypto?.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(deviceId);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Fallback: just use the UUID directly
    return deviceId.replace(/-/g, '');
}
