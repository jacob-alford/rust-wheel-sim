import * as RR from 'fp-ts/ReadonlyRecord'
import * as N from 'fp-ts/number'
import { pipe } from 'fp-ts/function'

import { Bet } from './Bet'
import * as F from './Fraction'

/**
 * @category model
 */
export type Strategy<Keys extends string> = Readonly<Record<Keys, Bet<Keys>>>

/**
 * @category utilities
 */
export const calculateGains: <Keys extends string>(
  strategy: Strategy<Keys>
) => (total: number) => (key: Keys) => number = (strategy) => (total) => (key) =>
  pipe(
    strategy,
    RR.filter((bet) => bet.p.value !== key),
    RR.foldMap(N.MonoidSum)(({ stake }) => stake),
    (totalLostToStakes) =>
      total - totalLostToStakes + strategy[key].payout * strategy[key].stake
  )

/**
 * @category utilities
 */
export const prioriStatistics: (
  turns: number
) => <Keys extends string>(strategy: Strategy<Keys>) => [number, number] =
  (turns) => (strategy) => {
    const totalLostToStakes = pipe(
      strategy,
      RR.foldMap(N.MonoidSum)(({ stake }) => stake)
    )
    const Exp_x_ = pipe(
      strategy,
      RR.reduce(
        0,
        (total, { stake, p: { p }, payout }) =>
          total + F.fold(p) * (payout * stake - (totalLostToStakes - stake))
      )
    )
    const Exp_x2_ = pipe(
      strategy,
      RR.reduce(
        0,
        (total, { stake, p: { p }, payout }) =>
          total + F.fold(p) * Math.pow(payout * stake - (totalLostToStakes - stake), 2)
      )
    )
    const Exp_x_2 = Math.pow(Exp_x_, 2)
    const n = turns
    const n2 = Math.pow(turns, 2)
    return [n * Exp_x_, n2 * (Exp_x2_ - Exp_x_2)]
  }
