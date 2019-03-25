import { Newtype } from 'utils/newtype';

export const Milliseconds = Newtype.create<number, 'Milliseconds'>();
export type Milliseconds = typeof Milliseconds.Type;