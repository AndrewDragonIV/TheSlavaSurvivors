const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    // Получаем путь из URL
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    // Определяем MIME-тип файла
    const extname = path.extname(filePath);
    let contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
            contentType = 'image/jpg';
            break;
        case '.ico':
            contentType = 'image/x-icon';
            break;
    }

    // Читаем файл
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if(error.code == 'ENOENT') {
                // Если файл не найден в корневой директории, 
                // пробуем искать в папке assets для изображений
                if (extname === '.png' || extname === '.jpg' || extname === '.ico') {
                    const assetPath = './assets' + req.url;
                    fs.readFile(assetPath, (err, assetContent) => {
                        if (err) {
                            res.writeHead(404);
                            res.end('File not found: ' + req.url);
                        } else {
                            res.writeHead(200, { 'Content-Type': contentType });
                            res.end(assetContent, 'binary');
                        }
                    });
                } else {
                    res.writeHead(404);
                    res.end('File not found: ' + req.url);
                }
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'binary');
        }
    });
});

const port = 3000;
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
