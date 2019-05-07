export class GameOverEvent {
    public static readonly eventName = 'GameOverEvent' as const;

    constructor(
        public readonly score: number
    ) {

    }
}