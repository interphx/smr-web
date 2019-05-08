import { all } from 'core/aspect';
import { Character } from 'components/character';
import { Transform } from 'components/transform';
import { Collectible } from 'components/collectible';
import { FrameAnimation } from 'components/frame-animation';
import { EntityStorage } from 'core/entity-storage';
import { KeyboardInput } from 'input/keyboard';
import { Camera } from 'components/camera';

const characterAspect = all(Character, Transform);
const amplifierAspect = all(Collectible, Transform, FrameAnimation);
const cameraAspect = all(Camera, Transform);

export class BonusSystem {
    constructor(
        private storage: EntityStorage,
        private keyboard: KeyboardInput
    ) {

    }

    run(dt: number) {
        if (this.keyboard.isDown('E')) {
            const characters = this.storage.getByAspect(characterAspect);
            for (let { components: [character, characterTransform] } of characters) {
                if (!character.isAlive()) { continue; }
                if (character.bonusReadiness < 100) { continue; }

                const camera = this.storage.getByAspect(cameraAspect)[0];
                const { components: [cameraData, cameraTransform] } = camera;

                character.useBonus();
                const amplifiers = this.storage.getByAspect(amplifierAspect);

                for (let { entity, components: [amplifier, amplifierTransform, amplifierAnimation] } of amplifiers) {
                    if (Math.abs(amplifierTransform.position.x - cameraTransform.position.x) > 340) { continue; }
                    character.addScore(amplifier.score * 3);
                    this.storage.removeEntity(entity);
                }
            }
        }
    }
}