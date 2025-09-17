import serverlessExpress from '@vendia/serverless-express';
import app from '../../server.js';

// Create serverless handler
const handler = serverlessExpress({ app });

export { handler };