import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'
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
      O.chain(O.fromPredicate(() => isInteger(top) && isInteger(bottom)))
    )

/**
 * @category destructors
 */
export const toFraction: <A>(p: Probability<A>) => Fr.Fraction = ({ p }) => p
