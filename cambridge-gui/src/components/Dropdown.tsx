
import clsx from 'clsx';
import React, { useState, isValidElement, useRef } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { Overlay } from './Overlay';
import MenuItem from './MenuItem';

interface DropdownProps {
    label: string;
    className?: string;
    menuClassName?: string;
    buttonClassName?: string;
    toggleButton: React.ReactNode;
    children: ReactNode;
    disabled?: boolean;
    onToggle?: (isOpen: boolean) => void;
}

const enhanceMenuItems = (
    children: ReactNode,
    setIsDropdownOpen: (isOpen: boolean) => void,
): ReactNode => {
    const processNode = (node: ReactNode): ReactNode => {
        if (!isValidElement(node)) {
            return node;
        }

        const element = node as ReactElement;
        // Check if it looks like a MenuItem (by type name or assumption)
        // We can also just pass the prop to everything and let React ignore it if not defined props
        // But checking type name is safer if possible.
        // For now, we will pass it to all valid elements that are likely our components.

        // Simplification: We blindly clone and pass setIsDropdownOpen
        return React.cloneElement(element, {
            // @ts-ignore
            setIsDropdownOpen,
            // @ts-ignore
            ...element.props,
        });
    };

    return React.Children.map(children, processNode);
};

const Dropdown: React.FC<DropdownProps> = ({
    label,
    className,
    menuClassName: _menuClassName,
    buttonClassName,
    toggleButton,
    children,
    disabled,
    onToggle,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const setIsDropdownOpen = (open: boolean) => {
        if (disabled) return;
        setIsOpen(open);
        onToggle?.(open);
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(!isOpen);
    };

    const childrenWithToggle = enhanceMenuItems(children, setIsDropdownOpen);

    return (
        <div className='dropdown-container flex relative'>
            {isOpen && <Overlay onDismiss={() => setIsDropdownOpen(false)} />}
            <div
                ref={containerRef}
                className={clsx('dropdown flex flex-col', className)}
            >
                <button
                    aria-haspopup='menu'
                    aria-expanded={isOpen}
                    aria-label={label}
                    title={label}
                    className={clsx(
                        'dropdown-toggle',
                        buttonClassName,
                    )}
                    onClick={toggleDropdown}
                    disabled={disabled}
                >
                    {toggleButton}
                </button>
                <div className={clsx('absolute top-full right-0 z-50', !isOpen && 'hidden')}>
                    {/* Wrapper to position the menu */}
                    {childrenWithToggle}
                </div>
            </div>
        </div>
    );
};

export default Dropdown;
