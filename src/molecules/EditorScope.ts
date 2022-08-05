import { PrimitiveAtom } from 'jotai';
import { createScope } from 'jotai-molecules';

export const EditorScope = createScope<EditorOptions | null>(null);

export type EditorOptions = {
  textAtom: PrimitiveAtom<string>;
};
