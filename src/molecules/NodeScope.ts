import { PrimitiveAtom } from 'jotai';
import { createScope } from 'jotai-molecules';
import { AST } from '../types';

/**
 * For building deep nested AST editor with arbitrary amount of wrapping components.
 *
 */
export const NodeScope = createScope<PrimitiveAtom<AST> | null>(null);
