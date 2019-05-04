import { EntityStorage } from 'core/entity-storage';
import { Milliseconds } from 'types/milliseconds';
import { Body } from 'components/body';
import { FrameAnimation } from 'components/frame-animation';
import { all } from 'core/aspect';
import { Character } from 'components/character';
import { Transform } from 'components/transform';

const characterAspect = all(Character, Transform, Body, FrameAnimation);

export class SpeedSystem {
    constructor(
        private storage: EntityStorage,
        private floorY: number
    ) {

    }

    run(dt: Milliseconds) {
        const characters = this.storage.getByAspect(characterAspect);

        for (let { components: [character, transform, body, animation] } of characters) {
            if (character.isAlive()) {
                body.velocity.x += 0.0000003 / Math.max(0.001, body.velocity.x) * dt;
            } else {
                body.velocity.x *= 0.98;
            }

            if (transform.position.y > this.floorY) {
                transform.position.y = this.floorY;
            }

            animation.setSpeed(body.velocity.x * 6);
        }
    }
}