import 'dotenv/config';
import { seedModels } from '../data/models.data';
import { seedPromptTemplates } from '../data/prompt-templates.data';

async function seed() {
  const mongoUri = process.env.MONGODB_URI ?? '';
  const usingMongo = Boolean(mongoUri) && !mongoUri.includes('username:password');

  console.log(
    JSON.stringify(
      {
        models: seedModels.length,
        templates: seedPromptTemplates.length,
        mode: usingMongo ? 'mongo-configured' : 'fallback-memory',
        timestamp: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
}

void seed();
