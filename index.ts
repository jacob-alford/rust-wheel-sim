import * as IO from 'fp-ts/IO'
import * as RA from 'fp-ts/ReadonlyArray'
import * as O from 'fp-ts/Option'
import { pipe, flow } from 'fp-ts/function'

import * as P from './src/Probability'
import * as F from './src/Fraction'
import * as WD from './src/WheelDistribution'

const wheelOne: O.Option<P.Probability<number>> = P.fromFraction(1)(F.fraction(12)(25))

const wheelThree: O.Option<P.Probability<number>> = P.fromFraction(3)(F.fraction(6)(25))

const wheelFive: O.Option<P.Probability<number>> = P.fromFraction(4)(F.fraction(4)(25))

const wheelTen: O.Option<P.Probability<number>> = P.fromFraction(10)(F.fraction(2)(25))

const wheelTwenty: O.Option<P.Probability<number>> = P.fromFraction(20)(F.fraction(1)(25))

const rustWheel: O.Option<WD.WheelDistribution<number>> = pipe(
  [wheelOne, wheelThree, wheelFive, wheelTen, wheelTwenty],
  RA.sequence(O.Applicative),
  O.chain(WD.fromArray)
)

const spin: IO.IO<string> = pipe(
  rustWheel,
  O.fold(
    () => IO.of('Invalid probability'),
    flow(
      WD.foldNumberIO,
      IO.map((value) => `Spun a ${value}`)
    )
  )
)

const spinTimes: (times: number) => IO.IO<ReadonlyArray<string>> = (times) => () =>
  RA.makeBy(times, spin)

console.log(spinTimes(25)())
