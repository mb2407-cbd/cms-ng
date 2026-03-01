/**
 * Script to connect to MongoDB Atlas and extract sample program documents
 * to understand the schema structure for building the Program Detail UI.
 */
const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://adminstg:directv@ssla-stg-ingestion.jfkke.mongodb.net/';
const DATABASE_NAME = 'masterEntity';

async function exploreProgramSchema() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✓ Connected successfully\n');

    const db = client.db(DATABASE_NAME);

    // Get collection names
    console.log('=== Available Collections ===');
    const collections = await db.listCollections().toArray();
    collections.forEach(col => console.log(`  - ${col.name}`));
    console.log();

    // Get program collection stats
    const programCollection = db.collection('program');
    const programCount = await programCollection.countDocuments();
    console.log(`=== Program Collection Stats ===`);
    console.log(`Total programs: ${programCount}\n`);

    // Sample different program types
    const programTypes = ['MV', 'SH', 'EP', 'SP', 'SE'];

    for (const type of programTypes) {
      console.log(`\n=== Sample ${type} Program ===`);
      const sample = await programCollection.findOne(
        { programType: type },
        { limit: 1 }
      );

      if (sample) {
        console.log(`Program ID: ${sample.id || sample._id}`);
        console.log(`Type: ${sample.programType}`);
        console.log(`Title: ${sample.englishTitle?.value || sample.titles?.[0]?.value || 'N/A'}`);
        console.log(`Has Images: ${sample.images?.length > 0 || Object.keys(sample.pictures || {}).length > 0}`);
        console.log(`Published: ${sample.published}`);
        console.log(`Content Lock: ${sample.contentLock}`);
        console.log('\nFull document structure:');
        console.log(JSON.stringify(sample, null, 2));
        console.log('\n' + '='.repeat(80));
      } else {
        console.log(`No ${type} program found`);
      }
    }

    // Get one program with rich metadata (movie with images, ratings, cast)
    console.log('\n\n=== Rich Movie Example (with images, cast, ratings) ===');
    const richMovie = await programCollection.findOne(
      {
        programType: 'MV',
        'images.0': { $exists: true },
        'credits.0': { $exists: true },
        'ratings.0': { $exists: true }
      },
      { limit: 1 }
    );

    if (richMovie) {
      console.log('Found rich movie example:');
      console.log(JSON.stringify(richMovie, null, 2));
    }

    // Get one sports episode with sportsInfo
    console.log('\n\n=== Sports Episode Example (with sportsInfo) ===');
    const sportsEpisode = await programCollection.findOne(
      {
        programType: { $in: ['SE', 'SP'] },
        'sportsInfo': { $exists: true }
      },
      { limit: 1 }
    );

    if (sportsEpisode) {
      console.log('Found sports episode example:');
      console.log(JSON.stringify(sportsEpisode, null, 2));
    }

    // Get schema keys from a sample
    console.log('\n\n=== Common Program Fields ===');
    const sampleProgram = await programCollection.findOne({}, { limit: 1 });
    if (sampleProgram) {
      const keys = Object.keys(sampleProgram);
      console.log('Total fields:', keys.length);
      console.log('Field names:');
      keys.sort().forEach(key => {
        const value = sampleProgram[key];
        const type = Array.isArray(value) ? 'array' : typeof value;
        const arrayLength = Array.isArray(value) ? ` (${value.length} items)` : '';
        console.log(`  ${key}: ${type}${arrayLength}`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    await client.close();
    console.log('\n\nConnection closed.');
  }
}

exploreProgramSchema().catch(console.error);
