import * as RA from 'fp-ts/ReadonlyArray'
import * as RR from 'fp-ts/ReadonlyRecord'
import * as IOE from 'fp-ts/IOEither'
import * as IO from 'fp-ts/IO'
import * as RNEA from 'fp-ts/ReadonlyNonEmptyArray'
import * as O from 'fp-ts/Option'
import { flow, identity, pipe } from 'fp-ts/function'

import * as Bet from './src/Bet'
import * as Pop from './src/Population'
import * as P from './src/Probability'
import * as Fr from './src/Fraction'
import * as I from './src/Individual'

enum WheelNumbers {
  One = '1',
  Three = '3',
  Five = '5',
  Ten = '10',
  Twenty = '20'
}

const wheelNumbers: RR.ReadonlyRecord<WheelNumbers, WheelNumbers> = {
  [WheelNumbers.One]: WheelNumbers.One,
  [WheelNumbers.Three]: WheelNumbers.Three,
  [WheelNumbers.Five]: WheelNumbers.Five,
  [WheelNumbers.Ten]: WheelNumbers.Ten,
  [WheelNumbers.Twenty]: WheelNumbers.Twenty
}

const POPULATION_SIZE = 1000
const NUMBER_OF_GENERATIONS = 100
const NUMBER_OF_OFFSPRING = 4
const DEATHS_PER_GENERATION = 750

const MUTATION_SCALE_FACTOR = 1.001

const ODDS_OF_MUTATION = Fr.fraction(1)(10000)

const strategy = {
  [WheelNumbers.One]: Bet.bet(WheelNumbers.One, 2, 12, 25),
  [WheelNumbers.Three]: Bet.bet(WheelNumbers.Three, 4, 6, 25),
  [WheelNumbers.Five]: Bet.bet(WheelNumbers.Five, 6, 4, 25),
  [WheelNumbers.Ten]: Bet.bet(WheelNumbers.Ten, 12, 2, 25),
  [WheelNumbers.Twenty]: Bet.bet(WheelNumbers.Twenty, 25, 1, 25)
}

const main: IO.IO<string> = pipe(
  IOE.Do,
  IOE.bind('pMut', () =>
    pipe(
      ODDS_OF_MUTATION,
      P.fromFraction('odds of mutation'),
      IOE.fromOption(() => 'invalid odds of mutation')
    )
  ),
  IOE.bind('mate', ({ pMut }) =>
    pipe(
      I.getSemigroup(wheelNumbers, pMut, () => Math.random() * MUTATION_SCALE_FACTOR + 1),
      (a) => IOE.right(a)
    )
  ),
  IOE.bind('firstGeneration', () =>
    pipe(
      strategy,
      Pop.makeGeneration([0, 10], POPULATION_SIZE),
      IOE.fromOption(() => 'Invalid first population')
    )
  ),
  IOE.bind('evolve', ({ mate }) =>
    pipe(Pop.getEvolve(DEATHS_PER_GENERATION, mate, NUMBER_OF_OFFSPRING), (a) =>
      IOE.right(a)
    )
  ),
  IOE.bind('generations', () =>
    pipe(RA.makeBy(NUMBER_OF_GENERATIONS, identity), (a) => IOE.right(a))
  ),
  IOE.map(({ evolve, firstGeneration, generations }) =>
    pipe(generations, RA.reduce(firstGeneration, evolve))
  ),
  IOE.chain((genX) =>
    pipe(
      genX,
      RNEA.fromReadonlyArray,
      O.map(RNEA.max(I.getOrd<WheelNumbers>())),
      IOE.fromOption(() => 'Population died out :-(')
    )
  ),
  IOE.fold(flow(identity, IO.of), ({ fitness, entity }) =>
    IO.of(
      `fitness: ${fitness}; bets: ${RR.getShow<Bet.Bet<WheelNumbers>>(
        Bet.getShow<WheelNumbers>()
      ).show(entity)}`
    )
  )
)

console.log(main())
