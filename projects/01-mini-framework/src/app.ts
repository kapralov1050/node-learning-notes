import http from 'http';
import type { Request, Response, Middleware, Route } from './types.js';
import type { IncomingMessage, ServerResponse } from 'http';

function matchPath(pattern: string, url: string): Record<string, string> | null {
  const patternParts = pattern.split('/');
  const urlParts = url.split('/');

  if (patternParts.length !== urlParts.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    if(patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = urlParts[i];
    } else if (patternParts[i] !== urlParts[i]) {
      return null;
    }
  }

  return params;
}

function runChain(
  chain: Middleware[],
  req: Request, 
  res: Response,
): void {
  function next(index: number): void {
    if (index >= chain.length) return;
    chain[index](req, res, () => next(index + 1));
  }

  next(0);
}

export function createApp() {
  const middlewares: Middleware[] = [];
  const routes: Route[] = [];

  function use(middleware: Middleware): void {
    middlewares.push(middleware);
  }

  function addRoute(route: Route): void {
    routes.push(route);
  }

  function get(path: string, handler: Middleware):void {
    addRoute({ method: 'GET', path, handler });
  }

  function post(path: string, handler: Middleware):void {
    addRoute({ method: 'POST', path, handler });
  }
  
  function put(path: string, handler: Middleware):void {
    addRoute({ method: 'PUT', path, handler });
  }

  function del(path: string, handler: Middleware):void {
    addRoute({ method: 'DELETE', path, handler });
  }

function listen(port: number): void {
  http.createServer(async (rawReq: IncomingMessage, rawRes: ServerResponse) => {
    // 1. Собираем body
    let body = '';
    for await (const chunk of rawReq) {
      body += chunk;
    }

    // 2. Расширяем req
    const req = rawReq as Request;
    req.body = body ? JSON.parse(body) : null;
    req.params = {};
    req.query = {};

    // 3. Расширяем res
    const res = rawRes as Response;
    res.json = (data: unknown) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    };
    res.status = (code: number) => {
      res.statusCode = code;
      return res;
    };

    // 4. TODO: найти маршрут и запустить цепочку
    const method = req.method ?? '';
    const url = (req.url ?? '').split('?')[0];

    const route = routes.find(r => {
      if (r.method !== method) return false;
      return matchPath(r.path, url) !== null;
    })

    if (!route) {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }

    req.params = matchPath(route.path, url)!;
    runChain([...middlewares, route.handler], req, res)

  }).listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

  return {
    use,
    get,
    post,
    put,
    delete: del,
    listen
  }
}