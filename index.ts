import * as IOE from 'fp-ts/IOEither'
import * as RA from 'fp-ts/ReadonlyArray'
import * as RR from 'fp-ts/ReadonlyRecord'
import * as O from 'fp-ts/Option'
import * as T from 'fp-ts/ReadonlyTuple'
import { pipe, flow } from 'fp-ts/function'

import * as Bet from './src/Bet'
import * as S from './src/Strategy'
import * as DD from './src/DiscreteDistribution'

const STARTING_TOTAL = 1000
const NUMBER_OF_SPINS = 35

const BET_ON_ONE = 69
const BET_ON_THREE = 0
const BET_ON_FIVE = 0
const BET_ON_TEN = 0
const BET_ON_TWENTY = 0

enum WheelNumbers {
  One = '1',
  Three = '3',
  Five = '5',
  Ten = '10',
  Twenty = '20'
}

const strategy = pipe(
  {
    [WheelNumbers.One]: Bet.bet(WheelNumbers.One, 2, 12, 25)(BET_ON_ONE),
    [WheelNumbers.Three]: Bet.bet(WheelNumbers.Three, 4, 6, 25)(BET_ON_THREE),
    [WheelNumbers.Five]: Bet.bet(WheelNumbers.Five, 6, 4, 25)(BET_ON_FIVE),
    [WheelNumbers.Ten]: Bet.bet(WheelNumbers.Ten, 12, 2, 25)(BET_ON_TEN),
    [WheelNumbers.Twenty]: Bet.bet(WheelNumbers.Twenty, 25, 1, 25)(BET_ON_TWENTY)
  },
  RR.sequence(O.Applicative)
)

const rustWheel = pipe(
  strategy,
  O.map(RR.toReadonlyArray),
  O.map(RA.map(flow(T.snd, Bet.toProbability))),
  O.chain(DD.fromArray)
)

const spin = pipe(
  rustWheel,
  IOE.fromOption(() => 'Invalid probability'),
  IOE.chain(flow(DD.fold, (a) => IOE.fromIO(a)))
)

const spinTimes: (times: number) => IOE.IOEither<string, ReadonlyArray<WheelNumbers>> = (
  times
) =>
  pipe(
    RA.makeBy(times, () => spin),
    IOE.sequenceArray
  )

const getPrioriStats = S.getPrioriStatistics(NUMBER_OF_SPINS)

const main = pipe(
  IOE.Do,
  IOE.bind('strategy', () =>
    pipe(
      strategy,
      IOE.fromOption(() => 'Invalid probability')
    )
  ),
  IOE.bind('spins', () => spinTimes(NUMBER_OF_SPINS)),
  IOE.bind('prioriStats', ({ strategy }) => IOE.right(getPrioriStats(strategy))),
  IOE.map(({ spins, strategy, prioriStats: [expectedValue, variance] }) =>
    pipe(
      spins,
      RA.reduce(STARTING_TOTAL, S.calculateGains(strategy)),
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
