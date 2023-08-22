const swaggerAutogen = require('swagger-autogen')();

const outputFile = 'public/swagger.json';
const endpointsFiles = [
    'src/controllers/TokenStatsController.ts',
    'src/controllers/DappsStakingController.ts',
    'src/controllers/NodeController.ts',
    'src/controllers/TxQueryController.ts',
    'src/controllers/MonthlyActiveWalletsController.ts',
];

const getDocumentation = (host) => ({
    info: {
        version: '1.0.1',
        title: 'Astar token statistics API',
        description: 'Provides Astar networks statistic information.',
    },
    host: host ? host : 'localhost:3000',
    schemes: ['https', 'http'],
});

const args = process.argv.slice(2); // first two args are 'node' and command name
swaggerAutogen(outputFile, endpointsFiles, getDocumentation(args[0]));
