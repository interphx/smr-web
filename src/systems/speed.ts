import { EntityStorage } from 'core/entity-storage';
import { Milliseconds } from 'types/milliseconds';
import { Body } from 'components/body';
import { FrameAnimation } from 'components/frame-animation';
import { all } from 'core/aspect';
import { Character } from 'components/character';

const characterAspect = all(Character, Body, FrameAnimation);

export class SpeedSystem {
    constructor(private storage: EntityStorage) {

    }

    run(dt: Milliseconds) {
        const characters = this.storage.getByAspect(characterAspect);

        for (let { components: [character, body, animation] } of characters) {
            if (character.isAlive()) {
                body.velocity.x += 0.0000001 / Math.max(0.001, body.velocity.x) * dt;
            } else {
                body.velocity.x *= 0.98;
            }

            animation.setSpeed(body.velocity.x * 5);
        }
    }
}