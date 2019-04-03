import { Milliseconds } from 'types/milliseconds';
import { getTime } from './time';

export const { requestFrame, cancelFrame } = ((): {
    requestFrame: (callback: (timestamp: number) => void) => number,
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
        requestFrame: function(callback: (timestamp: number) => void) {
            return setTimeout(function() {
                callback(getTime());
            }, 10) as any as number;
        },
        cancelFrame: function(frameId: number) {
            clearTimeout(frameId);
        }
    };
})();

export function delay(time: Milliseconds) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time);
    });
}