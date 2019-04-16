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
import { all } from 'core/aspect';
import { EntityPool } from 'core/entity-pool';

const characterAspect = all(Transform, Character);
const despawnableAspect = all(Transform, Despawnable, StaticSprite);

const SPAWN_DISTANCE = 1500;
const DESPAWN_DISTANCE = 500;

const amplifierRotateFrames = FrameAnimation.generateSpritesheetFrames(
    Vec2.fromCartesian(44, 32),
    Vec2.fromCartesian(352, 32)
);
const amplifierColliderAabb = Aabb.fromCenteredSize(44, 32);
const amplifierSpriteAabb = Aabb.fromSize(0, 0, 44, 32);
const amplifierSpriteSize = Vec2.fromCartesian(44, 32);

const boxColliderAabb = Aabb.fromCenteredSize(56, 56);
const boxSpriteAabb = Aabb.fromSize(0, 0, 56, 56);
const boxSpriteSize = Vec2.fromCartesian(56, 56);

const platformColliderAabb = Aabb.fromCenteredSize(640, 8);
const platformSpriteAabb = Aabb.fromSize(0, 0, 32, 8);
const platformSpriteSize = Vec2.fromCartesian(640, 8);

const gap = 600;
const boxHalf = 28;
const boxFull = 56;
const ampFull = 44;

class WorldObjectPool<TComponents> {
    private entities: TComponents[] = [];

    constructor(
        private storage: EntityStorage,
        private createComponents: (x: number, y: number) => TComponents,
        private initializeComponents: (x: number, y: number, components: TComponents) => void
    ) {

    }

    add(components: TComponents) {
        this.entities.push(components);
    }

    get(x: number, y: number) {
        const components = (this.entities.length > 0)
            ? this.entities.pop()!
            : this.createComponents(x, y);
        this.initializeComponents(x, y, components);
        const entity = this.storage.createEntity();
        this.storage.setComponents(entity, components as any);
        return entity;
    }
}

export class WorldGenerationSystem {
    // Rightmost edges
    private farthestPlatformX: number = -400;
    private farthestForegroundX: number = -400;
    private farthestBackgroundX: number = -400;
    private farthestChallengeX: number = 0;

    /*private amplifierPool = new WorldObjectPool<[Transform, Collider, Collectible, StaticSprite, FrameAnimation]>(
        this.storage,
        (x, y) => {
            if (!this.textures) throw new Error();

            return [
                new Transform({ x, y }),
                new Collider(
                    amplifierColliderAabb,
                    ColliderType.Trigger,
                    CollisionLayer.Collectible
                ),
                new Collectible(10),
                new StaticSprite({
                    texture: this.textures.amplifier,
                    zIndex: 1,
                    rect: amplifierSpriteAabb,
                    targetSize: amplifierSpriteSize
                }),
                new FrameAnimation({
                    animations: {
                        'rotate': {
                            duration: Milliseconds.from(1000),
                            frames: amplifierRotateFrames,
                            mode: 'repeat'
                        }
                    },
                    currentAnimation: 'rotate'
                })
            ]
        },
        (x, y, [transform]) => {
            transform.teleportTo(x, y);
        }
    );*/

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

    /*public freeAmplifierEntity(entity: string) {
        this.amplifierPool.add([
            this.storage.getComponent(entity, Transform),
            this.storage.getComponent(entity, Collider),
            this.storage.getComponent(entity, Collectible),
            this.storage.getComponent(entity, StaticSprite),
            this.storage.getComponent(entity, FrameAnimation)
        ]);
        this.storage.removeEntity(entity);
    }*/

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

    private foregroundBuildingPool = new EntityPool();
    spawnForegroundBuilding() {
        if (!this.textures) return;

        const { storage } = this;

        const texture = randomPick(this.textures.foregroundBuildings);

        const existingBuilding = this.foregroundBuildingPool.getEntity();

        if (existingBuilding) {
            const transform = storage.getComponent(existingBuilding, Transform);
            const sprite = storage.getComponent(existingBuilding, StaticSprite);

            transform.teleportTo(this.farthestForegroundX + texture.width / 2, -(texture.height) / 2);
            sprite.texture = texture;
            sprite.sourceRect.width = texture.width;
            sprite.sourceRect.height = texture.height;
            sprite.targetSize.x = texture.width;
            sprite.targetSize.y = texture.height;
        } else {
            const buildingSize = Vec2.fromCartesian(
                texture.width,
                texture.height
            );

            const building = storage.createEntity();
            this.foregroundBuildingPool.addUsedEntity(building);

            storage.setComponents(building, [
                new Transform({
                    x: this.farthestForegroundX + buildingSize.x / 2,
                    y: -(buildingSize.y / 2)
                }),
                new Despawnable(),
                new StaticSprite({
                    texture,
                    zIndex: -1,
                    targetSize: buildingSize
                })
            ]);
        }
        this.farthestForegroundX += texture.width;
    }

    private backgroundBuildingPool = new EntityPool();
    spawnBackgroundBuilding() {
        if (!this.textures) return;

        const { storage } = this;

        const texture = randomPick(this.textures.backgroundBuildings);

        const existingBackgroundBuilding = this.backgroundBuildingPool.getEntity();

        if (existingBackgroundBuilding) {
            const transform = storage.getComponent(existingBackgroundBuilding, Transform);
            const sprite = storage.getComponent(existingBackgroundBuilding, StaticSprite);

            sprite.texture = texture;
            sprite.sourceRect.width = texture.width;
            sprite.sourceRect.height = texture.height;
            sprite.targetSize.x = texture.width;
            sprite.targetSize.y = texture.height;

            transform.teleportTo(this.farthestBackgroundX + texture.width / 2, -180 - (texture.height / 2));
        } else {
            const buildingSize = Vec2.fromCartesian(
                texture.width,
                texture.height
            );

            const building = storage.createEntity();
            this.backgroundBuildingPool.addUsedEntity(building);

            storage.setComponents(building, [
                new Transform({
                    x: this.farthestBackgroundX + buildingSize.x / 2,
                    y: -180 - (buildingSize.y / 2)
                }),
                new Despawnable(),
                new StaticSprite({
                    texture,
                    zIndex: -2,
                    targetSize: buildingSize,
                    parallaxDepth: 1.3
                })
            ]);
        }
        this.farthestBackgroundX += texture.width;
    }

    private platformPool = new EntityPool();
    spawnPlatform() {
        if (!this.textures) return;

        const { storage } = this;

        const width = platformColliderAabb.width;
        const halfWidth = width / 2;

        const existingPlatform = this.platformPool.getEntity();

        if (existingPlatform) {
            const transform = storage.getComponent(existingPlatform, Transform);
            transform.teleportTo(this.farthestPlatformX + halfWidth, 0);
        } else {
            const platform = storage.createEntity();
            this.platformPool.addUsedEntity(platform);

            storage.setComponents(platform, [
                new Transform({ x: this.farthestPlatformX + halfWidth, y: 0 }),
                new Collider(platformColliderAabb),
                new Despawnable(),
                new StaticSprite({
                    texture: this.textures.platform,
                    zIndex: 0,
                    rect: platformSpriteAabb,
                    targetSize: platformSpriteSize
                })
            ]);
        }
        this.farthestPlatformX += width;
    }

    private amplifierPool = new EntityPool();
    spawnAmplifier(x: number, y: number) {
        if (!this.textures) return;

        const { storage } = this;

        
        const existingAmplifier = this.amplifierPool.getEntity();

        if (existingAmplifier) {
            const transform = storage.getComponent(existingAmplifier, Transform);
            transform.teleportTo(x, y);
        } else {
            const amplifier = storage.createEntity();
            this.amplifierPool.addUsedEntity(amplifier);

            storage.setComponents(amplifier, [
                new Transform({ x, y }),
                new Collider(
                    amplifierColliderAabb,
                    ColliderType.Trigger,
                    CollisionLayer.Collectible
                ),
                new Collectible(10),
                new StaticSprite({
                    texture: this.textures.amplifier,
                    zIndex: 1,
                    rect: amplifierSpriteAabb,
                    targetSize: amplifierSpriteSize
                }),
                new FrameAnimation({
                    animations: {
                        'rotate': {
                            duration: Milliseconds.from(1000),
                            frames: amplifierRotateFrames,
                            mode: 'repeat'
                        }
                    },
                    currentAnimation: 'rotate'
                })
            ]);
        }
    }

    private boxPool = new EntityPool();
    spawnBox(x: number, y: number) {
        if (!this.textures) return;

        const { storage } = this;

        const existingBox = this.boxPool.getEntity();

        if (existingBox) {
            const transform = storage.getComponent(existingBox, Transform);
            transform.teleportTo(x, y);
        } else {
            const box = storage.createEntity();
            this.boxPool.addUsedEntity(box);

            storage.setComponents(box, [
                new Transform({ x, y }),
                new Collider(
                    boxColliderAabb,
                    ColliderType.Kinematic,
                    CollisionLayer.Obstacle,
                    CollisionLayer.Character
                ),
                new StaticSprite({
                    texture: this.textures.box,
                    zIndex: 1,
                    rect: boxSpriteAabb,
                    targetSize: boxSpriteSize
                })
            ]);
        }
    }

    private patterns = [
        this.patternA.bind(this),
        this.patternB.bind(this),
        this.patternC.bind(this),
        this.patternD.bind(this),
        this.patternE.bind(this),
        this.patternF.bind(this),
        this.patternG.bind(this),
        this.patternH.bind(this)
    ];

    spawnChallenge() {
        if (!this.textures) return;
        
        var patterns = this.patterns;
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

    freeOrRemove(entity: string) {
        if (this.platformPool.hasEntity(entity)) {
            this.platformPool.tryFreeEntity(entity);
        } else if (this.boxPool.hasEntity(entity)) {
            this.boxPool.tryFreeEntity(entity);
        } else if (this.foregroundBuildingPool.hasEntity(entity)) {
            this.foregroundBuildingPool.tryFreeEntity(entity);
        } else if (this.backgroundBuildingPool.hasEntity(entity)) {
            this.backgroundBuildingPool.tryFreeEntity(entity);
        } else {
            this.storage.removeEntity(entity);
        }
    }

    run(dt: number) {
        if (!this.textures) return;

        const { storage } = this;

        const characters = storage.getByAspect(characterAspect);
        const despawnables = storage.getByAspect(despawnableAspect);

        for (let { components: [characterTransform, ] } of characters) {
            // Despawning
           
            for (let { entity: despawnable, components: [despawnableTransform, despawnableData, despawnableSprite] } of despawnables) {
                if (despawnableTransform.position.x * despawnableSprite.parallaxDepth <= characterTransform.position.x - DESPAWN_DISTANCE) {
                    this.freeOrRemove(despawnable);
                }
            }

            // Spawning

            const spawnFrontier = characterTransform.position.x + SPAWN_DISTANCE;
            const spawnFrontierExtended = spawnFrontier + SPAWN_DISTANCE * 2;

            if (
                this.farthestPlatformX < spawnFrontier &&
                this.farthestForegroundX < spawnFrontier &&
                this.farthestBackgroundX < spawnFrontier &&
                this.farthestChallengeX < spawnFrontier
            ) {
                while (this.farthestPlatformX < spawnFrontierExtended) {
                    this.spawnPlatform();
                }

                while (this.farthestForegroundX < spawnFrontierExtended) {
                    this.spawnForegroundBuilding();
                }
                this.spawnForegroundBuilding();

                while (this.farthestBackgroundX < spawnFrontierExtended) {
                    this.spawnBackgroundBuilding();
                }

                while (this.farthestChallengeX < spawnFrontierExtended) {
                    this.spawnChallenge();
                }
            }
        }
    }
}