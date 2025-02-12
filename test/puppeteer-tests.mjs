import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs';
import path from 'path';
import assert from 'assert';

const hostname = process.env.HOST || '127.0.0.1'; // use hostname 127.0.0.1 unless there exists a preconfigured port
const port = process.env.PORT || 8080; // use port 8080 unless there exists a preconfigured port

const server = http.createServer(function (request, response) {
  let filePath = request.url;

  if (filePath == '/') {
    filePath = 'index.html';
  }
  else {
    filePath = './' + request.url;
  }

  let extname = String(path.extname(filePath)).toLowerCase();
  let mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm',
    '.ico': 'image/x-icon'
  };

  let contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, function (error, content) {
    if (error) {
      if (error.code == 'ENOENT') {
        fs.readFile('public/404.html', function (error, content) {
          response.writeHead(404, { 'Content-Type': 'text/html' });
          response.end(content, 'utf-8');
        });
      }
      else {
        response.writeHead(500);
        response.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
      }
    }
    else {
      response.writeHead(200, { 'Content-Type': contentType });
      response.end(content, 'utf-8');
    }
  });
});
function timeoutPromise(timeout, callback) {
  return new Promise((resolve, reject) => {
      // Set up the timeout
      const timer = setTimeout(() => {
          reject(new Error(`Promise timed out after ${timeout} ms`));
      }, timeout);

      // Set up the real work
      callback(
          (value) => {
              clearTimeout(timer);
              resolve(value);
          },
          (error) => {
              clearTimeout(timer);
              reject(error);
          }
      );
  });
}
(async () => {

  server.listen(port, hostname);

  // Launch the browser and open a new blank page

  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // Navigate the page to a URL
  await page.goto('http://'+hostname+':'+port+'/test/opt.html');

  // Set screen size
  await page.setViewport({ width: 1080, height: 1024 });

  // Type into search box
  const testResult = await timeoutPromise(10000, (resolve, reject) => {
    page.on('console', consoleMessage => {
      if (consoleMessage.type() === 'log') {
        const res = JSON.parse(consoleMessage.text());
        if (res.stats !== undefined){
          resolve(res.stats);
        }
      }
    });
  });

  assert.strictEqual(testResult.failures, 0, "Tests: passed: " + testResult.passes + ", fail: " + testResult.failures + ", total:" + testResult.tests);
  assert.strictEqual(testResult.tests, testResult.passes, "Tests: " + testResult.passes + "/" + testResult.tests);
  console.log("Tests: " + testResult.passes + "/" + testResult.tests);
  
  await browser.close();
  server.close();
})();

