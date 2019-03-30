import { EntityStorage } from 'core/entity-storage';
import { Milliseconds } from 'types/milliseconds';
import { Body } from 'components/body';
import { Collider, CollisionLayer } from 'components/collider';
import { Character } from 'components/character';
import { StaticSprite } from 'components/static-sprite';
import { all } from 'core/aspect';

const characterAspect = all(Body, Collider, Character, StaticSprite);

export class DamageSystem {
    private oldVelocity: number = NaN;
    private oldGhostState: boolean = false;

    constructor(private storage: EntityStorage) {

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
                if (characterData.remainingLives <= 0) {
                    throw new Error(`Game over`);
                }
                characterData.makeGhost(1500);
                collider.collidesWith &= ~CollisionLayer.Obstacle;
                sprite.isGhost = true;
                body.velocity.x = 0.2;
            }

            this.oldVelocity = body.velocity.x;
            this.oldGhostState = characterData.isGhost();

            body.velocity.x += 0.0000001 / body.velocity.x * dt;
        }
    }
}