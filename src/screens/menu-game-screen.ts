import { GameScreen } from './game-screen';
import { Image } from 'types/image';
import { AssetLoader } from 'core/asset-loader';

type ScreenSetter = (screenName: 'gameplay') => void;

export class MenuGameScreen implements GameScreen {
    constructor(
        private setScreen: ScreenSetter,
        private imageLoader: AssetLoader<Image>,
        private container: Element
    ) {

    }

    async start(): Promise<void> {
        const backgroundImage = await this.imageLoader.get('assets/images/menu_background.png');

        const ids: Record<string, string> = {};
        const getId = (name: string) => {
            ids[name] = Math.random().toString().slice(2);
            return ids[name];
        };
        const get = (name: string) => document.getElementById(ids[name])!;
        const style = (styles: Record<string, string>) => Object
            .keys(styles)
            .map(key => `${key}: ${styles[key]}`)
            .join(';');

        this.container.innerHTML = `
            <div
                id="${getId('menu')}"
                style="${style({
                    'position': 'relative',
                    'width': '100%',
                    'height': '100%'
                })}"
            >
                <button id="${getId('button-play')}">Play</button>
                <button id="${getId('button-help')}">Help</button>
            </div>
        `.trim();

        const backgroundElement = document.createElement('canvas');
        backgroundElement.width = backgroundImage.width;
        backgroundElement.height = backgroundImage.height;
        backgroundElement.style.width = '100%';
        backgroundElement.style.height = '100%';
        backgroundElement.style.position = 'absolute';
        backgroundElement.style.left = '0';
        backgroundElement.style.top = '0';
        backgroundElement.style.zIndex = '-10';
        backgroundElement.getContext('2d')!.drawImage(backgroundImage, 0, 0);

        get('menu').appendChild(backgroundElement);

        get('button-play').addEventListener('click', () => {
            this.setScreen('gameplay');
        });
    }
    
    async stop(): Promise<void> {
        this.container.innerHTML = '';
    }
}