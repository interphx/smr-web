import { EntityStorage } from 'core/entity-storage';
import { Body } from 'components/body';
import { Transform } from 'components/transform';

const bodyComponents: [typeof Transform, typeof Body] = [Transform, Body];

const g = 0.002;

export class PhysicsSystem {
    constructor(
        private storage: EntityStorage
    ) {

    }

    public run(dt: number) {
        const bodies = this.storage.getEntitiesWith(bodyComponents);

        for (let body of bodies) {
            const [transform, bodyData] = this.storage.getComponents(body, bodyComponents);
            if (bodyData.isAffectedByGravity) {
                bodyData.velocity.y += g * dt;
            }

            if (bodyData.velocity.y > 10) {
                bodyData.velocity.y = 10;
            }

            transform.moveBy(bodyData.velocity.x * dt, bodyData.velocity.y * dt);
        }
    }
}