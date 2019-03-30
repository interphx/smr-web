import { EntityStorage } from 'core/entity-storage';
import { Character } from 'components/character';
import { Transform } from 'components/transform';
import { Despawnable } from 'components/despawnable';
import { Collider, ColliderType, CollisionLayer } from 'components/collider';
import { Aabb } from 'types/aabb';
import { loadImage } from 'utils/ajax';
import { StaticSprite } from 'components/static-sprite';
import { range, randomPick } from 'utils/iterable';
import { Vec2 } from 'types/vec2';
import { Image } from 'types/image';
import { Collectible } from 'components/collectible';
import { FrameAnimation } from 'components/frame-animation';
import { Milliseconds } from 'types/milliseconds';
import { Body } from 'components/body';

const characterComponents: [typeof Transform, typeof Character] = [Transform, Character];
const despawnableComponents: [typeof Transform, typeof Despawnable] = [Transform, Despawnable];

const SPAWN_DISTANCE = 1000;
const DESPAWN_DISTANCE = 1000;
const BG_MOVEMENT_SPEED = 0.1;
const amplifierRotateFrames = FrameAnimation.generateSpritesheetFrames(
    Vec2.fromCartesian(44, 32),
    Vec2.fromCartesian(352, 32)
);

const gap = 600;
const boxHalf = 28;
const boxFull = 56;
const ampFull = 44;

export class WorldGenerationSystem {
    // Rightmost edges
    private farthestPlatformX: number = -400;
    private farthestForegroundX: number = -400;
    private farthestBackgroundX: number = -400;
    private farthestChallengeX: number = 0;

    private textures: {
        platform: Image,
        amplifier: Image,
        box: Image,
        backgroundBuildings: ReadonlyArray<Image>,
        foregroundBuildings: ReadonlyArray<Image>
    } | null = null;

    constructor(private storage: EntityStorage) {
        this.removeEntity = this.removeEntity.bind(this);
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
        const platform = await loadImage('assets/images/platform.png');
        const amplifier = await loadImage('assets/images/amplifier.png');
        const box = await loadImage('assets/images/box.png');
        const backgroundBuildings = await Promise.all(range(0, 7).map(n => loadImage(`assets/images/background_building_${n}.png`)));
        const foregroundBuildings = await Promise.all(range(0, 7).map(n => loadImage(`assets/images/foreground_building_${n}.png`)));
        this.textures = {
            platform,
            amplifier,
            box,
            backgroundBuildings,
            foregroundBuildings
        };
    }

    removeEntity(entity: string) {
        this.storage.removeEntity(entity);
    }

    spawnForegroundBuilding() {
        if (!this.textures) return;

        const { storage } = this;

        const texture = randomPick(this.textures.foregroundBuildings);

        const buildingSize = Vec2.fromCartesian(
            texture.width,
            texture.height
        );

        const building = storage.createEntity();
        storage.setComponent(building, new Transform({
            x: this.farthestForegroundX + buildingSize.x / 2,
            y: -(buildingSize.y / 2)
        }));
        storage.setComponent(building, new Despawnable());
        storage.setComponent(building, new StaticSprite({
            texture,
            zIndex: -1,
            targetSize: buildingSize
        }));
        this.farthestForegroundX += buildingSize.x;
    }

    spawnBackgroundBuilding() {
        if (!this.textures) return;

        const { storage } = this;

        const texture = randomPick(this.textures.backgroundBuildings);

        const buildingSize = Vec2.fromCartesian(
            texture.width,
            texture.height
        );

        const building = storage.createEntity();
        storage.setComponent(building, new Transform({
            x: this.farthestBackgroundX + buildingSize.x / 2,
            y: -180 - (buildingSize.y / 2)
        }));
        storage.setComponent(building, new Despawnable());
        storage.setComponent(building, new StaticSprite({
            texture,
            zIndex: -2,
            targetSize: buildingSize
        }));
        storage.setComponent(building, new Body({
            velocity: Vec2.fromCartesian(BG_MOVEMENT_SPEED, 0),
            isAffectedByGravity: false
        }));
        this.farthestBackgroundX += buildingSize.x;
    }

    spawnPlatform() {
        if (!this.textures) return;

        const { storage } = this;

        const platform = storage.createEntity();
        storage.setComponent(platform, new Transform({ x: this.farthestPlatformX + 16, y: 0 }));
        storage.setComponent(platform, new Collider(Aabb.fromCenteredSize(32, 8)));
        storage.setComponent(platform, new Despawnable());
        storage.setComponent(platform, new StaticSprite({
            texture: this.textures.platform,
            zIndex: 0
        }));
        this.farthestPlatformX += 32;
    }

    spawnAmplifier(x: number, y: number) {
        if (!this.textures) return;

        const { storage } = this;

        const amplifier = storage.createEntity();
        storage.setComponent(amplifier, new Transform({ x, y }));
        storage.setComponent(amplifier, new Collider(
            Aabb.fromCenteredSize(44, 32),
            ColliderType.Trigger,
            CollisionLayer.Collectible
        ));
        storage.setComponent(amplifier, new Collectible(10));
        storage.setComponent(amplifier, new StaticSprite({
            texture: this.textures.amplifier,
            zIndex: 1,
            rect: Aabb.fromSize(0, 0, 44, 32)
        }));
        storage.setComponent(amplifier, new FrameAnimation({
            animations: {
                'rotate': {
                    duration: Milliseconds.from(1000),
                    frames: amplifierRotateFrames,
                    mode: 'repeat'
                }
            },
            currentAnimation: 'rotate'
        }));
    }

    spawnBox(x: number, y: number) {
        if (!this.textures) return;

        const { storage } = this;

        const box = storage.createEntity();
        storage.setComponent(box, new Transform({ x, y }));
        storage.setComponent(box, new Collider(
            Aabb.fromCenteredSize(56, 56),
            ColliderType.Kinematic,
            CollisionLayer.Obstacle,
            CollisionLayer.Character
        ));
        storage.setComponent(box, new StaticSprite({
            texture: this.textures.box,
            zIndex: 1,
            rect: Aabb.fromSize(0, 0, 56, 56)
        }));
    }

    spawnChallenge() {
        if (!this.textures) return;
        
        var patterns = [
            this.patternA.bind(this),
            this.patternB.bind(this),
            this.patternC.bind(this),
            this.patternD.bind(this),
            this.patternE.bind(this),
            this.patternF.bind(this),
            this.patternG.bind(this),
            this.patternH.bind(this)
        ];

        patterns[Math.floor(Math.random()*patterns.length)]();
                
        this.farthestChallengeX += 44 + gap;
    }

    patternA(){
        this.spawnAmplifier(this.farthestChallengeX + gap, -30);
        this.spawnBox(this.farthestChallengeX + gap + 100, -30);
        this.spawnAmplifier(this.farthestChallengeX + gap + 100, -56 - 32);
        this.spawnAmplifier(this.farthestChallengeX + gap + 200, -30);
    }

    patternB(){
        this.spawnAmplifier(this.farthestChallengeX + gap + 12, -30);
        this.spawnBox(this.farthestChallengeX + gap + boxFull + boxHalf, -30);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull + boxHalf, -30 - boxFull)
        this.spawnBox(this.farthestChallengeX + gap + (boxFull + boxHalf ) * 2 + boxHalf, -30);
        this.spawnBox(this.farthestChallengeX + gap + (boxFull + boxHalf ) * 2 + boxHalf, -30 - boxFull);
        this.spawnAmplifier(this.farthestChallengeX + gap + (boxFull + boxHalf )* 2 + boxHalf, -30 - boxFull * 2);
        this.spawnAmplifier(this.farthestChallengeX + gap + (boxFull + boxHalf )* 3 + boxHalf, -30);
    }

    patternC(){
        this.spawnBox(this.farthestChallengeX + gap, -30);
        this.spawnAmplifier(this.farthestChallengeX + gap, -30 - boxFull);
        this.spawnBox(this.farthestChallengeX + gap + boxFull, -30);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull, -30 - boxFull);
        this.spawnBox(this.farthestChallengeX + gap + (boxFull) * 4, -30 - boxFull);
        this.spawnAmplifier(this.farthestChallengeX + gap + (boxFull) * 4, -30 - boxFull * 2);
        this.spawnBox(this.farthestChallengeX + gap + (boxFull) * 4 + boxFull, -30 - boxFull);
        this.spawnAmplifier(this.farthestChallengeX + gap + (boxFull) * 4 + boxFull, -30 - boxFull * 2);
        this.spawnBox(this.farthestChallengeX + gap + (boxFull) * 8, -30 - boxFull * 2);
        this.spawnAmplifier(this.farthestChallengeX + gap + (boxFull) * 8, -30 - boxFull * 3);
        this.spawnBox(this.farthestChallengeX + gap + (boxFull) * 8 + boxFull, -30 - boxFull * 2);
        this.spawnAmplifier(this.farthestChallengeX + gap + (boxFull) * 8 + boxFull, -30 - boxFull * 3);
        this.farthestChallengeX += 200;
    }

    patternD(){
        this.spawnBox(this.farthestChallengeX + gap, -30);
        this.spawnAmplifier(this.farthestChallengeX + gap, -30 - boxFull);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull + boxHalf, -30 - boxFull*2);
        this.spawnAmplifier(this.farthestChallengeX + gap + (boxFull + boxHalf) * 2, -30 - boxFull*3);
        this.spawnAmplifier(this.farthestChallengeX + gap + (boxFull + boxHalf) * 3, -30 - boxFull*2);
        this.spawnAmplifier(this.farthestChallengeX + gap + (boxFull + boxHalf) * 4, -30 - boxFull);
        this.spawnBox(this.farthestChallengeX + gap + (boxFull + boxHalf) * 4, -30);
    }

    patternE(){
        this.spawnBox(this.farthestChallengeX + gap, -30);
        this.spawnBox(this.farthestChallengeX + gap + boxHalf + 12, -30);
        this.spawnBox(this.farthestChallengeX + gap + boxHalf - 10, -30 - boxFull);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxHalf - 10, -30 - boxFull*2);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxHalf - 10, -30 - boxFull*3);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxHalf - 10 + 200, -30 - boxFull*5);
    }

    patternF(){
        this.spawnBox(this.farthestChallengeX + gap, -30);
        this.spawnBox(this.farthestChallengeX + gap, -30 - boxFull);
        this.spawnAmplifier(this.farthestChallengeX + gap, -30 - boxFull*2);
        this.spawnBox(this.farthestChallengeX + gap + boxFull*3, -30);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull*3, -30 - boxFull);
        this.spawnBox(this.farthestChallengeX + gap + boxFull*6, -30);
        this.spawnBox(this.farthestChallengeX + gap + boxFull*6, -30 - boxFull);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull*6, -30 - boxFull*2);
        this.farthestChallengeX += 200;
    }

    patternG(){
        this.spawnBox(this.farthestChallengeX + gap, -30);
        this.spawnAmplifier(this.farthestChallengeX + gap, -30 - boxFull);
        this.spawnBox(this.farthestChallengeX + gap + boxFull*3, -30);
        this.spawnBox(this.farthestChallengeX + gap + boxFull*3, -30 - boxFull);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull*3, -30 - boxFull*2);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull*3, -30 - boxFull*3);
        this.spawnBox(this.farthestChallengeX + gap + boxFull*6, -30);
        this.spawnBox(this.farthestChallengeX + gap + boxFull*6, -30 - boxFull);
        this.spawnBox(this.farthestChallengeX + gap + boxFull*6, -30 - boxFull*2);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull*6, -30 - boxFull*3);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull*6, -30 - boxFull*4);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull*6, -30 - boxFull*5);
        this.farthestChallengeX += 100;
    }
    
    patternH(){
        this.spawnBox(this.farthestChallengeX + gap, -30);
        this.spawnAmplifier(this.farthestChallengeX + gap, -30 - boxFull);
        this.spawnBox(this.farthestChallengeX + gap + boxFull*3, -30 - boxFull*2 - 20);
        this.spawnBox(this.farthestChallengeX + gap + boxFull*4, -30 - boxFull*2 - 20);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull*3, -30 - boxFull*3 - 20);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull*4, -30 - boxFull*3 - 20);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull*3 + ampFull/2 + 5, -30 - boxFull*4 - 20);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull*2, -30);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull*3, -30);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull*4, -30);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull*5, -30);
        this.spawnBox(this.farthestChallengeX + gap + boxFull*7, -30);
        this.spawnAmplifier(this.farthestChallengeX + gap + boxFull*7, -30 - boxFull);
    }

    run(dt: number) {
        if (!this.textures) return;

        const { storage } = this;

        const characters = storage.getEntitiesWith(characterComponents);
        const despawnables = storage.getEntitiesWith(despawnableComponents);

        const despawnList = new Set<string>(despawnables);

        for (let character of characters) {
            const [characterTransform, characterData] = storage.getComponents(character, characterComponents);

            // Despawning
            for (let despawnable of despawnables) {
                const [despawnableTransform, despawnableData] = storage.getComponents(despawnable, despawnableComponents);

                if (despawnableTransform.position.x >= characterTransform.position.x - DESPAWN_DISTANCE) {
                    despawnList.delete(despawnable);
                }
            }

            // Syncing with physics updates
            this.farthestBackgroundX += BG_MOVEMENT_SPEED * dt;

            // Spawning
            if (this.farthestPlatformX < characterTransform.position.x + SPAWN_DISTANCE) {
                for (let i = 0; i < 15; ++i) {
                    this.spawnPlatform();
                }
            }

            if (this.farthestForegroundX < characterTransform.position.x + SPAWN_DISTANCE) {
                for (let i = 0; i < 3; ++i) {
                    this.spawnForegroundBuilding();
                }
            }

            if (this.farthestBackgroundX < characterTransform.position.x + SPAWN_DISTANCE) {
                for (let i = 0; i < 3; ++i) {
                    this.spawnBackgroundBuilding();
                }
            }

            if (this.farthestChallengeX < characterTransform.position.x + SPAWN_DISTANCE) {
                this.spawnChallenge();
            }
        }

        despawnList.forEach(this.removeEntity);
    }
}