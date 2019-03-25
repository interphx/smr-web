export function hasProperty(obj: object, propertyName: string) {
    return Object.prototype.hasOwnProperty.call(obj, propertyName);
}