import React, { useState, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// A simple, drop-in Ripple component. 
// Usage: Position 'relative' on parent, and place <Ripple /> inside. 
// It will auto-fill the parent. Parent must have `overflow-hidden`.

export default function Ripple({ color = "rgba(255, 255, 255, 0.3)" }) {
    const [ripples, setRipples] = useState<{ x: number, y: number, key: number, size: number }[]>([]);

    const createRipple = (event: React.MouseEvent) => {
        const container = event.currentTarget.getBoundingClientRect();
        const size = Math.max(container.width, container.height);
        const x = event.clientX - container.left - size / 2;
        const y = event.clientY - container.top - size / 2;

        const newRipple = { x, y, size, key: Date.now() };
        setRipples(prev => [...prev, newRipple]);
    };

    return (
        <div
            className="absolute inset-0 pointer-events-auto cursor-pointer"
            onClick={createRipple} // This overlay captures clicks, effectively acting as the button hit area
        // Note: For buttons with text, you want this BEHIND the text. 
        // So z-index should be 0, texts z-10.
        >
            <AnimatePresence>
                {ripples.map(ripple => (
                    <motion.span
                        key={ripple.key}
                        initial={{ scale: 0, opacity: 0.5 }}
                        animate={{ scale: 2, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        style={{
                            position: 'absolute',
                            top: ripple.y,
                            left: ripple.x,
                            width: ripple.size,
                            height: ripple.size,
                            borderRadius: '50%',
                            backgroundColor: color,
                            pointerEvents: 'none',
                        }}
                        onAnimationComplete={() => setRipples(prev => prev.filter(r => r.key !== ripple.key))}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}
