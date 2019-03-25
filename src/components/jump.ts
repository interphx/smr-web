import { Milliseconds } from 'types/milliseconds';
import { getTime } from 'utils/time';

export class Jump {
    public static componentName = 'Jump';

    public speed: number;
    public maxTime: Milliseconds;

    public isJumpHeld: boolean = false;
    public jumpStartTime: number = NaN;

    constructor(options: {
        speed: number,
        maxTime: Milliseconds
    }) {
        this.speed = options.speed;
        this.maxTime = options.maxTime;
    }

    startJumping() {
        this.jumpStartTime = getTime();
        this.isJumpHeld = true;
    }

    stopJumping() {
        this.isJumpHeld = false;
    }
}