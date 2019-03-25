export const Newtype = {
    create<Base, Name extends string>() {
        type TypeAlias = Base & { ':&typename&:': Name };
        return {
            from(value: Base) {
                return value as TypeAlias;
            },
            unwrap(value: TypeAlias) {
                return value as Base;
            },
            Type: undefined as unknown as TypeAlias
        };
    }
}