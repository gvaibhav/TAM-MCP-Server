// Quick debug test to understand the ImfService fetchMarketSize behavior
const mockObservations = [
    { FREQ: 'A', TIME_PERIOD: '2022', value: 100 },
    { FREQ: 'A', TIME_PERIOD: '2023', value: 110 }
];

console.log('mockObservations[1]:', mockObservations[1]);

// Simulate the sorting logic
const sortedData = mockObservations.sort((a, b) => {
    const aYear = parseInt(a.TIME_PERIOD);
    const bYear = parseInt(b.TIME_PERIOD);
    if (!isNaN(aYear) && !isNaN(bYear)) {
        return bYear - aYear; // descending order (latest first)
    }
    return (b.TIME_PERIOD || '').localeCompare(a.TIME_PERIOD || '');
});

console.log('After sorting (latest first):', sortedData);
console.log('Latest record (sortedData[0]):', sortedData[0]);

const expectedResult = {
    value: 110,
    dimensions: mockObservations[1],
    source: 'IMF',
    dataset: 'FLOW',
    key: 'KEY.A'
};

const actualResult = {
    value: sortedData[0].value,
    dimensions: sortedData[0],
    source: 'IMF',
    dataset: 'FLOW',
    key: 'KEY.A'
};

console.log('\nExpected result:', expectedResult);
console.log('\nActual result:', actualResult);

console.log('\nAre they equal?', JSON.stringify(expectedResult) === JSON.stringify(actualResult));
