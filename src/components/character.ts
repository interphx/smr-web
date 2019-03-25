export class Character {
    public static componentName = 'Character';

    public score: number = 0;
    public ghostTime: number = 0;

    constructor() {

    }

    addScore(amount: number) {
        this.score += amount;
    }

    makeGhost(time: number) {
        this.ghostTime = time;
    }

    tickGhost(dt: number) {
        this.ghostTime -= dt;
        this.ghostTime = Math.max(0, this.ghostTime);
    }

    isGhost() {
        return this.ghostTime > 0;
    }
}