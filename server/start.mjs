import http from 'node:http';
import {application} from './application.mjs';
import {nodeHandler} from './http.mjs';

const port=Number(process.env.PORT||3000);
try {
  const app=await application(),server=http.createServer(nodeHandler(app));
  server.headersTimeout=20000;server.requestTimeout=30000;server.keepAliveTimeout=5000;
  server.listen(port,'0.0.0.0',()=>console.log('DigitalBurj Academy listening on port '+port));
  let stopping=false;
  const stop=()=> {
    if(stopping)return;stopping=true;
    server.close(()=>{app.close();process.exit(0)});
    const deadline=setTimeout(()=>process.exit(1),10000);deadline.unref();
  };
  process.on('SIGTERM',stop);process.on('SIGINT',stop);
} catch(error) {
  console.error(error.code==='ACADEMY_CONFIG'?error.message:'Academy startup failed. Check the database connection and run npm run db:migrate.');
  process.exitCode=1;
}
