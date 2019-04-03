import { EntityStorage } from 'core/entity-storage';
import { Milliseconds } from 'types/milliseconds';
import { Body } from 'components/body';
import { FrameAnimation } from 'components/frame-animation';
import { all } from 'core/aspect';

const characterAspect = all(Body, FrameAnimation);

export class SpeedSystem {
    constructor(private storage: EntityStorage) {

    }

    run(dt: Milliseconds) {
        const characters = this.storage.getByAspect(characterAspect);

        for (let { components: [body, animation] } of characters) {
            body.velocity.x += 0.0000001 / Math.max(0.001, body.velocity.x) * dt;

            animation.setSpeed(1 + body.velocity.x * 2);
        }
    }
}