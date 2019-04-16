import { ComponentStorage } from 'core/component-storage'

class TestCompnent {
    public static readonly componentName: string = 'TestComponent';
}

describe('ComponentStorage', () => {
    test('sets and retrieves a component to an entity', () => {
        const storage = new ComponentStorage();
        const component = new TestCompnent();

        storage.set('ent', component);
        expect(storage.has('ent')).toBe(true);
        expect(storage.get('ent')).toBe(component);
    });

    test('removes a component from an entity', () => {
        const storage = new ComponentStorage();
        const component = new TestCompnent();

        storage.set('ent', component);
        expect(storage.has('ent')).toBe(true);
        expect(storage.get('ent')).toBe(component);

        storage.remove('ent');
        expect(storage.has('ent')).toBe(false);
        expect(storage.get('ent')).toBe(undefined);
    });

    test('sets and retrieves components for multiple entities', () => {
        const entities = ['ent0', 'ent1', 'ent2'];
        const components = [new TestCompnent(), new TestCompnent(), new TestCompnent()];

        const storage = new ComponentStorage();

        for (let entity of entities) {
            expect(storage.has(entity)).toBe(false);
        }

        for (let entity of entities) {
            storage.set(entity, components[entities.indexOf(entity)]);
        }

        for (let entity of entities) {
            expect(storage.has(entity)).toBe(true);
            expect(storage.get(entity)).toBe(components[entities.indexOf(entity)]);
        }
    });
});