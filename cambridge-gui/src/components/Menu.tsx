import clsx from 'clsx';
import React, { useEffect, useRef } from 'react';
// import { useKeyDownActions } from '@/hooks/useKeyDownActions'; // Mocked/Ignored

interface MenuProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    onCancel?: () => void;
}

const Menu: React.FC<MenuProps> = ({ children, className, style, onCancel }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    // useKeyDownActions implementation simplified
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onCancel?.();
            }
        };
        menuRef.current?.addEventListener('keydown', handleKeyDown);
        return () => {
            menuRef.current?.removeEventListener('keydown', handleKeyDown);
        }
    }, [onCancel]);


    useEffect(() => {
        setTimeout(() => {
            if (menuRef.current) {
                // Focus simpler selector logic
                const firstItem = menuRef.current.querySelector('button[role="menuitem"], [role="menuitem"] button');
                if (firstItem) {
                    (firstItem as HTMLElement).focus();
                }
            }
        }, 200);
    }, []);

    return (
        <div
            ref={menuRef}
            role='none'
            className={clsx('max-h-[calc(100vh-96px)] overflow-y-auto z-50', className)}
            style={style}
        >
            {children}
        </div>
    );
};

export default Menu;
