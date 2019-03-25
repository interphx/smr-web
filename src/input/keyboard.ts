import { getTime } from 'utils/time';

interface KeyState {
    isDown: boolean;
    unpressTime: number;
}

const KeyState = {
    createDefault(): KeyState {
        return {
            isDown: false,
            unpressTime: -Infinity
        };
    }
}

export class KeyboardInput {
    states: {[key: string]: KeyState} = Object.create(null);

    constructor() {
        window.addEventListener('keydown', event => {
            this.press(event.key);
        });

        window.addEventListener('keyup', event => {
            this.unpress(event.key);
        });

        window.addEventListener('blur', () => {
            for (let key in this.states) {
                this.unpress(key);
            }
        });
    }

    private press(keyName: string) {
        const key = keyName.toUpperCase();

        this.states[key] = this.states[key] || KeyState.createDefault();
        this.states[key].isDown = true;
    }

    private unpress(keyName: string) {
        const key = keyName.toUpperCase();

        this.states[key] = this.states[key] || KeyState.createDefault();
        this.states[key].isDown = false;
        this.states[key].unpressTime = getTime();
    }

    isDown(keyName: string) {
        const key = keyName.toUpperCase();
        const state = this.states[key];
        return Boolean(state && state.isDown);
    }

    isUp(keyName: string) {
        return !this.isDown(keyName);
    }

    wasDown(keyName: string, millisecondsAgo: number) {
        const key = keyName.toUpperCase();
        const state = this.states[key];

        return Boolean(state && (getTime() - state.unpressTime <= millisecondsAgo));
    }
}