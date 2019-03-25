import { EntityStorage } from 'core/entity-storage';
import { Milliseconds } from 'types/milliseconds';
import { StaticSprite } from 'components/static-sprite';
import { FrameAnimation } from 'components/frame-animation';

const animatableComponents: [typeof FrameAnimation, typeof StaticSprite] = [FrameAnimation, StaticSprite];

export class AnimationSystem {
    constructor(private storage: EntityStorage) {}

    run(dt: Milliseconds) {
        const animatables = this.storage.getEntitiesWith(animatableComponents);

        for (let animatable of animatables) {
            const [animation, sprite] = this.storage.getComponents(animatable, animatableComponents);

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