import { Transform } from 'components/transform';
import { Camera } from 'components/camera';
import { Milliseconds } from 'types/milliseconds';
import { EntityStorage } from 'core/entity-storage';
import { Character } from 'components/character';
import { Lives } from 'components/lives';
import { Body } from 'components/body';
import { Collider } from 'components/collider';
import { Collectible } from 'components/collectible';

const characterComponents: [
    typeof Collider,
    typeof Lives,
    typeof Body,
    typeof Character
] = [Collider, Lives, Body, Character];

export class ScoringSystem {
    constructor(
        private storage: EntityStorage
    ) {

    }

    run(dt: Milliseconds) {
        const { storage } = this;

        const characters = storage.getEntitiesWith(characterComponents);

        for (let character of characters) {
            const [collider, lives, body, data] = storage.getComponents(character, characterComponents);

            if (!lives.isAlive()) continue;
            
            data.addScore(dt * 0.01 * Math.max(0, body.velocity.x));

            for (let collidingEntity of collider.collidingEntities) {
                const collidingCollectible = storage.getComponent(collidingEntity, Collectible);
                if (collidingCollectible) {
                    data.addScore(collidingCollectible.score);
                    storage.removeEntity(collidingEntity);
                }
            }
        }
    }
}