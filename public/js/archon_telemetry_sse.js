/**
 * ARCHON V7 Telemetry Plugin (SSE Version)
 * =========================================
 * Real-time telemetry integration using Server-Sent Events
 * Compatible with Next.js/Vercel serverless environment
 * 
 * Author: Selman (ARCHON Pipeline)
 * Version: 7.0.0
 */

class ARCHONTelemetrySSE {
    constructor(options = {}) {
        this.streamUrl = options.streamUrl || '/api/telemetry/stream';
        this.metricsUrl = options.metricsUrl || '/api/telemetry';
        this.reconnectInterval = options.reconnectInterval || 5000;
        this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
        
        this.eventSource = null;
        this.reconnectAttempts = 0;
        this.isConnected = false;
        this.listeners = {};
        this.latestData = null;
        
        // DOM element mappings for auto-update
        this.elementMappings = {
            'trust': 'trust_delta',
            'latency': 'latency_p95',
            'drift': 'drift_level',
            'health': 'system_health',
            'workflows': 'active_workflows',
            'ethics': 'ethics_score',
            'zone': 'trust_zone',
            'glow': 'glow_intensity',
            'timestamp': 'timestamp'
        };
        
        console.log('🧠 ARCHON Telemetry SSE Plugin initialized');
    }

    /**
     * Connect to SSE stream
     */
    connect() {
        if (this.eventSource) {
            console.warn('Already connected to telemetry stream');
            return;
        }

        console.log(`🔗 Connecting to ${this.streamUrl}...`);
        
        try {
            this.eventSource = new EventSource(this.streamUrl);
            
            this.eventSource.onopen = () => this._handleOpen();
            this.eventSource.onmessage = (event) => this._handleMessage(event);
            this.eventSource.onerror = (error) => this._handleError(error);
            
        } catch (error) {
            console.error('Failed to create EventSource:', error);
            this._scheduleReconnect();
        }
    }

    /**
     * Disconnect from SSE stream
     */
    disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        this.isConnected = false;
        this.reconnectAttempts = this.maxReconnectAttempts;
        console.log('📴 Disconnected from telemetry stream');
    }

    /**
     * Handle SSE connection open
     */
    _handleOpen() {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('✅ Connected to ARCHON Telemetry Stream (SSE)');
        this._emit('connected', { url: this.streamUrl });
    }

    /**
     * Handle incoming SSE message
     */
    _handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            this.latestData = data;
            
            // Auto-update DOM elements
            this._updateDOMElements(data);
            
            // Apply CSS custom properties
            this._updateCSSProperties(data);
            
            // Emit event for custom handlers
            this._emit('data', data);
            
        } catch (error) {
            console.error('Failed to parse telemetry data:', error);
        }
    }

    /**
     * Handle SSE error
     */
    _handleError(error) {
        console.error('SSE error:', error);
        this.isConnected = false;
        this._emit('error', error);
        this._emit('disconnected');
        
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        
        this._scheduleReconnect();
    }

    /**
     * Schedule reconnection
     */
    _scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            this._emit('maxReconnectAttempts');
            return;
        }

        this.reconnectAttempts++;
        console.log(`🔄 Reconnecting in ${this.reconnectInterval}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => this.connect(), this.reconnectInterval);
    }

    /**
     * Update DOM elements
     */
    _updateDOMElements(data) {
        for (const [elementId, dataKey] of Object.entries(this.elementMappings)) {
            const element = document.getElementById(elementId);
            if (element && data[dataKey] !== undefined) {
                let value = data[dataKey];
                
                // Format based on data type
                if (typeof value === 'number') {
                    if (dataKey.includes('delta') || dataKey.includes('level') || dataKey.includes('score') || dataKey.includes('intensity')) {
                        value = value.toFixed(3);
                    } else if (dataKey.includes('latency')) {
                        value = `${value}ms`;
                    } else if (dataKey.includes('health') || dataKey.includes('rate')) {
                        value = `${value}%`;
                    }
                }
                
                // Update element
                if (element.tagName === 'INPUT') {
                    element.value = value;
                } else {
                    element.textContent = value;
                }
                
                // Visual feedback
                element.classList.add('telemetry-updated');
                setTimeout(() => element.classList.remove('telemetry-updated'), 300);
            }
        }
    }

    /**
     * Update CSS custom properties
     */
    _updateCSSProperties(data) {
        const root = document.documentElement;
        
        if (data.glow_intensity !== undefined) {
            root.style.setProperty('--glow-intensity', data.glow_intensity);
        }
        
        if (data.trust_delta !== undefined) {
            root.style.setProperty('--trust-delta', data.trust_delta);
            
            let zoneColor;
            if (data.trust_delta > 0.85) {
                zoneColor = '#00ff88';
            } else if (data.trust_delta > 0.7) {
                zoneColor = '#ffcc00';
            } else {
                zoneColor = '#ff4444';
            }
            root.style.setProperty('--trust-zone-color', zoneColor);
        }
        
        if (data.drift_level !== undefined) {
            root.style.setProperty('--drift-level', data.drift_level);
        }
        
        if (data.ethics_score !== undefined) {
            const pulseSpeed = 2 - data.ethics_score;
            root.style.setProperty('--pulse-duration', `${pulseSpeed}s`);
        }
    }

    /**
     * Register event listener
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
        return this;
    }

    /**
     * Remove event listener
     */
    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
        return this;
    }

    /**
     * Emit event
     */
    _emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${event} listener:`, error);
                }
            });
        }
    }

    /**
     * Get latest data
     */
    getLatestData() {
        return this.latestData;
    }

    /**
     * Check connection status
     */
    isConnectedToStream() {
        return this.isConnected;
    }

    /**
     * Fetch current metrics (one-time)
     */
    async fetchMetrics() {
        try {
            const response = await fetch(this.metricsUrl);
            const data = await response.json();
            this.latestData = data;
            return data;
        } catch (error) {
            console.error('Failed to fetch metrics:', error);
            return null;
        }
    }

    /**
     * Update metrics
     */
    async updateMetrics(updates) {
        try {
            const response = await fetch(this.metricsUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            return await response.json();
        } catch (error) {
            console.error('Failed to update metrics:', error);
            return null;
        }
    }
}

/**
 * Quick initialization function
 */
function initARCHONTelemetry(options = {}) {
    const plugin = new ARCHONTelemetrySSE(options);
    plugin.connect();
    
    // Expose globally
    window.archonTelemetry = plugin;
    
    return plugin;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ARCHONTelemetrySSE, initARCHONTelemetry };
}

// Auto-initialize if data attribute present
document.addEventListener('DOMContentLoaded', () => {
    const autoInit = document.querySelector('[data-archon-telemetry-auto]');
    if (autoInit) {
        const url = autoInit.getAttribute('data-stream-url');
        initARCHONTelemetry({ streamUrl: url });
    }
});

console.log('📦 ARCHON Telemetry SSE Plugin loaded (v7.0.0)');
