import * as O from 'fp-ts/Option'
import { Endomorphism, pipe } from 'fp-ts/function'

import * as P from './Probability'
import * as F from './Fraction'

/**
 * @category models
 */
export interface Bet<A> {
  p: P.Probability<A>
  payout: number
  stake: number
}

/**
 * @category constructors
 */
export const bet: <A>(
  value: A,
  payout: number,
  top: number,
  bottom: number
) => (stake: number) => O.Option<Bet<A>> = (value, payout, top, bottom) => (stake) =>
  pipe(
    F.fraction(top)(bottom),
    P.fromFraction(value),
    O.map((p) => ({ p, payout, stake }))
  )

/**
 * @category destructors
 */
export const toProbability: <A>(a: Bet<A>) => P.Probability<A> = ({ p }) => p

/**
 * @category utilities
 */
export const mapStake: <A>(f: Endomorphism<number>) => Endomorphism<Bet<A>> =
  (f) =>
  ({ p, payout, stake: s0 }) => ({
    p,
    payout,
    stake: f(s0)
  })
