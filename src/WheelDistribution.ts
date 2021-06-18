import * as RNEA from 'fp-ts/ReadonlyNonEmptyArray'
import * as RA from 'fp-ts/ReadonlyArray'
import * as O from 'fp-ts/Option'
import * as IO from 'fp-ts/IO'
import * as B from 'fp-ts/boolean'
import { pipe, flow } from 'fp-ts/function'
import * as R from 'fp-ts/Random'

import * as P from './Probability'
import * as Fr from './Fraction'

/**
 * @category model
 */
export interface WheelDistribution<A>
  extends RNEA.ReadonlyNonEmptyArray<P.Probability<A>> {}

/**
 * @category constructors
 */
export const fromArray: <A>(
  arr: ReadonlyArray<P.Probability<A>>
) => O.Option<WheelDistribution<A>> = (ps) =>
  pipe(
    ps,
    O.fromPredicate(
      flow(RA.foldMap(Fr.sumMonoid)(P.toFraction), (sum) =>
        Fr.Ord.equals(sum, Fr.Field.one)
      )
    ),
    O.chain(RNEA.fromReadonlyArray),
    O.chain((ps) =>
      pipe(
        ps,
        O.fromPredicate(
          RNEA.foldMap(B.MonoidAll)(({ p }) => p.bottom === RNEA.head(ps).p.bottom)
        ),
        O.map(() => ps)
      )
    )
  )

/**
 * @category utility
 */
export const foldNumberIO: <A>(ps: WheelDistribution<A>) => IO.IO<A> = flow(
  RNEA.chain(({ p, value }) =>
    RNEA.concat(
      RA.makeBy(p.top - 1, () => value),
      RNEA.of(value)
    )
  ),
  R.randomElem
)
