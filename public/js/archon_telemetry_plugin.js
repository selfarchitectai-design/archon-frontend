/**
 * ARCHON V7 Telemetry WebSocket Plugin
 * =====================================
 * Real-time telemetry integration for ARCHON dashboard
 * 
 * Author: Selman (ARCHON Pipeline)
 * Version: 7.0.0
 */

class ARCHONTelemetryPlugin {
    constructor(options = {}) {
        this.wsUrl = options.wsUrl || 'wss://www.selfarchitectai.com/telemetry/stream';
        this.reconnectInterval = options.reconnectInterval || 5000;
        this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
        
        this.ws = null;
        this.reconnectAttempts = 0;
        this.isConnected = false;
        this.listeners = {};
        this.latestData = null;
        
        // DOM element IDs for auto-update
        this.elementMappings = {
            'trust': 'trust_delta',
            'latency': 'latency_p95',
            'drift': 'drift_level',
            'health': 'system_health',
            'workflows': 'active_workflows',
            'ethics': 'ethics_score',
            'zone': 'trust_zone',
            'glow': 'glow_intensity'
        };
        
        console.log('🧠 ARCHON Telemetry Plugin initialized');
    }

    /**
     * Connect to WebSocket server
     */
    connect() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.warn('Already connected to telemetry stream');
            return;
        }

        console.log(`🔗 Connecting to ${this.wsUrl}...`);
        
        try {
            this.ws = new WebSocket(this.wsUrl);
            
            this.ws.onopen = () => this._handleOpen();
            this.ws.onmessage = (event) => this._handleMessage(event);
            this.ws.onclose = () => this._handleClose();
            this.ws.onerror = (error) => this._handleError(error);
            
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            this._scheduleReconnect();
        }
    }

    /**
     * Disconnect from WebSocket server
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnect
        console.log('📴 Disconnected from telemetry stream');
    }

    /**
     * Handle WebSocket open event
     */
    _handleOpen() {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('✅ Connected to ARCHON Telemetry Stream');
        this._emit('connected', { url: this.wsUrl });
    }

    /**
     * Handle incoming WebSocket message
     */
    _handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            this.latestData = data;
            
            // Auto-update DOM elements
            this._updateDOMElements(data);
            
            // Apply CSS custom properties for glow effects
            this._updateCSSProperties(data);
            
            // Emit event for custom handlers
            this._emit('data', data);
            
        } catch (error) {
            console.error('Failed to parse telemetry data:', error);
        }
    }

    /**
     * Handle WebSocket close event
     */
    _handleClose() {
        this.isConnected = false;
        console.log('🔌 WebSocket connection closed');
        this._emit('disconnected');
        this._scheduleReconnect();
    }

    /**
     * Handle WebSocket error
     */
    _handleError(error) {
        console.error('WebSocket error:', error);
        this._emit('error', error);
    }

    /**
     * Schedule reconnection attempt
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
     * Update DOM elements with telemetry data
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
                
                // Update element content
                if (element.tagName === 'INPUT') {
                    element.value = value;
                } else {
                    element.textContent = value;
                }
                
                // Add visual feedback class
                element.classList.add('telemetry-updated');
                setTimeout(() => element.classList.remove('telemetry-updated'), 300);
            }
        }
    }

    /**
     * Update CSS custom properties for visual effects
     */
    _updateCSSProperties(data) {
        const root = document.documentElement;
        
        // Glow intensity
        if (data.glow_intensity !== undefined) {
            root.style.setProperty('--glow-intensity', data.glow_intensity);
        }
        
        // Trust delta (for color transitions)
        if (data.trust_delta !== undefined) {
            root.style.setProperty('--trust-delta', data.trust_delta);
            
            // Trust zone colors
            let zoneColor;
            if (data.trust_delta > 0.85) {
                zoneColor = '#00ff88'; // Green
            } else if (data.trust_delta > 0.7) {
                zoneColor = '#ffcc00'; // Yellow
            } else {
                zoneColor = '#ff4444'; // Red
            }
            root.style.setProperty('--trust-zone-color', zoneColor);
        }
        
        // Drift level (for warning indicators)
        if (data.drift_level !== undefined) {
            root.style.setProperty('--drift-level', data.drift_level);
        }
        
        // Pulse animation speed based on ethics score
        if (data.ethics_score !== undefined) {
            const pulseSpeed = 2 - data.ethics_score; // Higher ethics = slower pulse
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
        return this; // Allow chaining
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
     * Emit event to listeners
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
     * Get latest telemetry data
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
}

/**
 * ARCHON HoloMap Glow Controller
 * Specialized controller for 3D visualization effects
 */
class ARCHONHoloMapController {
    constructor(telemetryPlugin) {
        this.telemetry = telemetryPlugin;
        this.glowElements = [];
        this.animationFrame = null;
        
        // Listen for telemetry updates
        this.telemetry.on('data', (data) => this._updateGlow(data));
    }

    /**
     * Register element for glow effect
     */
    registerGlowElement(element) {
        this.glowElements.push(element);
    }

    /**
     * Update glow effect on registered elements
     */
    _updateGlow(data) {
        const intensity = data.glow_intensity || 0.5;
        const trustZone = data.trust_zone || 'GREEN';
        
        // Define glow colors by zone
        const glowColors = {
            'GREEN': `rgba(0, 255, 136, ${intensity})`,
            'YELLOW': `rgba(255, 204, 0, ${intensity})`,
            'RED': `rgba(255, 68, 68, ${intensity})`
        };
        
        const glowColor = glowColors[trustZone];
        const blurRadius = 20 + (intensity * 30);
        
        this.glowElements.forEach(element => {
            element.style.boxShadow = `0 0 ${blurRadius}px ${glowColor}`;
            element.style.borderColor = glowColor;
        });
    }

    /**
     * Start pulse animation
     */
    startPulseAnimation() {
        const animate = () => {
            // Animation logic here
            this.animationFrame = requestAnimationFrame(animate);
        };
        animate();
    }

    /**
     * Stop pulse animation
     */
    stopPulseAnimation() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
}

/**
 * Quick initialization function
 */
function initARCHONTelemetry(options = {}) {
    const plugin = new ARCHONTelemetryPlugin(options);
    plugin.connect();
    
    // Expose globally
    window.archonTelemetry = plugin;
    
    return plugin;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ARCHONTelemetryPlugin,
        ARCHONHoloMapController,
        initARCHONTelemetry
    };
}

// Auto-initialize if data attribute present
document.addEventListener('DOMContentLoaded', () => {
    const autoInit = document.querySelector('[data-archon-telemetry-auto]');
    if (autoInit) {
        const url = autoInit.getAttribute('data-telemetry-url');
        initARCHONTelemetry({ wsUrl: url });
    }
});

console.log('📦 ARCHON Telemetry Plugin loaded (v7.0.0)');
