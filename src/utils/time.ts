export const getTime: () => number = 
                ('performance' in window) ? window.performance.now.bind(window.performance) :
                ('now' in Date.prototype) ? Date.now.bind(Date) :
                () => (+new Date());