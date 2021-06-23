import { Semigroup } from 'fp-ts/Semigroup'
import * as RR from 'fp-ts/ReadonlyRecord'
import * as IO from 'fp-ts/IO'
import * as Ord_ from 'fp-ts/Ord'
import * as N from 'fp-ts/number'
import * as R from 'fp-ts/Random'
import * as O from 'fp-ts/Option'
import { fst } from 'fp-ts/Tuple'
import { constant, Endomorphism, flow, identity, pipe } from 'fp-ts/function'

import * as Bet from 'Bet'
import * as S from 'Strategy'
import * as P from 'Probability'

/**
 * @category model
 */
export interface Individual<Keys extends string> {
  entity: S.Strategy<Keys>
  fitness: number
}

/**
 * @category constructors
 */
export const fromStrategy: <Keys extends string>(
  s: S.Strategy<Keys>
) => Individual<Keys> = (s) => ({
  entity: s,
  fitness: pipe(s, S.getPrioriStatistics(1), fst)
})

/**
 * @category constructors
 */
export const initializeIndividual: (
  stakeBounds: [number, number]
) => <Keys extends string>(
  cons: RR.ReadonlyRecord<Keys, (stake: number) => O.Option<Bet.Bet<Keys>>>
) => O.Option<Individual<Keys>> = ([stakeLow, stakeHigh]) =>
  flow(
    RR.map((makeBet) => pipe(R.randomRange(stakeLow, stakeHigh), IO.map(makeBet))()),
    RR.sequence(O.Applicative),
    O.map(fromStrategy)
  )

/**
 * @category internal
 */
const randomMutation: (
  odds: P.Probability<unknown>,
  scaleFactor: number
) => Endomorphism<number> = (odds, scaleFactor) => (value) =>
  pipe(odds, P.foldBoolean, (shouldMutate) =>
    shouldMutate() ? scaleFactor * value : value
  )

/**
 * @category instances
 */
export const getSemigroup: <Keys extends string>(
  keys: RR.ReadonlyRecord<Keys, Keys>,
  oddsOfMutation: P.Probability<unknown>,
  scaleFactor: IO.IO<number>,
  activationFunction?: Endomorphism<number>
) => Semigroup<Individual<Keys>> = (
  keys,
  oddsOfMutation,
  scaleFactor,
  activationFunction = identity
) => ({
  concat: (x, y) => {
    const stakeRatio = x.fitness / y.fitness
    const stakeRatioI = 1 - stakeRatio
    const { entity: sX } = x
    const { entity: sY } = y
    const newStrategy = pipe(
      keys,
      RR.mapWithIndex((key) => {
        const bX = sX[key]
        const bY = sY[key]
        return pipe(
          bX,
          Bet.mapStake(
            pipe(
              bX.stake * stakeRatio + bY.stake * stakeRatioI,
              randomMutation(oddsOfMutation, scaleFactor()),
              activationFunction,
              constant
            )
          )
        )
      })
    )
    return fromStrategy(newStrategy)
  }
})

/**
 * @category instances
 */
export const getOrd: <Keys extends string>() => Ord_.Ord<Individual<Keys>> = () =>
  pipe(
    N.Ord,
    Ord_.contramap(({ fitness }) => fitness)
  )
