/**
 * Enhanced Device Identification System
 * Replaces browser fingerprinting with a more robust device identification approach
 * Uses multiple stable device characteristics to create a unique device signature
 */

class DeviceIdentifier {
    constructor() {
        this.deviceId = null;
        this.characteristics = {};
    }

    /**
     * Generate a unique device ID based on multiple device characteristics
     * @returns {Promise<string>} Device ID hash
     */
    async generateDeviceId() {
        if (this.deviceId) {
            return this.deviceId;
        }

        try {
            // Collect device characteristics
            await this.collectDeviceCharacteristics();
            
            // Create device signature
            const signature = this.createDeviceSignature();
            
            // Generate hash
            this.deviceId = await this.hashSignature(signature);
            
            console.log('Device ID generated:', this.deviceId);
            return this.deviceId;
        } catch (error) {
            console.error('Error generating device ID:', error);
            throw new Error('Không thể tạo mã định danh thiết bị');
        }
    }

    /**
     * Collect stable device characteristics (consistent across browsers on same device)
     */
    async collectDeviceCharacteristics() {
        const characteristics = {};

        // Screen characteristics (most stable across browsers)
        characteristics.screenWidth = screen.width;
        characteristics.screenHeight = screen.height;
        characteristics.screenColorDepth = screen.colorDepth;
        characteristics.screenPixelDepth = screen.pixelDepth;

        // Timezone (stable for device location)
        characteristics.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // Primary language (more stable than full language list)
        characteristics.language = navigator.language;

        // Hardware characteristics (stable across browsers)
        characteristics.hardwareConcurrency = navigator.hardwareConcurrency || 0;
        characteristics.deviceMemory = navigator.deviceMemory || 0;
        characteristics.maxTouchPoints = navigator.maxTouchPoints || 0;

        // Platform information (stable for device)
        characteristics.platform = navigator.platform;

        // Extract stable parts from user agent (OS and major browser info)
        const userAgent = navigator.userAgent;
        characteristics.osInfo = this.extractOSInfo(userAgent);

        // Only use WebGL renderer (most stable hardware identifier)
        characteristics.webglRenderer = await this.getWebGLRenderer();

        // Remove browser-specific characteristics that vary between browsers
        // (canvas, audio, detailed user agent, etc.)

        this.characteristics = characteristics;
    }

    /**
     * Extract stable OS information from user agent
     */
    extractOSInfo(userAgent) {
        // Extract OS information that's consistent across browsers
        let osInfo = '';

        if (userAgent.includes('Windows NT')) {
            const match = userAgent.match(/Windows NT ([\d.]+)/);
            osInfo = match ? `Windows_${match[1]}` : 'Windows';
        } else if (userAgent.includes('Mac OS X')) {
            const match = userAgent.match(/Mac OS X ([\d_]+)/);
            osInfo = match ? `macOS_${match[1]}` : 'macOS';
        } else if (userAgent.includes('Linux')) {
            osInfo = 'Linux';
        } else if (userAgent.includes('Android')) {
            const match = userAgent.match(/Android ([\d.]+)/);
            osInfo = match ? `Android_${match[1]}` : 'Android';
        } else if (userAgent.includes('iPhone OS') || userAgent.includes('iOS')) {
            const match = userAgent.match(/OS ([\d_]+)/);
            osInfo = match ? `iOS_${match[1]}` : 'iOS';
        }

        return osInfo;
    }

    /**
     * Create device signature from collected characteristics
     */
    createDeviceSignature() {
        const orderedKeys = Object.keys(this.characteristics).sort();
        const signatureParts = orderedKeys.map(key => 
            `${key}:${this.characteristics[key]}`
        );
        return signatureParts.join('|');
    }



    /**
     * Get WebGL renderer (most stable hardware identifier)
     */
    async getWebGLRenderer() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

            if (!gl) {
                return 'webgl_unavailable';
            }

            // Only get renderer - most stable across browsers
            const renderer = gl.getParameter(gl.RENDERER);
            return renderer || 'renderer_unavailable';
        } catch (error) {
            console.warn('WebGL renderer detection failed:', error);
            return 'webgl_unavailable';
        }
    }



    /**
     * Hash a string using Web Crypto API
     */
    async hashString(str) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(str);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (error) {
            console.warn('Crypto API hashing failed, using fallback:', error);
            return this.fallbackHash(str);
        }
    }

    /**
     * Fallback hash function if Web Crypto API is not available
     */
    fallbackHash(str) {
        let hash = 0;
        if (str.length === 0) return hash.toString();
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return Math.abs(hash).toString(16);
    }

    /**
     * Hash the complete device signature
     */
    async hashSignature(signature) {
        return await this.hashString(signature);
    }

    /**
     * Get device characteristics for debugging
     */
    getCharacteristics() {
        return this.characteristics;
    }

    /**
     * Validate if device ID can be generated
     */
    async validateDeviceSupport() {
        try {
            await this.generateDeviceId();
            return true;
        } catch (error) {
            return false;
        }
    }
}

// Global instance
window.deviceIdentifier = new DeviceIdentifier();

// Convenience function for backward compatibility
window.getDeviceId = async function() {
    return await window.deviceIdentifier.generateDeviceId();
};

// Debug function to see device characteristics
window.debugDeviceId = async function() {
    await window.deviceIdentifier.generateDeviceId();
    const characteristics = window.deviceIdentifier.getCharacteristics();
    console.log('Device Characteristics:', characteristics);
    console.log('Device ID:', window.deviceIdentifier.deviceId);
    return characteristics;
};
