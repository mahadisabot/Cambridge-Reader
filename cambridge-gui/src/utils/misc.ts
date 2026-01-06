export const uniqueId = () => {
    return Math.random().toString(36).substr(2, 9);
};

export const getLocale = () => {
    if (typeof navigator !== 'undefined') {
        return navigator.language || 'en-US';
    }
    return 'en-US';
};
