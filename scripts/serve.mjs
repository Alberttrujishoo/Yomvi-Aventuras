import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL(process.argv.includes('--dist') ? '../dist' : '..', import.meta.url)));
const port = Number(process.env.PORT || 8080);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4',
};

function parseRange(value, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match || (!match[1] && !match[2])) return null;

  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  return start <= end ? { start, end } : null;
}

const server = createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }

  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const path = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    const local = path.slice(root.length + 1);
    const allowed = local === 'index.html' || ['styles', 'src', 'assets'].includes(local.split(sep)[0]);
    const type = types[extname(path)];
    if (!path.startsWith(root + sep) || !allowed || !type) {
      response.writeHead(404).end();
      return;
    }

    const info = await stat(path);
    if (!info.isFile()) {
      response.writeHead(404).end();
      return;
    }
    const { size } = info;
    const range = request.headers.range ? parseRange(request.headers.range, size) : null;
    if (request.headers.range && !range) {
      response.writeHead(416, { 'Content-Range': 'bytes */' + size }).end();
      return;
    }
    const headers = {
      'Content-Type': type,
      'Content-Length': range ? range.end - range.start + 1 : size,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache',
    };
    if (range) headers['Content-Range'] = 'bytes ' + range.start + '-' + range.end + '/' + size;
    response.writeHead(range ? 206 : 200, headers);
    if (request.method === 'HEAD') response.end();
    else {
      const stream = createReadStream(path, range ?? {});
      stream.on('error', () => response.destroy());
      response.on('close', () => stream.destroy());
      stream.pipe(response);
    }
  } catch (error) {
    response.writeHead(error instanceof URIError ? 400 : 404).end();
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log('Yomvi Adventures en http://127.0.0.1:' + server.address().port);
});
