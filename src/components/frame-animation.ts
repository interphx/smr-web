import { Aabb } from 'types/aabb';
import { Milliseconds } from 'types/milliseconds';
import { hasProperty } from 'utils/object';
import { Vec2 } from 'types/vec2';

interface Frame {
    rect: Aabb;
    relativeDuration: number;
}

interface Animation {
    duration: Milliseconds;
    frames: ReadonlyArray<Frame>;
    mode: AnimationMode;
}

interface InitializedFrame extends Frame {
    relativeEndPosition: number;
}

interface InitializedAnimation extends Animation {
    relativeUnitsDuration: number;
    frames: ReadonlyArray<InitializedFrame>;
}

type AnimationMode = 'once' | 'repeat' | 'pingpong';

export class FrameAnimation {
    public static componentName = 'FrameAnimation';

    private animations: {[name: string]: InitializedAnimation};
    private currentAnimation: string | null;
    private position: number;
    private speed: number;

    constructor(options: {
        animations: {[name: string]: Animation},
        currentAnimation?: string,
        position?: number,
        speed?: number
    }) {
        this.animations = {};
        for (let name in options.animations) {
            if (!hasProperty(options.animations, name)) continue;
            const animation = options.animations[name];

            let relativePosition = 0;
            let frames: InitializedFrame[] = [];
            for (let frame of animation.frames) {
                frames.push({
                    ...frame,
                    relativeEndPosition: relativePosition + frame.relativeDuration
                });
                relativePosition += frame.relativeDuration;
            }
            frames.sort((a, b) => a.relativeEndPosition - b.relativeEndPosition);
            this.animations[name] = {
                ...animation,
                frames: frames,
                relativeUnitsDuration: relativePosition
            };
        }
        this.currentAnimation = options.currentAnimation || null;
        this.position = options.position || 0;
        this.speed = options.speed || 1;
    }

    advancePosition(amount: number) {
        if (!this.currentAnimation) return;

        amount *= this.speed;

        const mode = this.animations[this.currentAnimation].mode;

        if (mode === 'once') {
            this.position = Math.max(0, Math.min(1, this.position + amount));
        } else if (mode === 'pingpong') {
            this.position += (amount / 2);
            while (this.position > 1) {
                this.position = 2 - (this.position % 2);
            }
            if (this.position < 0) {
                this.position = (-this.position) % 1;
            }
        } else if (mode === 'repeat') {
            this.position += amount;
            if (this.position < 0) {
                this.position = 1 - ((-this.position) % 1);
            }
            this.position = this.position % 1;
        }

    }

    setPosition(position: number) {
        this.position = 0;
        this.advancePosition(position);
    }

    setSpeed(speed: number) {
        this.speed = Math.max(0.0001, speed);
    }

    playAnimation(name: string, position: number = 0) {
        this.currentAnimation = name;
        this.position = position;
    }

    playOrContinueAnimation(name: string) {
        if (this.currentAnimation !== name) {
            this.playAnimation(name);
        }
    }

    stopAnimation() {
        this.currentAnimation = null;
        this.position = 0;
    }

    getCurrentAnimation() {
        if (!this.currentAnimation) return null;
        return this.animations[this.currentAnimation];
    }

    getCurrentRect() {
        if (!this.currentAnimation) return null;

        const animation = this.animations[this.currentAnimation];
        const mode = animation.mode;

        if (mode === 'once') {
            const relativePosition = this.position * animation.relativeUnitsDuration;
            for (let frame of animation.frames) {
                if (relativePosition <= frame.relativeEndPosition) {
                    return frame.rect;
                }
            }
        } else if (mode === 'pingpong') {
            const position = (this.position <= 0.5) 
                ? (this.position * 2)
                : (2 - this.position * 2);
            const relativePosition = position * animation.relativeUnitsDuration;
            for (let frame of animation.frames) {
                if (relativePosition <= frame.relativeEndPosition) {
                    return frame.rect;
                }
            }
        } else if (mode === 'repeat') {
            const relativePosition = this.position * animation.relativeUnitsDuration;
            for (let frame of animation.frames) {
                if (relativePosition <= frame.relativeEndPosition) {
                    return frame.rect;
                }
            }
        }

        console.error(`Unreachable code executed!`);
        return null;
    }

    static generateSpritesheetFrames(frameSize: Vec2, dimensions: Vec2, sheetSize?: Vec2) {
        sheetSize = sheetSize || {
            x: Math.floor(dimensions.x / frameSize.x),
            y: Math.floor(dimensions.y / frameSize.y)
        };

        const count = sheetSize.x * sheetSize.y;

        let frames: Frame[] = [];
        for (let i = 0; i < count; ++i) {
            const left = (i % sheetSize.x) * frameSize.x;
            const top = Math.floor(i / sheetSize.x) * frameSize.y;

            const rect = Aabb.fromSize(left, top, frameSize.x, frameSize.y);

            frames.push({ rect, relativeDuration: 1 });
        }

        return frames as ReadonlyArray<Frame>;
    }
}