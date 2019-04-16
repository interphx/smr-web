import { ComponentInstance, ComponentClass } from './component';

export type TrackedEntity<TComponents = ReadonlyArray<ComponentInstance<any>>> = {
    entity: string;
    components: TComponents;
}

export class TrackingTable {
    private componentTypes: ReadonlyArray<ComponentClass>;
    private entries: TrackedEntity<ReadonlyArray<ComponentInstance<any>>>[];
    private entityIndices: {[entity: string]: number} = Object.create(null);

    constructor(
        componentTypes: ReadonlyArray<ComponentClass>,
        activeEntries: TrackedEntity<ComponentInstance<any>[]>[]
    ) {
        this.componentTypes = componentTypes;
        this.entries = [];

        for (let entry of activeEntries) {
            this.addIfNone(entry.entity, entry.components);
        }
    }

    private swap(indexA: number, indexB: number) {
        const a = this.entries[indexA];
        const b = this.entries[indexB];

        this.entries[indexA] = b;
        this.entries[indexB] = a;

        this.entityIndices[a.entity] = indexB;
        this.entityIndices[b.entity] = indexA;
    }

    public getEntityData(entity: string) {
        if (!(entity in this.entityIndices)) {
            return null;
        }
        return this.entries[this.entityIndices[entity]];
    }

    public getComponentTypes() {
        return this.componentTypes;
    }

    public getEntries() {
        return this.entries;
    }

    public addIfNone(entity: string, components: ReadonlyArray<ComponentInstance<any>>) {
        if (entity in this.entityIndices) {
            this.entries[this.entityIndices[entity]].components = components;
            return;
        }
        
        this.entityIndices[entity] = this.entries.push({ entity, components }) - 1;
    }

    public removeIfExists(entity: string) {
        if (entity in this.entityIndices) {
            const entries       = this.entries;
            const entityIndices = this.entityIndices;
            const index         = entityIndices[entity];

            this.swap(index, entries.length - 1);
            entries.length -= 1;

            delete entityIndices[entity];
        }
    }
}