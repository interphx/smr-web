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
import { range } from 'utils/iterable';
import { Jump } from 'components/jump';
import { JumpingSystem } from 'systems/jumping';
import { Despawnable } from 'components/despawnable';
import { WorldGenerationSystem } from 'systems/world-generation';
import { ScoringSystem } from 'systems/scoring';
import { Lives } from 'components/lives';
import { PointerInput } from 'input/pointer';
import { Collectible } from 'components/collectible';
import { setup } from 'setup';
import { DamageSystem } from 'systems/damage';
import { DebugRenderingSystem } from 'systems/debug-rendering';

function getScreenSize() {
    const aspect = 4 / 3;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    if (windowWidth < windowHeight) {
        const desiredWidth = windowWidth;
        const desiredHeight = windowHeight / aspect;

        return { x: desiredWidth, y: desiredHeight };
    } else {
        const desiredHeight = windowHeight;
        const desiredWidth = desiredHeight * aspect;

        return { x: desiredWidth, y: desiredHeight };
    }
}

async function main() {
    const INITIAL_SCREEN_SIZE = getScreenSize();

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
    storage.registerComponentType(Lives);
    storage.registerComponentType(Collectible);
    setup(storage);

    const renderer = new Renderer({
        size           : Vec2.clone(INITIAL_SCREEN_SIZE),
        resolution     : Vec2.fromCartesian(640, 480),
        backgroundColor: 'black'
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
    const debugRendering = new DebugRenderingSystem(storage, renderer);

    await worldGenerationSystem.waitForInitialization();

    let rareUpdateCounter = 0;

    const loop = new GameLoop({
        timestep: Milliseconds.from(1000 / 30),
        onFixedUpdate: dt => {
            physicsSystem.run(dt);
            collisionSystem.run(dt);
            cameraSystem.run(dt);
        },
        onVariableUpdate: (dt, alpha) => {
            jumpingSystem.run(dt);
            animationSystem.run(dt);
            renderingSystem.run(dt, alpha);
            // debugRendering.run(dt, alpha);
            scoringSystem.run(dt);
            damageSystem.run(dt);

            rareUpdateCounter += 1;
            if (rareUpdateCounter % 3 === 0) {
                worldGenerationSystem.run(dt);
            }
        }
    });

    (window as any).loop = loop;

    const character = storage.createEntity();
    storage.setComponent(character, new Character());
    storage.setComponent(character, new Transform({ x: 0, y: -128 }));
    storage.setComponent(character, new Body({ velocity: Vec2.fromCartesian(0.2, 0) }));
    storage.setComponent(character, new Collider(
        Aabb.fromSize(-34, -62, 68, 124),
        ColliderType.Kinematic,
        CollisionLayer.Character,
        CollisionLayer.World | CollisionLayer.Obstacle | CollisionLayer.Collectible
    ));
    storage.setComponent(character, new Lives());
    storage.setComponent(character, new Jump({
        speed: 0.6,
        maxTime: Milliseconds.from(400)
    }));

    const camera = storage.createEntity();
    storage.setComponent(camera, new Camera(character, Vec2.clone(INITIAL_SCREEN_SIZE)));
    storage.setComponent(camera, new Transform({ x: 0, y: 0 }));

    loadImage('resources/images/character.png')
        .then(texture => {
            storage.setComponent(character, new StaticSprite({
                texture,
                zIndex: 1,
                rect: Aabb.fromSize(0, 0, 128, 128)
            }));

            const runFrames = FrameAnimation.generateSpritesheetFrames(
                Vec2.fromCartesian(128, 128),
                Vec2.fromCartesian(texture.width, texture.height)
            ).slice(1, 7);

            storage.setComponent(character, new FrameAnimation({
                animations: {
                    'run': {
                        duration: Milliseconds.from(1000),
                        frames: runFrames,
                        mode: 'repeat'
                    }
                },
                currentAnimation: 'run'
            }));
        });

    document.body.appendChild(renderer.getCanvas());

    loop.start();
    window.addEventListener('keydown', event => {
        if (event.key.toUpperCase() === 'A') {
            loop.stop();
        }
        if (event.key.toUpperCase() === 'S') {
            loop.step();
        }
        if (event.key.toUpperCase() === 'D') {
            loop.start();
        }
    })
}

waitForDocumentLoad()
    .then(() => delay(Milliseconds.from(1000)))
    .then(main);