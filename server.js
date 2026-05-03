import { createApp } from './src/server/app.js';

const app = createApp();
const port = process.env.PORT || 8080;
const host = '0.0.0.0'; // Essential for Cloud Run

app.listen(port, host, () => {
  console.log(`VoteSahayak Server running on port ${port} with host ${host}`);
});

