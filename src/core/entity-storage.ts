import { ComponentStorage } from './component-storage';
import { hasProperty } from 'utils/object';
import { ComponentClass, ComponentInstance } from './component';

type AspectBase = {
    hash: string;
    includedComponents: ComponentClass[];
}

type TrackedEntity<TComponents = ReadonlyArray<ComponentInstance<any>>> = {
    entity: string;
    components: TComponents;
}

type ComponentClassKeys<T extends ComponentClass[]> = {
    [key in keyof T]: T[key] extends ComponentClass ? key : never
}[keyof T];

type InstanceTypes<T extends (new (...args: any[]) => any)[]> = {
    [key in keyof T]: T[key] extends (new (...args: any[]) => any) ? InstanceType<T[key]> : never
};

class TrackingTable {
    private componentTypes: ReadonlyArray<ComponentClass>;
    private entries: TrackedEntity<ReadonlyArray<ComponentInstance<any>>>[];
    private entityIndices: {[entity: string]: number} = Object.create(null);

    constructor(
        componentTypes: ReadonlyArray<ComponentClass>,
        entries: TrackedEntity<ComponentInstance<any>[]>[]
    ) {
        this.componentTypes = componentTypes;
        this.entries = entries;
        for (let i = 0; i < this.entries.length; ++i) {
            this.entityIndices[this.entries[i].entity] = i;
        }
    }

    public getEntityData(entity: string) {
        if (!hasProperty(this.entityIndices, entity)) {
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
        if (hasProperty(this.entityIndices, entity)) {
            return;
        }
        this.entityIndices[entity] = this.entries.push({ entity, components }) - 1;
    }

    public removeIfExists(entity: string) {
        if (hasProperty(this.entityIndices, entity)) {
            const entries       = this.entries;
            const entityIndices = this.entityIndices;
            const index         = entityIndices[entity];

            entries[index] = entries[entries.length - 1];
            entityIndices[entries[index].entity] = index;
            entries.length -= 1;
        }
    }
}

export class EntityStorage {
    private lastEntityId: number = 0;
    private storages: {[componentName: string]: ComponentStorage<any>} = Object.create(null);
    private entities: {[entityId: string]: boolean | undefined} = Object.create(null);
    private tracked: {[aspectHash: string]: TrackingTable} = Object.create(null);
    private removed: string[] = [];

    public registerComponentType<T extends ComponentClass>(componentType: T) {
        this.storages[componentType.componentName] = new ComponentStorage<T>();
    }

    public createEntity() {
        this.lastEntityId += 1;
        const entityId = `${this.lastEntityId}`;
        this.entities[entityId] = true;
        return entityId;
    }

    public removeEntity(entity: string) {
        this.removed.push(entity);
    }

    public handleRemovals() {
        for (let entity of this.removed) {
            this.removeEntityImmediately(entity);
        }
        this.removed.length = 0;
    }

    public setComponent<T extends ComponentClass>(entityId: string, component: InstanceType<T>) {
        this.storages[(component.constructor as ComponentClass).componentName].set(entityId, component);
        this.updateTracking(entityId);
    }

    public setComponents<T extends ReadonlyArray<InstanceType<ComponentClass>>>(entityId: string, components: T) {
        for (let component of components) {
            this.storages[(component.constructor as ComponentClass).componentName].set(entityId, component);
        }
        this.updateTracking(entityId);
    }

    public getComponent<T extends ComponentClass>(entityId: string, componentType: T): ComponentInstance<T> {
        return this.storages[componentType.componentName].get(entityId);
    }

    public hasComponent<T extends ComponentClass>(entityId: string, componentType: T) {
        return this.storages[componentType.componentName].has(entityId);
    }

    public getByAspect<T extends { hash: string, includedComponents: ComponentClass[]}>(aspect: T): ReadonlyArray<TrackedEntity<InstanceTypes<T['includedComponents']>>> {
        if (!this.tracked[aspect.hash]) {
            this.tracked[aspect.hash] = new TrackingTable(aspect.includedComponents, this.findByAspect(aspect));
        }
        return this.tracked[aspect.hash].getEntries() as ReadonlyArray<TrackedEntity<any>>;
    }

    public getAspect<T extends { hash: string, includedComponents: ComponentClass[]}>(entity: string, aspect: T): TrackedEntity<InstanceTypes<T['includedComponents']>> | null {
        if (!this.tracked[aspect.hash]) {
            return null;
        }
        return this.tracked[aspect.hash].getEntityData(entity) as TrackedEntity<InstanceTypes<any>>;
    }

    private removeEntityImmediately(entityId: string) {
        for (let key in this.storages) {
            if (!hasProperty(this.storages, key)) continue;
            this.storages[key].remove(entityId);
        }
        delete this.entities[entityId];

        for (let trackedHash in this.tracked) {
            if (!hasProperty(this.tracked, trackedHash)) continue;
            this.tracked[trackedHash].removeIfExists(entityId);
        }
    }

    private isValidForTable(entityId: string, table: TrackingTable) {
        for (let componentType of table.getComponentTypes()) {
            if (!this.hasComponent(entityId, componentType)) {
                return false;
            }
        }
        return true;
    }

    private updateTracking(entityId: string) {
        for (let trackedHash in this.tracked) {
            if (!hasProperty(this.tracked, trackedHash)) continue;
            const table = this.tracked[trackedHash];
            if (this.isValidForTable(entityId, table)) {
                table.addIfNone(entityId, this.getEntityComponents(entityId, table.getComponentTypes()));
            } else {
                table.removeIfExists(entityId);
            }
        }
    }

    private findByAspect<T extends { hash: string, includedComponents: ComponentClass[]}>(aspect: T) {
        const results: TrackedEntity<T['includedComponents']>[] = [];
        for (let entity in this.entities) {
            if (!hasProperty(this.entities, entity)) continue;
            let isValid = true;
            const components: ComponentInstance<any>[] = [];
            for (let componentType of aspect.includedComponents) {
                if (!this.hasComponent(entity, componentType)) {
                    isValid = false;
                    break;
                } else {
                    components.push(this.getComponent(entity, componentType));
                }
            }
            if (isValid) {
                results.push({ entity, components });
            }
        }
        return results;
    }

    private getEntityComponents(entity: string, componentTypes: ReadonlyArray<ComponentClass>): ReadonlyArray<ComponentInstance<ComponentClass>> {
        const results: ComponentInstance<ComponentClass>[] = [];
        for (let componentClass of componentTypes) {
            results.push(this.getComponent(entity, componentClass));
        }
        return results;
    }
}