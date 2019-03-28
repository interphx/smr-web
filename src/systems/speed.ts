import { EntityStorage } from 'core/entity-storage';
import { Milliseconds } from 'types/milliseconds';
import { Body } from 'components/body';
import { FrameAnimation } from 'components/frame-animation';

const characterComponents: [
    typeof Body,
    typeof FrameAnimation
] = [Body, FrameAnimation];

export class SpeedSystem {
    constructor(private storage: EntityStorage) {

    }

    run(dt: Milliseconds) {
        const characters = this.storage.getEntitiesWith(characterComponents);

        for (let character of characters) {
            const [body, animation] = this.storage.getComponents(character, characterComponents);

            body.velocity.x += 0.0000001 / Math.max(0.001, body.velocity.x) * dt;

            animation.setSpeed(1 + body.velocity.x * 2);
        }
    }
}