import { EntityStorage } from 'core/entity-storage';
import { all } from 'core/aspect';

class ComponentA {
    public static readonly componentName: string = 'ComponentA';
}

class ComponentB {
    public static readonly componentName: string = 'ComponentB';
}

class ComponentC {
    public static readonly componentName: string = 'ComponentC';
}

const aspectAB = all(ComponentA, ComponentB);
const aspectABC = all(ComponentA, ComponentB, ComponentC);
const aspectC = all(ComponentC);

describe('EntityStorage', () => {
    test('creates entities', () => {
        const storage = new EntityStorage();

        const entity = storage.createEntity();
        expect(entity).toBeTruthy();
        expect(storage.hasEntity(entity)).toBe(true);
    });

    test('removes entities', () => {
        const storage = new EntityStorage();

        const entity = storage.createEntity();
        expect(entity).toBeTruthy();
        expect(storage.hasEntity(entity)).toBe(true);

        storage.removeEntity(entity);
        storage.handleRemovals();

        expect(storage.hasEntity(entity)).toBe(false);
    });

    test('sets a component of an entity', () => {
        const storage = new EntityStorage();
        const entity = storage.createEntity();
        const component = new ComponentA();
        
        storage.registerComponentType(ComponentA);

        storage.setComponent(entity, component);
        expect(storage.getComponent(entity, ComponentA)).toBe(component);
        expect(storage.hasComponent(entity, ComponentA)).toBe(true);
    });

    test('removes a component from an entity', () => {
        const storage = new EntityStorage();
        const entity = storage.createEntity();
        const component = new ComponentA();
        
        storage.registerComponentType(ComponentA);

        storage.setComponent(entity, component);
        expect(storage.getComponent(entity, ComponentA)).toBe(component);
        expect(storage.hasComponent(entity, ComponentA)).toBe(true);

        storage.removeComponent(entity, ComponentA);

        expect(storage.getComponent(entity, ComponentA)).toBe(undefined);
        expect(storage.hasComponent(entity, ComponentA)).toBe(false);
    });

    test('retrieves entities by aspect', () => {
        const storage = new EntityStorage();
        storage.registerComponentType(ComponentA);
        storage.registerComponentType(ComponentB);
        storage.registerComponentType(ComponentC);

        const ab: string[] = [];
        const abc: string[] = [];

        for (let i = 0; i < 10; ++i) {
            const entity = storage.createEntity();
            storage.setComponents(entity, [new ComponentA(), new ComponentB()]);
            ab.push(entity);
        }

        for (let i = 0; i < 5; ++i) {
            const entity = storage.createEntity();
            storage.setComponents(entity, [new ComponentA(), new ComponentB(), new ComponentC()]);
            abc.push(entity);
        }

        expect(storage.getByAspect(aspectAB)).toHaveLength(ab.length + abc.length);
        expect(storage.getByAspect(aspectABC)).toHaveLength(abc.length);
        expect(storage.getByAspect(aspectC)).toHaveLength(abc.length);
    });

    test('does not retrieve entity by aspect after removal', () => {
        const storage = new EntityStorage();
        storage.registerComponentType(ComponentA);
        storage.registerComponentType(ComponentB);
        storage.registerComponentType(ComponentC);

        const ab: string[] = [];
        const abc: string[] = [];

        for (let i = 0; i < 10; ++i) {
            const entity = storage.createEntity();
            storage.setComponents(entity, [new ComponentA(), new ComponentB()]);
            ab.push(entity);
        }

        for (let i = 0; i < 5; ++i) {
            const entity = storage.createEntity();
            storage.setComponents(entity, [new ComponentA(), new ComponentB(), new ComponentC()]);
            abc.push(entity);
        }

        storage.removeEntity(abc.pop()!);
        storage.handleRemovals();

        expect(storage.getByAspect(aspectAB)).toHaveLength(ab.length + abc.length);
        expect(storage.getByAspect(aspectABC)).toHaveLength(abc.length);
        expect(storage.getByAspect(aspectC)).toHaveLength(abc.length);
    });
});