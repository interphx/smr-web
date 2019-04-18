import { GameScreen } from './game-screen';

export class MenuGameScreen implements GameScreen {
    start(): Promise<void> {
        throw new Error('Method not implemented.');
    }
    
    stop(): Promise<void> {
        throw new Error('Method not implemented.');
    }
}