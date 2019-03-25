export class Lives {
    public static componentName = 'Lives';

    public maxLives: number = 3;
    public remainingLives: number = 3;

    subtract() {
        if (this.remainingLives > 0) {
            this.remainingLives -= 1;
        }
    }

    isAlive() {
        return this.remainingLives > 0;
    }
}