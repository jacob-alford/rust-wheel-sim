import * as IOE from 'fp-ts/IOEither'
import * as RA from 'fp-ts/ReadonlyArray'
import * as RR from 'fp-ts/ReadonlyRecord'
import * as O from 'fp-ts/Option'
import * as T from 'fp-ts/ReadonlyTuple'
import { pipe, flow } from 'fp-ts/function'

import * as Bet from './src/Bet'
import * as S from './src/Strategy'
import * as WD from './src/WheelDistribution'

const STARTING_TOTAL = 0
const NUMBER_OF_SPINS = 1

enum WheelNumbers {
  One = '1',
  Three = '3',
  Five = '5',
  Ten = '10',
  Twenty = '20'
}

const strategy: O.Option<S.Strategy<WheelNumbers>> = pipe(
  {
    [WheelNumbers.One]: Bet.bet(WheelNumbers.One, 2, 12, 25)(10),
    [WheelNumbers.Three]: Bet.bet(WheelNumbers.Three, 4, 6, 25)(0),
    [WheelNumbers.Five]: Bet.bet(WheelNumbers.Five, 6, 4, 25)(0),
    [WheelNumbers.Ten]: Bet.bet(WheelNumbers.Ten, 12, 2, 25)(0),
    [WheelNumbers.Twenty]: Bet.bet(WheelNumbers.Twenty, 25, 1, 25)(0)
  },
  RR.sequence(O.Applicative)
)

const rustWheel: O.Option<WD.WheelDistribution<WheelNumbers>> = pipe(
  strategy,
  O.map(RR.toReadonlyArray),
  O.map(RA.map(flow(T.snd, Bet.toProbability))),
  O.chain(WD.fromArray)
)

const spin: IOE.IOEither<string, WheelNumbers> = pipe(
  rustWheel,
  IOE.fromOption(() => 'Invalid probability'),
  IOE.chain(flow(WD.fold, (a) => IOE.fromIO(a)))
)

const spinTimes: (times: number) => IOE.IOEither<string, ReadonlyArray<WheelNumbers>> = (
  times
) =>
  pipe(
    RA.makeBy(times, () => spin),
    IOE.sequenceArray
  )

const getPrioriExpectedValueAndVariance = S.prioriStatistics(NUMBER_OF_SPINS)

const main: IOE.IOEither<string, string> = pipe(
  strategy,
  IOE.fromOption(() => 'Invalid probability'),
  IOE.bindTo('strategy'),
  IOE.bind('spins', () => spinTimes(NUMBER_OF_SPINS)),
  IOE.bind('prioriStats', ({ strategy }) =>
    IOE.right(getPrioriExpectedValueAndVariance(strategy))
  ),
  IOE.map(({ spins, strategy, prioriStats: [expectedValue, variance] }) =>
    pipe(
      spins,
      RA.reduce(STARTING_TOTAL, (total, wheelNumber) =>
        S.calculateGains(strategy)(total)(wheelNumber)
      ),
      (total) =>
        `Number of spins: ${NUMBER_OF_SPINS}
Starting money: ${STARTING_TOTAL}
Priori winnings expectation: ${expectedValue}
Priori winnings variance: ${variance}
Total winnings: ${total}`
    )
  )
)

console.log(main())
