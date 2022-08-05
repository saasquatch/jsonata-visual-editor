import { molecule } from 'jotai-molecules';
import { CoreMolecule } from './CoreMolecule';
import { NodeScope } from './NodeScope';

/**
 * The JSONata AST node that can be edited in scope.
 *
 */
export const NodeMolecule = molecule((getMol, getScope) => {
  const coreAtoms = getMol(CoreMolecule);
  const nodeScope = getScope(NodeScope);

  const nodeAtom = nodeScope ?? coreAtoms.astAtom;

  return {
    nodeAtom,
  };
});
