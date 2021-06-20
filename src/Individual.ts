import { Semigroup } from 'fp-ts/Semigroup'
import * as RR from 'fp-ts/ReadonlyRecord'
import * as IO from 'fp-ts/IO'
import { constant, Endomorphism, pipe } from 'fp-ts/function'

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
  calculateFitness: (s: S.Strategy<Keys>) => number
) => (s: S.Strategy<Keys>) => Individual<Keys> = (calculateFitness) => (s) => ({
  entity: s,
  fitness: calculateFitness(s)
})

/**
 * @category internal
 */
const randomMutation: (
  odds: P.Probability<number>,
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
  oddsOfMutation: P.Probability<number>,
  scaleFactor: IO.IO<number>,
  calculateFitness: (s: S.Strategy<Keys>) => number
) => Semigroup<Individual<Keys>> = (
  keys,
  oddsOfMutation,
  scaleFactor,
  calculateFitness
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
              constant
            )
          )
        )
      })
    )
    return pipe(newStrategy, fromStrategy(calculateFitness))
  }
})
