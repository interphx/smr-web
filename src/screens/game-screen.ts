export interface GameScreen {
    start(): Promise<void>;
    stop(): Promise<void>;
}