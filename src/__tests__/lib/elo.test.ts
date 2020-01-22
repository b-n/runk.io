jest.unmock('../../lib/elo')
jest.unmock('lodash/round')
import { calculateNewRatings } from '../../lib/elo'

test('1000,1000 draw', () => {
  expect(calculateNewRatings(1000, 1000, 0.5))
    .toEqual([1000, 1000])
})

test('1000,1000 p1', () => {
  expect(calculateNewRatings(1000, 1000, 1))
    .toEqual([1016, 984])
})

test('1000,1000 p2', () => {
  expect(calculateNewRatings(1000, 1000, 0))
    .toEqual([984, 1016])
})

test('2200,2000 draw', () => {
  expect(calculateNewRatings(2200, 2000, 0.5))
    .toEqual([2193.77, 2008.31])
})

test('2000,2200 draw', () => {
  expect(calculateNewRatings(2000, 2200, 0.5))
    .toEqual([2008.31, 2193.77])
})

test('2200,2000 p1', () => {
  expect(calculateNewRatings(2200, 2000, 1))
    .toEqual([2205.77, 1992.31])
})

test('2200,2000 p2', () => {
  expect(calculateNewRatings(2200, 2000, 0))
    .toEqual([2181.77, 2024.31])
})

test('2000,2200 p1', () => {
  expect(calculateNewRatings(2000, 2200, 1))
    .toEqual([2024.31, 2181.77])
})

test('2000,2200 p2', () => {
  expect(calculateNewRatings(2000, 2200, 0))
    .toEqual([1992.31, 2205.77])
})

test('2500,2000 draw', () => {
  expect(calculateNewRatings(2500, 2000, 0.5))
    .toEqual([2492.85, 2014.3])
})

test('2700,2700 draw', () => {
  expect(calculateNewRatings(2700, 2700, 0.5))
    .toEqual([2700, 2700])
})

test('2700,1000 draw', () => {
  expect(calculateNewRatings(2700, 1000, 0.5))
    .toEqual([2692, 1016])
})
