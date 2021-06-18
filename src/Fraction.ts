import * as O from 'fp-ts/Ord'
import * as N from 'fp-ts/number'
import * as Mn from 'fp-ts/Monoid'
import * as Fld from 'fp-ts/Field'
import { pipe } from 'fp-ts/function'

/**
 * @category model
 */
export interface Fraction {
  top: number
  bottom: number
}

/**
 * @category constructors
 */
export const fraction: (top: number) => (bottom: number) => Fraction =
  (top) => (bottom) => ({ top, bottom })

/**
 * @category desctructors
 */
export const fold: (f: Fraction) => number = ({ top, bottom }) => top / bottom

/**
 * @category instances
 */
export const Ord: O.Ord<Fraction> = pipe(N.Ord, O.contramap(fold))

/**
 * @category instances
 */
export const Field: Fld.Field<Fraction> = {
  add: ({ top: a, bottom: b }, { top: c, bottom: d }) => fraction(a * d + b * c)(b * d),
  zero: fraction(0)(1),
  mul: ({ top: a, bottom: b }, { top: c, bottom: d }) => fraction(a * c)(b * d),
  one: fraction(1)(1),
  sub: ({ top: a, bottom: b }, { top: c, bottom: d }) => fraction(a * d - b * c)(b * d),
  degree: () => 1,
  div: ({ top: a, bottom: b }, { top: c, bottom: d }) => fraction(a * d)(b * c),
  /* This is cheating, but how else? */
  mod: (x, y) => fraction(fold(x) % fold(y))(1)
}

/**
 * @category instances
 */
export const sumMonoid: Mn.Monoid<Fraction> = {
  concat: Field.add,
  empty: Field.zero
}
