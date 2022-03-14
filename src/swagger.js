const swaggerAutogen = require('swagger-autogen')();

const outputFile = 'src/swagger_output.json';
const endpointsFiles = ['src/controllers/TokenStatsController.ts', 'src/controllers/DappsStakingController.ts'];

const doc = {
  info: {
      version: "1.0.0",
      title: "Astar token statistics API",
      description: "Provides network statistic information."
  }
};

swaggerAutogen(outputFile, endpointsFiles, doc);
