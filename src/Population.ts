import * as RA from 'fp-ts/ReadonlyArray'
import { Semigroup } from 'fp-ts/Semigroup'
import { Endomorphism, flow, pipe } from 'fp-ts/function'

import * as I from 'Individual'

/**
 * @category model
 */
export interface Population<Keys extends string>
  extends ReadonlyArray<I.Individual<Keys>> {}

/**
 * @category utilities
 */
export const getNaturalSelection = <Keys extends string>(
  casualties: number
): Endomorphism<Population<Keys>> =>
  flow(RA.sort(I.getOrd<Keys>()), RA.takeLeft(casualties))

/**
 * @category internal
 */
const shuffle: <A>(as: ReadonlyArray<A>) => ReadonlyArray<A> = (as) => {
  const asI = [...as]
  for (let i = RA.size(asI) - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[asI[i], asI[j]] = [asI[j], asI[i]]
  }
  return asI
}

/**
 * @category utilities
 */
export const getReproduce: <Keys extends string>(
  semigroup: Semigroup<I.Individual<Keys>>,
  numberOfOffspring: number
) => Endomorphism<Population<Keys>> = ({ concat }, numberOfOffspring) =>
  flow(
    RA.chunksOf(2),
    RA.filter((couples) => RA.size(couples) === 2),
    RA.chain(([a, b]) => [a, b, ...RA.makeBy(numberOfOffspring, () => concat(a, b))]),
    shuffle
  )
