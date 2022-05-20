const swaggerAutogen = require('swagger-autogen')();

const outputFile = 'src/swagger_output.json';
const endpointsFiles = [
    'src/controllers/TokenStatsController.ts',
    'src/controllers/DappsStakingController.ts',
    'src/controllers/NodeController.ts',
    'src/controllers/GasController.ts',
];

const getDocumentation = (host) => ({
    info: {
        version: '1.0.0',
        title: 'Astar token statistics API',
        description: 'Provides network statistic information.',
    },
    host: host ? host : 'localhost:3000',
    schemes: ['http', 'https'],
});

const args = process.argv.slice(2); // first two args are 'node' and command name
swaggerAutogen(outputFile, endpointsFiles, getDocumentation(args[0]));
