module.exports = {
  clearMocks: true,
  automock: true,
  roots: [ './src' ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  testRegex: '(/__tests__/.*\\.(test|spec))\\.ts$',
  moduleFileExtensions: [ 'ts', 'js', 'json', 'node' ],
  collectCoverageFrom: ['./**/*'],
  "coveragePathIgnorePatterns": [
    '__tests__',
    '.*\.d\.ts',
    '.*\.json',
    'node_modules',
  ],
}
