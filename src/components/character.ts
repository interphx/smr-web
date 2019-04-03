export class Character {
    public static componentName = 'Character';

    public score: number = 0;
    public ghostTime: number = 0;
    public maxLives: number = 3;
    public remainingLives: number = 3;

    constructor(lives: number) {
        this.maxLives = lives;
        this.remainingLives = lives;
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

    subtract() {
        if (this.remainingLives > 0) {
            this.remainingLives -= 1;
        }
    }

    isAlive() {
        return this.remainingLives > 0;
    }
}