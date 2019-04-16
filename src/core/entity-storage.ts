import { ComponentStorage } from './component-storage';
import { hasProperty } from 'utils/object';
import { ComponentClass, ComponentInstance } from './component';
import { TrackingTable, TrackedEntity } from './tracking-table';

type InstanceTypes<T extends (new (...args: any[]) => any)[]> = {
    [key in keyof T]: T[key] extends (new (...args: any[]) => any) ? InstanceType<T[key]> : never
};

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

    public removeComponent<T extends ComponentClass>(entityId: string, componentType: T) {
        this.storages[componentType.componentName].remove(entityId);
        this.updateTracking(entityId);
    }

    public removeComponents<T extends ReadonlyArray<ComponentClass>>(entityId: string, componentTypes: T) {
        for (let componentClass of componentTypes) {
            this.storages[componentClass.componentName].remove(entityId);
        }
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

    public hasEntity(entity: string) {
        return (entity in this.entities);
    }

    public getByAspect<T extends { hash: string, includedComponents: ComponentClass[]}>(aspect: T): ReadonlyArray<TrackedEntity<InstanceTypes<T['includedComponents']>>> {
        if (!(aspect.hash in this.tracked)) {
            this.tracked[aspect.hash] = new TrackingTable(
                aspect.includedComponents,
                this.findByAspect(aspect)
            );
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
            if (this.entities[entity] !== true) continue;
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