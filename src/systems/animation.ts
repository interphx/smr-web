import { EntityStorage } from 'core/entity-storage';
import { Milliseconds } from 'types/milliseconds';
import { StaticSprite } from 'components/static-sprite';
import { FrameAnimation } from 'components/frame-animation';
import { all } from 'core/aspect';

const animatableAspect = all(FrameAnimation, StaticSprite);

export class AnimationSystem {
    constructor(private storage: EntityStorage) {}

    run(dt: Milliseconds) {
        const animatables = this.storage.getByAspect(animatableAspect);

        for (let { components: [animation, sprite] } of animatables) {
            const clip = animation.getCurrentAnimation();

            if (clip) {
                animation.advancePosition(dt / clip.duration);
                const rect = animation.getCurrentRect();
                if (rect) {
                    sprite.sourceRect = rect;
                } else {
                    console.log(`Clip without rect`);
                }
            } else {
                console.log(`No clip`);
            }
        }
    }
}