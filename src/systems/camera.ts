import { Transform } from 'components/transform';
import { StaticSprite } from 'components/static-sprite';
import { Camera } from 'components/camera';
import { Renderer } from 'core/renderer';
import { Milliseconds } from 'types/milliseconds';
import { EntityStorage } from 'core/entity-storage';
import { Vec2 } from 'types/vec2';
import { all } from 'core/aspect';

const cameraAspect = all(Transform, Camera);

export class CameraSystem {
    constructor(
        private storage: EntityStorage
    ) {

    }

    run(_dt: Milliseconds) {
        const { storage } = this;

        const cameras = storage.getByAspect(cameraAspect);

        for (let { components: [cameraTransform, cameraData] } of cameras) {
            if (cameraData.targetEntityId) {
                const targetTransform = storage.getComponent(cameraData.targetEntityId, Transform);

                if (targetTransform) {
                    cameraTransform.moveTo(
                        targetTransform.position.x + 200,
                        -240
                    );
                }
            }
        }

    }
}