import {readEnvironment} from '../server/environment.mjs';
try {
  readEnvironment();
  console.log('Academy server configuration is valid. No environment values were printed.');
} catch(error) {
  console.error(error.code==='ACADEMY_CONFIG'?error.message:'Configuration could not be checked.');
  process.exitCode=1;
}
