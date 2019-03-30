export type ComponentClass = 
(new (...args: any[]) => any) &
{
    componentName: string;
};

export type ComponentInstance<T extends ComponentClass> =
InstanceType<T> &
{ constructor: ComponentClass };