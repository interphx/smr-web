import { Milliseconds } from 'types/milliseconds';
import { getTime } from 'utils/time';
import { requestFrame, cancelFrame } from 'utils/async';

export class GameLoop {
    private timestep     : Milliseconds;
    private maxTimestep  : Milliseconds;
    private onUpdate     : (dt: Milliseconds, alpha: number) => void;
    private onFixedUpdate: (dt: Milliseconds) => void;

    private accumulator   : number = 0; 
    private lastUpdateTime: number = NaN;
    private nextFrameId   : number = NaN;
    private lastDelta     : number = NaN;

    constructor(options: {
        timestep     : Milliseconds,
        onVariableUpdate     : (dt: Milliseconds, alpha: number) => void,
        onFixedUpdate: (dt: Milliseconds) => void
    }) {
        this.timestep      = options.timestep;
        this.maxTimestep   = Milliseconds.from(250);
        this.onUpdate      = options.onVariableUpdate;
        this.onFixedUpdate = options.onFixedUpdate;
        this.lastDelta     = this.timestep;

        this.runFrame = this.runFrame.bind(this);
    }

    private runFrame() {
        this.step();
        this.nextFrameId = requestFrame(this.runFrame);
    }

    public step() {
        if (isNaN(this.lastUpdateTime)) {
            this.lastUpdateTime = getTime();
        }

        const currentTime   = getTime();
        const currentDelta  = Math.max(0, Math.min(currentTime - this.lastUpdateTime, this.maxTimestep));
        this.lastDelta      = this.lastDelta * 0.8 + currentDelta * 0.2;
        const delta         = this.lastDelta;
        this.lastUpdateTime = currentTime;
        this.accumulator += delta;

        while (this.accumulator >= this.timestep) {
            this.onFixedUpdate(this.timestep);
            this.accumulator -= this.timestep;
        }
        
        // console.log(delta, (this.accumulator / this.timestep).toFixed(4));
        this.onUpdate(Milliseconds.from(delta), this.accumulator / this.timestep);
    }

    public start() {
        this.lastUpdateTime = getTime();
        this.accumulator = 0;
        this.lastDelta = this.timestep;
        this.runFrame();
    }

    public stop() {
        if (!isNaN(this.nextFrameId)) {
            cancelFrame(this.nextFrameId);
            this.nextFrameId = NaN;
            this.accumulator = 0;
        }
    }
}