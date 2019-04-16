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
import { EntityPool } from 'core/entity-pool';
import { Vec2 } from 'types/vec2';

const characterAspect = all(Collider, Body, Character);
const floatingTextAspect = all(Transform, Text, FloatingText);

export class ScoringSystem {
    private floatingTextPool = new EntityPool();

    constructor(
        private storage: EntityStorage,
        private onAmplifierRemove: (entity: string) => void
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
                    this.onAmplifierRemove(collidingEntity);

                    const existingText = this.floatingTextPool.getEntity();
                    if (existingText) {
                        const transform = storage.getComponent(existingText, Transform);
                        const text = storage.getComponent(existingText, Text);
                        transform.teleportTo(collidingTransform.position.x, collidingTransform.position.y - 10);
                        text.opacity = 1;
                    } else {
                        const text = storage.createEntity();
                        this.floatingTextPool.addUsedEntity(text);
                        storage.setComponent(text, new Transform(Vec2.clone(collidingTransform.position)));
                        storage.setComponent(text, new Text({ text: '+10', size: 16 }));
                        storage.setComponent(text, new FloatingText());
                    }
                }
            }
        }

        for (let { entity: floatingText, components: [transform, text, ] } of storage.getByAspect(floatingTextAspect)) {
            if (this.floatingTextPool.isFree(floatingText)) continue;

            transform.moveBy(0, -0.07 * dt);
            text.opacity -= 0.001 * dt;
            if (text.opacity <= 0) {
                this.floatingTextPool.freeEntity(floatingText);
            }
        }
    }
}