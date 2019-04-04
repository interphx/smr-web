import { EntityStorage } from 'core/entity-storage';
import { Transform } from 'components/transform';
import { StaticSprite } from 'components/static-sprite';
import { Renderer } from 'core/renderer';
import { GameLoop } from 'core/game-loop';
import { Milliseconds } from 'types/milliseconds';
import { Camera } from 'components/camera';
import { loadImage, waitForDocumentLoad } from 'utils/ajax';
import { Character } from 'components/character';
import { RenderingSystem } from 'systems/rendering';
import { CameraSystem } from 'systems/camera';
import { PhysicsSystem } from 'systems/physics';
import { Vec2 } from 'types/vec2';
import { KeyboardInput } from 'input/keyboard';
import { delay } from 'utils/async';
import { AnimationSystem } from 'systems/animation';
import { FrameAnimation } from 'components/frame-animation';
import { Body } from 'components/body';
import { Collider, ColliderType, CollisionLayer } from 'components/collider';
import { Aabb } from 'types/aabb';
import { CollisionSystem } from 'systems/collision';
import { Jump } from 'components/jump';
import { JumpingSystem } from 'systems/jumping';
import { Despawnable } from 'components/despawnable';
import { WorldGenerationSystem } from 'systems/world-generation';
import { ScoringSystem } from 'systems/scoring';
import { PointerInput } from 'input/pointer';
import { Collectible } from 'components/collectible';
import { setup } from 'setup';
import { DamageSystem } from 'systems/damage';
import { DebugRenderingSystem } from 'systems/debug-rendering';
import { SpeedSystem } from 'systems/speed';
import { Text } from 'components/text';
import { FloatingText } from 'components/floating-text';

const TARGET_SIZE = Vec2.fromCartesian(640, 480);

function getScreenSize(targetSize: Vec2) {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const targetAspectRatio = targetSize.x / targetSize.y;
    const screenAspectRatio = windowWidth / windowHeight;

    const width = (screenAspectRatio > targetAspectRatio)
        ? targetSize.x * (windowHeight / targetSize.y)
        : windowWidth;
    const height = (screenAspectRatio > targetAspectRatio)
        ? windowHeight
        : targetSize.y * (windowWidth / targetSize.x);
    
    return Vec2.fromCartesian(width, height);
}

async function main() {
    const INITIAL_SCREEN_SIZE = getScreenSize(TARGET_SIZE);

    const storage = new EntityStorage();
    storage.registerComponentType(Transform);
    storage.registerComponentType(StaticSprite);
    storage.registerComponentType(Character);
    storage.registerComponentType(Camera);
    storage.registerComponentType(FrameAnimation);
    storage.registerComponentType(Body);
    storage.registerComponentType(Collider);
    storage.registerComponentType(Jump);
    storage.registerComponentType(Despawnable);
    storage.registerComponentType(Collectible);
    storage.registerComponentType(Text);
    storage.registerComponentType(FloatingText);
    setup(storage);

    const renderer = new Renderer({
        size           : Vec2.clone(INITIAL_SCREEN_SIZE),
        resolution     : TARGET_SIZE,
        backgroundColor: 'black',
        enableSmoothing: true
    });

    const keyboard = new KeyboardInput();
    const pointer = new PointerInput();

    const renderingSystem = new RenderingSystem(storage, renderer);
    const cameraSystem = new CameraSystem(storage);
    const physicsSystem = new PhysicsSystem(storage);
    const animationSystem = new AnimationSystem(storage);
    const collisionSystem = new CollisionSystem(storage);
    const jumpingSystem = new JumpingSystem(storage, keyboard, pointer);
    const worldGenerationSystem = new WorldGenerationSystem(storage);
    const scoringSystem = new ScoringSystem(storage);
    const damageSystem = new DamageSystem(storage);
    // const debugRenderingSystem = new DebugRenderingSystem(storage, renderer);
    const speedSystem = new SpeedSystem(storage);

    await worldGenerationSystem.waitForInitialization();
    await renderingSystem.waitForInitialization();

    let rareUpdateCounter = 0;

    const loop = new GameLoop({
        timestep: Milliseconds.from(1000 / 30),
        onFixedUpdate: dt => {
            jumpingSystem.run(dt);
            physicsSystem.run(dt);
            collisionSystem.run(dt);
            cameraSystem.run(dt);
        },
        onVariableUpdate: (dt, alpha) => {
            animationSystem.run(dt);
            renderingSystem.run(dt, alpha);
            // debugRenderingSystem.run(dt, alpha);
            scoringSystem.run(dt);
            damageSystem.run(dt);
            speedSystem.run(dt);

            rareUpdateCounter += 1;
            if ((rareUpdateCounter < 5) || (rareUpdateCounter % 15 === 0)) {
                worldGenerationSystem.run(dt);
            }

            storage.handleRemovals();
        }
    });

    (window as any).loop = loop;
    (window as any).entityStorage = storage;

    const character = storage.createEntity();
    storage.setComponents(character, [
        new Character(3),
        new Transform({ x: 0, y: -128 }),
        new Body({ velocity: Vec2.fromCartesian(0.25, 0), isAffectedByGravity: true }),
        new Collider(
            Aabb.fromSize(-34, -62, 68, 124),
            ColliderType.Kinematic,
            CollisionLayer.Character,
            CollisionLayer.World | CollisionLayer.Obstacle | CollisionLayer.Collectible
        ),
        new Jump({
            speed: 0.6,
            maxTime: Milliseconds.from(400)
        })
    ]);
    await loadImage('assets/images/character.png')
        .then(texture => {
            const runFrames = FrameAnimation.generateSpritesheetFrames(
                Vec2.fromCartesian(128, 128),
                Vec2.fromCartesian(texture.width, texture.height)
            ).slice(1, 7);

            const jumpFrames = FrameAnimation.generateSpritesheetFrames(
                Vec2.fromCartesian(128, 128),
                Vec2.fromCartesian(texture.width, texture.height)
            ).slice(7, 9);

            storage.setComponents(character, [
                new StaticSprite({
                    texture,
                    zIndex: 1,
                    rect: Aabb.fromSize(0, 0, 128, 128)
                }),
                new FrameAnimation({
                    animations: {
                        'run': {
                            duration: Milliseconds.from(900),
                            frames: runFrames,
                            mode: 'repeat'
                        },
                        'jump': {
                            duration: Milliseconds.from(600),
                            frames: jumpFrames,
                            mode: 'repeat'
                        }
                    },
                    currentAnimation: 'run'
                })
            ]);
        });

    const camera = storage.createEntity();
    storage.setComponents(camera, [
        new Camera(character, Vec2.clone(TARGET_SIZE)),
        new Transform({ x: 0, y: 0 })
    ]);

    document.addEventListener('scroll', event => event.preventDefault());
    document.addEventListener('touchmove', event => event.preventDefault()); 

    document.body.appendChild(renderer.getCanvas());

    loop.start();
    window.addEventListener('keydown', event => {
        if (event.key.toUpperCase() === 'A') {
            loop.stop();
        }
        if (event.key.toUpperCase() === 'S') {
            loop.step(1000 / 60);
        }
        if (event.key.toUpperCase() === 'D') {
            loop.start();
        }
    });
}

waitForDocumentLoad()
    .then(() => delay(Milliseconds.from(1000)))
    .then(main);