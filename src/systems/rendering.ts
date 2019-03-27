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

const spriteComponents: [typeof Transform, typeof StaticSprite] = [Transform, StaticSprite];

const cameraComponents: [typeof Transform, typeof Camera] = [Transform, Camera];

const characterComponents: [typeof Character] = [Character];

export class RenderingSystem {
    private tmpPosition: Vec2 = { x: 0, y: 0 };

    constructor(
        private storage: EntityStorage,
        private renderer: Renderer
    ) {

    }

    run(dt: Milliseconds, alpha: number) {
        const { storage, renderer } = this;

        renderer.clear();

        const cameras = storage.getEntitiesWith(cameraComponents);
        const sprites = storage.getEntitiesWith(spriteComponents);

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
        }

        const characters = this.storage.getEntitiesWith(characterComponents);
        if (characters.length > 0) {
            const characterData = this.storage.getComponent(characters[0], Character);
            renderer.drawText(0, -200, characterData.score.toFixed(0));
        }

    }
}