import { Transform } from 'components/transform';
import { Camera } from 'components/camera';
import { Milliseconds } from 'types/milliseconds';
import { EntityStorage } from 'core/entity-storage';
import { Character } from 'components/character';
import { Body } from 'components/body';
import { Collider } from 'components/collider';
import { Collectible } from 'components/collectible';
import { Text } from 'components/text';
import { FloatingText } from 'components/floating-text';
import { all } from 'core/aspect';

const characterAspect = all(Collider, Body, Character);
const floatingTextAspect = all(Transform, Text, FloatingText);

export class ScoringSystem {
    constructor(
        private storage: EntityStorage
    ) {

    }

    run(dt: Milliseconds) {
        const { storage } = this;

        const characters = storage.getByAspect(characterAspect);

        for (let { components: [collider, body, data] } of characters) {
            if (!data.isAlive()) continue;
            
            data.addScore(dt * 0.01 * Math.max(0, body.velocity.x));

            for (let collidingEntity of collider.collidingEntities) {
                const collidingCollectible = storage.getComponent(collidingEntity, Collectible);
                const collidingTransform = storage.getComponent(collidingEntity, Transform);
                if (collidingCollectible && collidingTransform) {
                    data.addScore(collidingCollectible.score);
                    storage.removeEntity(collidingEntity);

                    const text = storage.createEntity();
                    storage.setComponent(text, new Transform(collidingTransform.position));
                    storage.setComponent(text, new Text({ text: '+10', size: 16 }));
                    storage.setComponent(text, new FloatingText());
                }
            }
        }

        for (let { entity: floatingText, components: [transform, text, ] } of storage.getByAspect(floatingTextAspect)) {
            transform.moveBy(0, -0.07 * dt);
            text.opacity -= 0.001 * dt;
            if (text.opacity <= 0) {
                storage.removeEntity(floatingText);
            }
        }
    }
}