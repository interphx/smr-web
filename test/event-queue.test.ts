import { EventQueue } from 'core/event-queue';

class FooEvent {
    public static readonly eventName = 'FooEvent' as const;

    constructor(public foo: number) {}
}

describe('EventQueue', () => {
    test('dispatches events in batches', () => {
        const queue = new EventQueue();

        const listener = jest.fn();

        queue.subscribe(FooEvent, listener);
        queue.dispatch(new FooEvent(123));
        queue.dispatch(new FooEvent(456));
        queue.dispatch(new FooEvent(789));
        queue.handleEvents();

        expect(listener.mock.calls.length).toBe(3);
    });

    test('dispatches events immediately', () => {
        const queue = new EventQueue();

        const listener = jest.fn();

        queue.subscribe(FooEvent, listener);
        queue.dispatchImmediately(new FooEvent(123));
        queue.dispatchImmediately(new FooEvent(456));
        queue.dispatchImmediately(new FooEvent(789));

        expect(listener.mock.calls.length).toBe(3);
    });

    test('unsubscribes listeners via method', () => {
        const queue = new EventQueue();

        const listener = jest.fn();

        queue.subscribe(FooEvent, listener);
        queue.dispatchImmediately(new FooEvent(123));
        queue.unsubscribe(FooEvent, listener);
        queue.dispatchImmediately(new FooEvent(456));

        expect(listener.mock.calls.length).toBe(1);
    });

    test('unsubscribes listeners via handle', () => {
        const queue = new EventQueue();

        const listener = jest.fn();

        const handle = queue.subscribe(FooEvent, listener);
        queue.dispatchImmediately(new FooEvent(123));
        handle.unsubscribe();
        queue.dispatchImmediately(new FooEvent(456));

        expect(listener.mock.calls.length).toBe(1);
    });

    test('unsubscribes listeners during processing', () => {
        const queue = new EventQueue();

        const listenerA = jest.fn(() => { queue.unsubscribe(FooEvent, listenerB); });
        const listenerB = jest.fn();
        const listenerC = jest.fn();

        queue.subscribe(FooEvent, listenerA);
        queue.subscribe(FooEvent, listenerB);
        queue.subscribe(FooEvent, listenerC);
        queue.dispatch(new FooEvent(123));
        queue.handleEvents();

        expect(listenerA.mock.calls.length).toBe(1);
        expect(listenerB.mock.calls.length).toBe(0);
        expect(listenerC.mock.calls.length).toBe(1);
    });
});