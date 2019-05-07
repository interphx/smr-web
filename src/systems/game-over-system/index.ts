import * as styles from './styles.module.css';
import { EventQueue } from 'core/event-queue';
import { GameOverEvent } from 'events/game-over';
import { EntityStorage } from 'core/entity-storage';
import { all } from 'core/aspect';
import { Character } from 'components/character';
import { FrameAnimation } from 'components/frame-animation';
import { Jump } from 'components/jump';

const characterAspect = all(Character, FrameAnimation);

export class GameOverSystem {
    private gameOverMenuElement: HTMLDivElement;

    constructor(
        private storage: EntityStorage,
        private eventQueue: EventQueue,
        private container: Node,
        private retry: () => void,
        private exitToMenu: () => void
    ) {
        this.gameOverMenuElement = document.createElement('div');
        this.gameOverMenuElement.className = styles.gameOverMenu;
        this.gameOverMenuElement.style.visibility = 'hidden';

        this.gameOverMenuElement.innerHTML = `
            <div data-value="score" class="${styles.score}">Score: 00000</div>
            <div class="${styles.options}">
                <button data-action="retry" class="${styles.button}">Retry</button>
                <button data-action="exit" class="${styles.button}">Exit</button>
            </div>
        `;
    }

    private handleGameOver(event: GameOverEvent) {
        const characters = this.storage.getByAspect(characterAspect);
        for (let { components: [character, animation], entity } of characters) {
            this.storage.removeComponent(entity, Jump);
            animation.playAnimation('fall');
        }

        this.gameOverMenuElement.querySelector('[data-value="score"]')!.textContent = `Score: ${Math.round(event.score)}`;
        this.gameOverMenuElement.style.visibility = 'visible';
    }

    public async initialize() {
        this.eventQueue.subscribe(GameOverEvent, this.handleGameOver.bind(this));
        this.container.appendChild(this.gameOverMenuElement);

        const retryElement = this.gameOverMenuElement.querySelector('[data-action="retry"]')!;
        const exitElement = this.gameOverMenuElement.querySelector('[data-action="exit"]')!;

        const rect = this.gameOverMenuElement.getBoundingClientRect();
        const fontSize = `${Math.round(rect.height / 12)}px`;
        this.gameOverMenuElement.style.fontSize = fontSize;

        retryElement.addEventListener('click', event => {
            this.gameOverMenuElement.style.visibility = 'hidden';
            this.retry();
        });

        exitElement.addEventListener('click', event => {
            this.exitToMenu();
        });
    }
}