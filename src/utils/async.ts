import { Milliseconds } from 'types/milliseconds';

export const requestFrame = 
    ('requestAnimationFrame' in window) ? window.requestAnimationFrame.bind(window) :
    (callback: Function) => setTimeout(callback, 0);

export const cancelFrame =
    ('requestAnimationFrame' in window) ? window.cancelAnimationFrame.bind(window) :
    (frameId: number) => clearTimeout(frameId);

export function delay(time: Milliseconds) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time);
    });
}