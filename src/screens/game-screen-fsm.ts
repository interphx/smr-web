import { GameScreen } from './game-screen';

export class GameScreenFSM<TScreens extends { [key: string]: GameScreen }> {
    screens: TScreens;
    currentScreen: keyof TScreens;

    constructor(
        screens: TScreens,
        currentScreen: keyof TScreens
    ) {
        this.screens = screens;
        this.currentScreen = currentScreen;
    }

    async transitionTo(newScreen: keyof TScreens) {
        await this.screens[this.currentScreen].stop();
        this.currentScreen = newScreen;
        await this.screens[this.currentScreen].start();
    }
}