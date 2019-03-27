import { Milliseconds } from 'types/milliseconds';

export const { requestFrame, cancelFrame } = ((): {
    requestFrame: (callback: Function) => number,
    cancelFrame: (id: number) => void
} => {
    const global = window as any;
    const prefixes = ['', 'webkit', 'moz', 'o', 'ms'];
    const withPrefix = (name: string, prefix: string) => 
        prefix
            ? (prefix + name.charAt(0).toUpperCase() + name.slice(1))
            : (name.charAt(0).toLowerCase() + name.slice(1));
    
    for (let prefix of prefixes) {
        const requestFrameName = withPrefix('requestAnimationFrame', prefix);
        const cancelFrameName = withPrefix('cancelAnimationFrame', prefix);
        if (global[requestFrameName] && global[cancelFrameName]) {
            return {
                requestFrame: global[requestFrameName].bind(global),
                cancelFrame: global[cancelFrameName].bind(global)
            };
        }
    }

    return {
        requestFrame: (callback: Function) => setTimeout(callback, 0),
        cancelFrame: (timeoutId: number) => clearTimeout(timeoutId)
    };
})();

export function delay(time: Milliseconds) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time);
    });
}