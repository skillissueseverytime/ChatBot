/**
 * Device Fingerprinting Module
 * Generates a stable device ID without requiring any PII.
 * Uses crypto API for UUID generation, stored in localStorage.
 */

const DeviceFingerprint = {
    STORAGE_KEY: 'controlled_anonymity_device_id',

    /**
     * Generate a UUIDv4
     */
    generateUUID() {
        if (window.crypto && window.crypto.randomUUID) {
            return window.crypto.randomUUID();
        }

        // Fallback for older browsers
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    /**
     * Get or create the device ID
     */
    getDeviceId() {
        let deviceId = localStorage.getItem(this.STORAGE_KEY);

        if (!deviceId) {
            deviceId = this.generateUUID();
            localStorage.setItem(this.STORAGE_KEY, deviceId);
            console.log('Generated new device ID:', deviceId);
        } else {
            console.log('Using existing device ID:', deviceId);
        }

        return deviceId;
    },

    /**
     * Clear the device ID (for testing/reset purposes)
     */
    clearDeviceId() {
        localStorage.removeItem(this.STORAGE_KEY);
        console.log('Device ID cleared');
    },

    /**
     * Get a hash of the device ID for API calls
     * This adds an extra layer of abstraction
     */
    async getDeviceIdHash() {
        const deviceId = this.getDeviceId();

        if (window.crypto && window.crypto.subtle) {
            const encoder = new TextEncoder();
            const data = encoder.encode(deviceId);
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }

        // Fallback: just use the UUID directly
        return deviceId.replace(/-/g, '');
    }
};

// Make it globally available
window.DeviceFingerprint = DeviceFingerprint;
