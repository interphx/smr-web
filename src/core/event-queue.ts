import { throwStatement } from '@babel/types';

type EventClass = {
    new(...args: any[]): any;
    eventName: string;
};
type AnyEventListener = (event: any) => void;

export class EventQueue {
    private events: InstanceType<EventClass>[];
    private listeners: {
        [eventId: string]: AnyEventListener[]
    };

    constructor() {
        this.events = [];
        this.listeners = {};
    }

    private handleEvent(event: InstanceType<EventClass>) {
        // Slice is needed to handle cases when a listener is removed mid-handling
        const actualListeners = this.listeners[(event.constructor as EventClass).eventName];
        const listeners = actualListeners.slice();
        for (let listener of listeners) {
            if (actualListeners.indexOf(listener) >= 0) {
                listener(event);
            }
        }
    }

    subscribe<T extends EventClass>(eventClass: T, listener: (event: InstanceType<T>) => void) {
        if (!this.listeners[eventClass.eventName]) {
            this.listeners[eventClass.eventName] = [];
        }
        this.listeners[eventClass.eventName].push(listener);

        return {
            unsubscribe: () => {
                this.unsubscribe(eventClass, listener);
            }
        }
    }

    unsubscribe<T extends EventClass>(eventClass: T, listener: (event: InstanceType<T>) => void) {
        if (this.listeners[eventClass.eventName]) {
            const index = this.listeners[eventClass.eventName].indexOf(listener);
            if (index >= 0) {
                this.listeners[eventClass.eventName].splice(index, 1);
            }
        }
    }

    dispatch<T extends EventClass>(event: InstanceType<T>) {
        this.events.push(event);
    }

    dispatchImmediately<T extends EventClass>(event: InstanceType<T>) {
        this.handleEvent(event);
    }

    handleEvents() {
        for (let event of this.events) {
            this.handleEvent(event);
        }
        this.events.length = 0;
    }
}