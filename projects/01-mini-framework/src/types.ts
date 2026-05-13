import type { IncomingMessage, ServerResponse } from 'http';

export interface Request extends IncomingMessage {
  params: Record<string, string>;
  query: Record<string, string>;
  body: unknown;
}

export interface Response extends ServerResponse {
  statusCode: number;
  json: (data: unknown) => void;
  status: (code: number) => Response;
}

export type NextFunction = () => void;

export type Middleware = (req: Request, res: Response, next: NextFunction) => void;

export interface Route {
  method: string;
  path: string;
  handler: Middleware;
}

