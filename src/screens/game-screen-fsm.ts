import { GameScreen } from './game-screen';

export class GameScreenFSM<TScreens extends { [key: string]: GameScreen }> {
    screens: TScreens;
    currentScreen: keyof TScreens | null;

    constructor(
        screens: TScreens
    ) {
        this.screens = screens;
        this.currentScreen = null;
    }

    async transitionTo(newScreen: keyof TScreens) {
        if (this.currentScreen != null) {
            await this.screens[this.currentScreen].stop();
        }
        this.currentScreen = newScreen;
        await this.screens[this.currentScreen].start();
    }
}