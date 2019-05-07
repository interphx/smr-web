import { EntityStorage } from 'core/entity-storage';
import { Milliseconds } from 'types/milliseconds';
import { Body } from 'components/body';
import { Collider, CollisionLayer } from 'components/collider';
import { Character } from 'components/character';
import { StaticSprite } from 'components/static-sprite';
import { all } from 'core/aspect';
import { EventQueue } from 'core/event-queue';
import { GameOverEvent } from 'events/game-over';

const characterAspect = all(Body, Collider, Character, StaticSprite);

export class DamageSystem {
    private oldVelocity: number = NaN;
    private oldGhostState: boolean = false;

    constructor(
        private storage: EntityStorage,
        private eventQueue: EventQueue
    ) {

    }

    run(dt: Milliseconds) {
        const characters = this.storage.getByAspect(characterAspect);

        for (let { components: [body, collider, characterData, sprite] } of characters) {
            characterData.tickGhost(dt);
            if (this.oldGhostState && !characterData.isGhost()) {
                collider.collidesWith |= CollisionLayer.Obstacle;
                sprite.isGhost = false;
            }

            if (!this.oldGhostState && !characterData.isGhost() && !isNaN(this.oldVelocity) && this.oldVelocity > body.velocity.x) {
                characterData.subtract();

                characterData.makeGhost(characterData.isAlive() ? 1500 : Infinity);
                collider.collidesWith &= ~CollisionLayer.Obstacle;
                sprite.isGhost = true;
                body.velocity.x = 0.25;
                if (characterData.remainingLives <= 0) {
                    sprite.isGhost = false;
                    this.eventQueue.dispatch(new GameOverEvent(characterData.score));
                }
            }

            this.oldVelocity = body.velocity.x;
            this.oldGhostState = characterData.isGhost();
        }
    }
}