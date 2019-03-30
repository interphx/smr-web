import { EntityStorage } from 'core/entity-storage';
import { KeyboardInput } from 'input/keyboard';
import { Transform } from 'components/transform';
import { Jump } from 'components/jump';
import { Body } from 'components/body';
import { getTime } from 'utils/time';
import { PointerInput } from 'input/pointer';
import { FrameAnimation } from 'components/frame-animation';
import { all } from 'core/aspect';

const jumpableAspect = all(Body, Jump, FrameAnimation);

export class JumpingSystem {
    constructor(
        private storage: EntityStorage,
        private keyboard: KeyboardInput,
        private pointer: PointerInput
    ) {

    }

    run(dt: number) {
        const jumpables = this.storage.getByAspect(jumpableAspect);

        const jumpPressed = this.keyboard.isDown('W') || this.pointer.isPointerDown();
        const time = getTime();

        for (let { components: [body, jump, animation] } of jumpables) {
            if (jump.isJumpHeld && (time - jump.jumpStartTime < jump.maxTime * 0.1)) {
                body.velocity.y = -jump.speed * 1.5;
            } else if (jump.isJumpHeld && (time - jump.jumpStartTime < jump.maxTime * 0.65)) {
                body.velocity.y = -jump.speed;
            } else if (jump.isJumpHeld && (time - jump.jumpStartTime < jump.maxTime)) {
                body.velocity.y = -jump.speed * 0.5;
            } else {
                body.velocity.y = Math.max(0.1, body.velocity.y);
            }

            if (jumpPressed) {
                if (body.isLanded && !jump.isJumpHeld) {
                    jump.startJumping();
                    animation.playAnimation('jump');
                }
            } else {
                jump.stopJumping();

                if (body.isLanded && animation.getCurrentAnimation()) {
                    animation.playOrContinueAnimation('run');
                }
            }
        }
    }
}