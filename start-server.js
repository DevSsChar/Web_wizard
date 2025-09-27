// Simple server starter
import('./backend/server.mjs').then(({ startServer }) => {
  startServer();
}).catch(console.error);