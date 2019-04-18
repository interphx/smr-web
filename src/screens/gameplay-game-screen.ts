import { GameScreen } from './game-screen';

type ScreenSetter = (screenName: 'menu') => void;

export class GameplayGameScreen implements GameScreen {
    constructor(private setScreen: ScreenSetter) {

    }

    start(): Promise<void> {
        throw new Error('Method not implemented.');
    }
    
    stop(): Promise<void> {
        throw new Error('Method not implemented.');
    }
}