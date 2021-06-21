import * as O from 'fp-ts/Option'
import { constant, flow, pipe } from 'fp-ts/function'
import * as R from 'fp-ts/Random'
import * as IO from 'fp-ts/IO'

import * as Fr from './Fraction'

/**
 * @category model
 */
export interface Probability<A> {
  p: Fr.Fraction
  _tag: 'Probability'
  value: A
}

/**
 * @category internal
 */
const probability: (top: number) => (bottom: number) => <A>(value: A) => Probability<A> =
  (top) => (bottom) => (value) => ({
    p: Fr.fraction(top)(bottom),
    _tag: 'Probability',
    value
  })

/**
 * @category internal
 */
const isInteger: (n: number) => boolean = (n) => n === Math.floor(n)

/**
 * @category constructors
 */
export const fromFraction: <A>(
  value: A
) => (fraction: Fr.Fraction) => O.Option<Probability<A>> =
  (value) =>
  ({ top, bottom }) =>
    pipe(
      probability(top)(bottom)(value),
      O.fromPredicate(() => top <= bottom),
      O.chain(O.fromPredicate(() => isInteger(top) && isInteger(bottom))),
      O.chain(O.fromPredicate(() => bottom !== 0))
    )

/**
 * @category destructors
 */
export const toFraction: <A>(p: Probability<A>) => Fr.Fraction = ({ p }) => p

/**
 * @category destructors
 */
export const fold: <A>(p: Probability<A>) => IO.IO<O.Option<A>> = ({ p, value }) =>
  pipe(
    R.random,
    IO.map((r) => Fr.fold(p) < r),
    IO.map((selected) => pipe(value, O.fromPredicate(constant(selected))))
  )

/**
 * @category destructors
 */
export const foldBoolean: <A>(p: Probability<A>) => IO.IO<boolean> = flow(
  fold,
  IO.map(O.isSome)
)
