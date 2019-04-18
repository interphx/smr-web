import { Transform } from 'components/transform';
import { StaticSprite } from 'components/static-sprite';
import { Camera } from 'components/camera';
import { Renderer } from 'core/renderer';
import { Milliseconds } from 'types/milliseconds';
import { EntityStorage } from 'core/entity-storage';
import { Vec2 } from 'types/vec2';
import { Character } from 'components/character';
import { Aabb } from 'types/aabb';
import { loadImage } from 'utils/ajax';
import { Image } from 'types/image';
import { Text } from 'components/text';
import * as aspect from 'core/aspect';
import { TrackedEntity } from 'core/tracking-table';
import { copyArray } from 'utils/iterable';
import { ImageAssetLoader } from 'core/image-asset-loader';

const spriteAspect = aspect.all(Transform, StaticSprite);
const textAspect = aspect.all(Transform, Text);
const cameraAspect = aspect.all(Transform, Camera);
const characterAspect = aspect.all(Character);

const heartFullRect = Aabb.fromSize(0, 0, 32, 28);
const heartEmptyRect = Aabb.fromSize(32, 0, 32, 28);

const tmpSpritesArray: TrackedEntity<[Transform, StaticSprite]>[] = [];

function compareSprites(a: {components:[unknown, {zIndex: number}]}, b: {components:[unknown, {zIndex: number}]}) {
    return a.components[1].zIndex - b.components[1].zIndex;
}

export class RenderingSystem {
    private textures: {
        heart: Image;
    } | null = null;

    constructor(
        private storage: EntityStorage,
        private renderer: Renderer,
        private imageLoader: ImageAssetLoader
    ) {
    }

    async initialize() {
        const heart = await this.imageLoader.get('assets/images/heart.png');
        this.textures = { heart };
    }

    private lastFps: number = 60;
    run(dt: Milliseconds, alpha: number) {
        const { storage, renderer } = this;

        renderer.clear();

        const cameras    = storage.getByAspect(cameraAspect);
        const sprites    = copyArray(storage.getByAspect(spriteAspect), tmpSpritesArray);
        const texts      = storage.getByAspect(textAspect);
        const characters = storage.getByAspect(characterAspect);

        sprites.sort(compareSprites);

        for (let { components: [cameraTransform, cameraData] } of cameras) {
            const cameraPosX = cameraTransform.getInterpolatedX(alpha);
            const cameraPosY = cameraTransform.getInterpolatedY(alpha);

            const cameraHalfWidth = cameraData.size.x / 2;
            const cameraHalfHeight = cameraData.size.y / 2;

            const cameraLeft = cameraTransform.position.x - cameraHalfWidth;
            const cameraTop = cameraTransform.position.y - cameraHalfHeight;
            const cameraRight = cameraTransform.position.x + cameraHalfWidth;
            const cameraBottom = cameraTransform.position.y + cameraHalfHeight;

            for (let { components: [transform, sprite] } of sprites) {
                const spriteHalfWidth = sprite.targetSize.x / 2;
                const spriteHalfHeight = sprite.targetSize.y / 2;

                const spriteX = transform.getInterpolatedX(alpha);
                const spriteY = transform.getInterpolatedY(alpha);

                const posX = spriteX - spriteHalfWidth - cameraPosX / sprite.parallaxDepth;
                const posY = spriteY - spriteHalfHeight - cameraPosY;

                const left = spriteX - spriteHalfWidth;
                const top = spriteY - spriteHalfHeight;
                const right = spriteX + spriteHalfWidth;
                const bottom = spriteY + spriteHalfHeight;

                if (
                    left * sprite.parallaxDepth > cameraRight + cameraHalfWidth * sprite.parallaxDepth || 
                    top > cameraBottom || 
                    right * sprite.parallaxDepth < cameraLeft - cameraHalfWidth * sprite.parallaxDepth || 
                    bottom < cameraTop
                ) {
                    continue;
                }

                if (sprite.isGhost && Math.random() < 0.5) continue;
                renderer.drawImageRect(posX, posY, sprite.sourceRect, sprite.targetSize, sprite.texture);
            }

            for (let { components: [transform, text] } of texts) {
                const posX = transform.getInterpolatedX(alpha) - cameraPosX;
                const posY = transform.getInterpolatedY(alpha) - cameraPosY;

                renderer.drawTextWithOpacity(posX, posY, text.text, text.opacity);
            }
        }

        if (characters.length > 0) {
            const [characterData] = characters[0].components;
            renderer.drawText(0, -200, characterData.score.toFixed(0));

            if (this.textures) {
                for (let i = 0; i < characterData.maxLives; ++i) {
                    const rect = ((i + 1) <= characterData.remainingLives)
                        ? heartFullRect
                        : heartEmptyRect;
                    renderer.drawImageRect(
                        -320 + 30 + i * (32 + 8), 
                        -240 + 40, 
                        rect, 
                        rect.size, 
                        this.textures.heart
                    );
                }
            }
        }

        this.lastFps = this.lastFps * 0.9 + (1000 / dt) * 0.1;
        renderer.drawText(0, -100, this.lastFps.toFixed(0));
    }
}