import { Transform } from 'components/transform';
import { StaticSprite } from 'components/static-sprite';
import { Camera } from 'components/camera';
import { Renderer } from 'core/renderer';
import { Milliseconds } from 'types/milliseconds';
import { EntityStorage } from 'core/entity-storage';
import { Vec2 } from 'types/vec2';
import { lerp } from 'utils/math';
import { Character } from 'components/character';
import { Aabb } from 'types/aabb';
import { loadImage } from 'utils/ajax';
import { Image } from 'types/image';
import { Text } from 'components/text';

const spriteComponents: [typeof Transform, typeof StaticSprite] = [Transform, StaticSprite];

const textComponents: [typeof Transform, typeof Text] = [Transform, Text];

const cameraComponents: [typeof Transform, typeof Camera] = [Transform, Camera];

const characterComponents: [typeof Character] = [Character];

const heartFullRect = Aabb.fromSize(0, 0, 32, 28);
const heartEmptyRect = Aabb.fromSize(32, 0, 32, 28);
const tmpHeartPos = Vec2.fromCartesian(0, 0);

export class RenderingSystem {
    private tmpPosition: Vec2 = { x: 0, y: 0 };
    private textures: {
        heart: Image;
    } | null = null;

    constructor(
        private storage: EntityStorage,
        private renderer: Renderer
    ) {
        this.initialize();
    }

    public async waitForInitialization() {
        return new Promise(resolve => {
            const interval = setInterval(() => {
                if (this.textures) {
                    clearInterval(interval);
                    resolve();
                }
            }, 400);
        });
    }

    async initialize() {
        const heart = await loadImage('assets/images/heart.png');
        this.textures = { heart };
    }

    run(dt: Milliseconds, alpha: number) {
        const { storage, renderer } = this;

        renderer.clear();

        const cameras = storage.getEntitiesWith(cameraComponents);
        const sprites = storage.getEntitiesWith(spriteComponents);
        const texts   = storage.getEntitiesWith(textComponents);

        sprites.sort((a, b) => {
            const spriteA = storage.getComponent(a, StaticSprite);
            const spriteB = storage.getComponent(b, StaticSprite);
            return spriteA.zIndex - spriteB.zIndex;
        })

        for (let camera of cameras) {
            const [cameraTransform, cameraData] = storage.getComponents(camera, cameraComponents);
            
            const cameraPosX = cameraTransform.getInterpolatedX(alpha);
            const cameraPosY = cameraTransform.getInterpolatedY(alpha);

            for (let entity of sprites) {
                const [transform, sprite] = storage.getComponents(entity, spriteComponents);

                const pos = this.tmpPosition;
                pos.x = transform.getInterpolatedX(alpha) - (sprite.targetSize.x / 2) - cameraPosX;
                pos.y = transform.getInterpolatedY(alpha) - (sprite.targetSize.y / 2) - cameraPosY;

                if (sprite.isGhost && Math.random() < 0.5) continue;
                renderer.drawImageRect(pos, sprite.sourceRect, sprite.targetSize, sprite.texture);
            }

            for (let entity of texts) {
                const [transform, text] = storage.getComponents(entity, textComponents);
                const pos = this.tmpPosition;
                pos.x = transform.getInterpolatedX(alpha) - cameraPosX;
                pos.y = transform.getInterpolatedY(alpha) - cameraPosY;

                renderer.drawTextWithOpacity(pos.x, pos.y, text.text, text.opacity);
            }
        }

        const characters = this.storage.getEntitiesWith(characterComponents);
        if (characters.length > 0) {
            const characterData = this.storage.getComponent(characters[0], Character);
            renderer.drawText(0, -200, characterData.score.toFixed(0));

            if (this.textures) {
                for (let i = 0; i < characterData.maxLives; ++i) {
                    const rect = ((i + 1) <= characterData.remainingLives)
                        ? heartFullRect
                        : heartEmptyRect;
                    tmpHeartPos.x = -320 + 30 + i * (32 + 8);
                    tmpHeartPos.y = -240 + 40;
                    renderer.drawImageRect(tmpHeartPos, rect, rect.size, this.textures.heart);
                }
            }
        }

    }
}