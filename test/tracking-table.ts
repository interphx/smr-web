import { TrackingTable } from 'core/tracking-table';

class ComponentA {
    public static readonly componentName: string = 'ComponentA';
}

class ComponentB {
    public static readonly componentName: string = 'ComponentB';
}

class ComponentC {
    public static readonly componentName: string = 'ComponentC';
}

describe('TrackingTable', () => {
    test('adds an entity', () => {
        const table = new TrackingTable([ComponentA], []);
        const entity = 'ent';
        const components = [new ComponentA()];

        expect(table.getEntries()).toHaveLength(0);

        table.addIfNone(entity, components);

        expect(table.getEntries()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    entity,
                    components
                })
            ])
        );
    });

    test('updates an entity if exists', () => {
        const table = new TrackingTable([ComponentA], []);
        const entity = 'ent';
        const instance0 = new ComponentA();
        const instance1 = new ComponentA();

        expect(table.getEntries()).toHaveLength(0);

        table.addIfNone(entity, [instance0]);

        expect(table.getEntries()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    entity,
                    components: [instance0]
                })
            ])
        );

        table.addIfNone(entity, [instance1]);

        expect(table.getEntries()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    entity,
                    components: [instance1]
                })
            ])
        );
    });

    test('removes an entity', () => {
        const table = new TrackingTable([ComponentA], []);
        const entity = 'ent';
        const components = [new ComponentA()];

        expect(table.getEntityData(entity)).toBeFalsy();
        expect(table.getEntries()).toHaveLength(0);

        table.addIfNone(entity, components);

        expect(table.getEntityData(entity)).toBeTruthy();
        expect(table.getEntries()).toHaveLength(1);

        table.removeIfExists(entity);

        expect(table.getEntityData(entity)).toBeFalsy();
        expect(table.getEntries()).toHaveLength(0);
    });

    test('adds multiple entities with multiple components', () => {
        const table = new TrackingTable([ComponentA, ComponentB, ComponentC], []);
        const entities = ['ent0', 'ent1', 'ent2'];
        const components = [
            [new ComponentA(), new ComponentB(), new ComponentC()],
            [new ComponentA(), new ComponentB(), new ComponentC()],
            [new ComponentA(), new ComponentB(), new ComponentC()]
        ];

        expect(table.getEntries()).toHaveLength(0);

        for (let entity of entities) {
            table.addIfNone(entity, components[entities.indexOf(entity)]);
        }

        expect(table.getEntries()).toHaveLength(3);
        for (let entity of entities) {
            expect(table.getEntityData(entity)).toBeTruthy();
        }
    });

    test('removes multiple entities with multiple components', () => {
        const table = new TrackingTable([ComponentA, ComponentB, ComponentC], []);
        const entities = ['ent0', 'ent1', 'ent2'];
        const components = [
            [new ComponentA(), new ComponentB(), new ComponentC()],
            [new ComponentA(), new ComponentB(), new ComponentC()],
            [new ComponentA(), new ComponentB(), new ComponentC()]
        ];

        expect(table.getEntries()).toHaveLength(0);

        for (let entity of entities) {
            table.addIfNone(entity, components[entities.indexOf(entity)]);
        }

        expect(table.getEntries()).toHaveLength(3);
        for (let entity of entities) {
            expect(table.getEntityData(entity)).toBeTruthy();
        }

        table.removeIfExists(entities[0]);

        expect(table.getEntries()).toHaveLength(2);
        expect(table.getEntries()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ entity: entities[1], components: components[1] }),
                expect.objectContaining({ entity: entities[2], components: components[2] })
            ])
        );

        table.removeIfExists(entities[2]);

        expect(table.getEntries()).toHaveLength(1);
        expect(table.getEntries()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ entity: entities[1], components: components[1] })
            ])
        );

        table.removeIfExists(entities[1]);

        expect(table.getEntries()).toHaveLength(0);
    });
});