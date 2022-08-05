import { atom } from 'jotai';
import { molecule } from 'jotai-molecules';
import jsonata from 'jsonata';
import { serializer } from 'jsonata-ui-core';
import { EditorScope } from './EditorScope';

export const CoreMolecule = molecule((_, getScope) => {
  const options = getScope(EditorScope);
  if (!options)
    throw new Error('JSONata editor must be used in an EditorScope');

  const textAtom = atom('');

  const astAtom = atom(
    (get) => jsonata(get(textAtom)).ast(),
    (_, set, next: jsonata.ExprNode) => {
      const nextText = serializer(next as any);
      return set(textAtom, nextText);
    }
  );

  return {
    textAtom,
    astAtom,
  };
});
