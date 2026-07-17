const http = require('http');

const data = JSON.stringify({
  isGuest: "true",
  redirect: "false"
});

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/auth/callback/credentials',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Host': '192.168.1.100:3000', // Pretend we are accessing via IP
    'Origin': 'http://192.168.1.100:3000'
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => { console.log(`BODY: ${body}`); });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
