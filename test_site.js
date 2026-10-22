const http = require('http');

const endpoints = [
  '/',
  '/index.html',
  '/portfolio.html',
  '/galeria.html',
  '/estudos.html',
  '/sobre.html',
  '/orcamentos.html',
  '/anamnese.html',
  '/contato.html',
  '/css/variables.css',
  '/css/base.css',
  '/css/header.css',
  '/css/footer.css',
  '/css/hero.css',
  '/css/carousel.css',
  '/css/gallery.css',
  '/css/forms.css',
  '/css/components.css',
  '/js/config.js',
  '/js/main.js',
  '/js/carousel.js',
  '/js/lightbox.js',
  '/js/portfolio.js',
  '/js/gallery.js',
  '/js/estudos.js',
  '/js/budget-form.js',
  '/js/anamnese-form.js',
  '/Portifolio/logo.png',
  '/Portifolio/quadros/quadro 1.png',
  '/Portifolio/quadros/quadro 2.png',
  '/Portifolio/minha foto/eu.mp4',
  '/Portifolio/minha foto/My_first_board_Realistic_3D_CGI_Render_Tattoo_Artist_0BKq6n05.jpg'
];

async function checkUrl(path) {
  return new Promise((resolve) => {
    http.get('http://localhost:3000' + encodeURI(path), (res) => {
      let dataLen = 0;
      res.on('data', chunk => dataLen += chunk.length);
      res.on('end', () => {
        resolve({ path, status: res.statusCode, length: dataLen });
      });
    }).on('error', (err) => {
      resolve({ path, status: 'ERROR', error: err.message });
    });
  });
}

async function run() {
  console.log('Testing GuinkNass site endpoints on http://localhost:3000 ...\n');
  let passCount = 0;
  for (const ep of endpoints) {
    const res = await checkUrl(ep);
    const pass = res.status === 200 && res.length > 0;
    if (pass) passCount++;
    console.log(`${pass ? 'PASS' : 'FAIL'} [${res.status}] ${ep} (${res.length} bytes)`);
  }
  console.log(`\nResults: ${passCount} / ${endpoints.length} endpoints passed.`);
}

run();
