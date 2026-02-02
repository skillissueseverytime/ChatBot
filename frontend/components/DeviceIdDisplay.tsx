'use client';

import { useEffect, useState } from 'react';
import { getDeviceIdHash } from '@/lib/deviceFingerprint';

export default function DeviceIdDisplay() {
    const [deviceId, setDeviceId] = useState('');

    useEffect(() => {
        getDeviceIdHash().then(id => setDeviceId(id));
    }, []);

    if (!deviceId) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '10px',
            left: '10px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '11px',
            fontFamily: 'monospace',
            zIndex: 9999
        }}>
            Device ID: {deviceId.substring(0, 12)}...
        </div>
    );
}
