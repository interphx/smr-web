import { Milliseconds } from 'types/milliseconds';
import { requestFrame, cancelFrame } from 'utils/async';

export class GameLoop {
    private timestep     : Milliseconds;
    private maxTimestep  : Milliseconds;
    private onUpdate     : (dt: Milliseconds, alpha: number) => void;
    private onFixedUpdate: (dt: Milliseconds) => void;

    private totalTime     : number = 0;
    private accumulator   : number = 0; 
    private lastUpdateTime: number = NaN;
    private nextFrameId   : number = NaN;

    constructor(options: {
        timestep     : Milliseconds,
        onVariableUpdate     : (dt: Milliseconds, alpha: number) => void,
        onFixedUpdate: (dt: Milliseconds) => void
    }) {
        this.timestep      = options.timestep;
        this.maxTimestep   = Milliseconds.from(250);
        this.onUpdate      = options.onVariableUpdate;
        this.onFixedUpdate = options.onFixedUpdate;

        this.runFrame = this.runFrame.bind(this);
    }

    private runFrame(timestamp: number) {
        if (isNaN(this.lastUpdateTime)) {
            this.lastUpdateTime = timestamp - 16;
        }

        const delta  = Math.max(0, Math.min(timestamp - this.lastUpdateTime, this.maxTimestep));
        this.lastUpdateTime = timestamp;

        this.step(delta);
        this.nextFrameId = requestFrame(this.runFrame);
    }

    public step(delta: number) {
        this.accumulator += delta;
        this.totalTime += delta;

        while (this.accumulator >= this.timestep) {
            this.onFixedUpdate(this.timestep);
            this.accumulator -= this.timestep;
        }
        
        this.onUpdate(Milliseconds.from(delta), this.accumulator / this.timestep);
    }

    public start() {
        this.lastUpdateTime = NaN;
        this.accumulator    = 0;
        this.totalTime      = 0;
        this.nextFrameId    = requestFrame(this.runFrame);
    }

    public stop() {
        if (!isNaN(this.nextFrameId)) {
            cancelFrame(this.nextFrameId);
            this.nextFrameId = NaN;
            this.accumulator = 0;
            this.totalTime   = 0;
        }
    }

    public getTotalTime() {
        return this.totalTime;
    }
}