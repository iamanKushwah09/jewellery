import { createServer } from 'vite';

async function test() {
  try {
    const server = await createServer({
      configFile: './vite.config.js',
      server: { middlewareMode: true }
    });
    console.log('Loading /src/main.jsx...');
    await server.ssrLoadModule('/src/main.jsx');
    console.log('Successfully loaded /src/main.jsx without errors!');
    await server.close();
  } catch (err) {
    console.error('ERROR LOADING /src/main.jsx:');
    console.error(err);
    process.exit(1);
  }
}

test();
