import React, { useEffect, useRef, useState } from 'react';

export const DebugOverlay: React.FC = () => {
    const [stats, setStats] = useState({
        dataTheme: '',
        inlineBg: '',
        computedBg: '',
        history: [] as string[]
    });

    const historyRef = useRef<string[]>([]);
    const lastStateRef = useRef('');

    useEffect(() => {
        const loop = () => {
            const root = document.documentElement;
            const dataTheme = root.getAttribute('data-theme') || 'null';
            const inlineBg = root.style.getPropertyValue('--background');
            const computedBg = getComputedStyle(root).getPropertyValue('--background');

            const currentState = `${dataTheme}|${inlineBg}|${computedBg}`;

            if (currentState !== lastStateRef.current) {
                const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
                const entry = `${timestamp}: [${dataTheme}] Inline:(${inlineBg}) Comp:(${computedBg})`;
                historyRef.current = [entry, ...historyRef.current].slice(0, 10);
                lastStateRef.current = currentState;
            }

            setStats({
                dataTheme,
                inlineBg,
                computedBg,
                history: historyRef.current
            });

            requestAnimationFrame(loop);
        };
        const handle = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(handle);
    }, []);

    return (
        <div style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            background: 'rgba(0,0,0,0.85)',
            color: '#0f0',
            padding: '10px',
            borderRadius: '8px',
            zIndex: 99999999,
            fontFamily: 'monospace',
            fontSize: '12px',
            pointerEvents: 'none',
            border: '2px solid #f00',
            maxWidth: '500px'
        }}>
            <div>Data-Theme: <span style={{ color: 'white' }}>{stats.dataTheme}</span></div>
            <div>Inline --bg: <span style={{ color: 'white' }}>{stats.inlineBg || '(empty)'}</span></div>
            <div>Computed --bg: <span style={{ color: 'white' }}>{stats.computedBg}</span></div>
            <hr style={{ borderColor: '#333', margin: '5px 0' }} />
            <div style={{ opacity: 0.7 }}>
                {stats.history.map((h, i) => <div key={i}>{h}</div>)}
            </div>
        </div>
    );
};
