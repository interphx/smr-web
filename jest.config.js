const path = require('path');

module.exports = {
    roots: [path.resolve(__dirname)],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest'
    },
    testRegex: '(/test/.*|(\\.|/)(test|spec))\\.[jt]sx?$',
    moduleFileExtensions: [
        'ts', 'tsx', 'js', 'jsx', 'json', 'node'
    ],
    moduleDirectories: ['node_modules', 'src'],
    collectCoverageFrom: [
        'src/**/*.{ts,tsx,js,jsx}'
    ],
    coverageReporters: [
        'text',
        'text-summary'
    ]
};