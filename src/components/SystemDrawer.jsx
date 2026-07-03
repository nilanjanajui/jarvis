'use client';

import NeuralSync from './NeuralSync';
import SystemLog from './SystemLog';
import SystemTopology from './SystemTopology';
import SatelliteLink from './SatelliteLink';
import AtmosphericData from './AtmosphericData';
import SecurityStatus from './SecurityStatus';
import SystemTerminal from './SystemTerminal';

// Secondary telemetry, demoted out of the always-visible rails and into a
// slide-in drawer. Dimmed via a single opacity on the wrapper so every panel
// inside reads as "background system info" next to the two hero panels
// (Bio-Metrics, Audio Visualizer) that stay on the main screen.
export default function SystemDrawer({ open, onClose, extraLogLine }) {
    return (
        <>
            {/* Click-outside-to-close backdrop — transparent so the HUD stays visible */}
            {open && (
                <div
                    onClick={onClose}
                    style={{ position: 'fixed', inset: 0, zIndex: 55, cursor: 'default' }}
                />
            )}

            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: '300px',
                    background: 'rgba(2,7,15,0.97)',
                    borderLeft: '1px solid rgba(0,212,255,0.25)',
                    boxShadow: '-16px 0 40px rgba(0,0,0,0.55)',
                    zIndex: 60,
                    transform: open ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 0.35s ease',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 16px', borderBottom: '1px solid rgba(0,212,255,0.15)',
                    flexShrink: 0,
                }}>
                    <span style={{ fontFamily: 'Orbitron', fontSize: '12px', letterSpacing: '0.18em', color: '#00d4ff', textShadow: '0 0 8px rgba(0,212,255,0.5)' }}>
                        SYSTEM DIAGNOSTICS
                    </span>
                    <span
                        onClick={onClose}
                        style={{ fontFamily: 'Orbitron', fontSize: '18px', color: 'rgba(0,212,255,0.6)', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}
                    >
                        ×
                    </span>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '12px', opacity: 0.85 }}>
                    <NeuralSync />
                    <SystemLog extraLine={extraLogLine} />
                    <SystemTopology />
                    <SatelliteLink />
                    <AtmosphericData />
                    <SecurityStatus />
                    <SystemTerminal />
                </div>
            </div>
        </>
    );
}