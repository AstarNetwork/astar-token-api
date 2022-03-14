const swaggerAutogen = require('swagger-autogen')();

const outputFile = 'src/swagger_output.json';
const endpointsFiles = ['src/controllers/TokenStatsController.ts', 'src/controllers/DappsStakingController.ts'];

swaggerAutogen(outputFile, endpointsFiles);
