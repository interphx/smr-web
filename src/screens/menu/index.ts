import { GameScreen } from 'screens/game-screen';
import { Image } from 'types/image';
import { AssetLoader } from 'core/asset-loader';

import * as styles from './styles.module.css';

type ScreenSetter = (screenName: 'gameplay') => void;

export class MenuGameScreen implements GameScreen {
    constructor(
        private setScreen: ScreenSetter,
        private imageLoader: AssetLoader<Image>,
        private container: Element
    ) {

    }

    async start(): Promise<void> {
        const ids: Record<string, string> = {};
        const getId = (name: string) => {
            ids[name] = Math.random().toString(32).slice(2);
            return ids[name];
        };
        const get = (name: string) => document.getElementById(ids[name])!;

        this.container.innerHTML = `
            <div class="${styles.menu}">
                <div class="${styles.items}">
                    <button id="${getId('button-play')}" class="${styles.button}">Play</button>
                    <button id="${getId('button-help')}" class="${styles.button}">Help</button>
                </div>
            </div>
        `.trim();

        get('button-play').addEventListener('click', () => {
            this.setScreen('gameplay');
        });
    }
    
    async stop(): Promise<void> {
        this.container.innerHTML = '';
    }
}