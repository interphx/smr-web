import { Transform } from 'components/transform';
import { StaticSprite } from 'components/static-sprite';
import { Camera } from 'components/camera';
import { Renderer } from 'core/renderer';
import { Milliseconds } from 'types/milliseconds';
import { EntityStorage } from 'core/entity-storage';
import { Vec2 } from 'types/vec2';

const cameraComponents: [typeof Transform, typeof Camera] = [Transform, Camera];

export class CameraSystem {
    constructor(
        private storage: EntityStorage
    ) {

    }

    run(_dt: Milliseconds) {
        const { storage } = this;

        const cameras = storage.getEntitiesWith(cameraComponents);

        for (let camera of cameras) {
            const [cameraTransform, cameraData] = storage.getComponents(camera, cameraComponents);

            if (cameraData.targetEntityId) {
                const targetTransform = storage.getComponent(cameraData.targetEntityId, Transform);

                if (targetTransform) {
                    cameraTransform.moveTo(
                        targetTransform.position.x + 200,
                        //targetTransform.position.y
                        -240
                    );
                }
            }
        }

    }
}