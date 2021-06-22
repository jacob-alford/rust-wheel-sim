import * as RA from 'fp-ts/ReadonlyArray'
import * as RR from 'fp-ts/ReadonlyRecord'
import * as O from 'fp-ts/Option'
import { Semigroup } from 'fp-ts/Semigroup'
import { Endomorphism, flow, pipe } from 'fp-ts/function'

import * as I from 'Individual'
import * as Bet from 'Bet'

/**
 * @category model
 */
export interface Population<Keys extends string>
  extends ReadonlyArray<I.Individual<Keys>> {}

/**
 * @category constructors
 */
export const makeGeneration: (
  stakeBounds: [number, number],
  populationSize: number
) => <Keys extends string>(
  cons: RR.ReadonlyRecord<Keys, (stake: number) => O.Option<Bet.Bet<Keys>>>
) => O.Option<Population<Keys>> = (stakeBounds, populationSize) => (cons) =>
  pipe(
    RA.makeBy(populationSize, () => pipe(cons, I.initializeIndividual(stakeBounds))),
    RA.sequence(O.Applicative)
  )

/**
 * @category utilities
 */
export const getNaturalSelection = <Keys extends string>(
  casualties: number
): Endomorphism<Population<Keys>> =>
  flow(RA.sort(I.getOrd<Keys>()), RA.takeRight(casualties))

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
/**
 * @category utilites
 */
export const getEvolve: <Keys extends string>(
  deathsPerGeneration: number,
  mate: Semigroup<I.Individual<Keys>>,
  numberOfOffspring: number
) => Endomorphism<Population<Keys>> = (deathsPerGeneration, mate, numberOfOffspring) =>
  flow(getNaturalSelection(deathsPerGeneration), getReproduce(mate, numberOfOffspring))
