import * as ittyRouter from 'itty-router'

type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;

import {IRequest, Route, RouteHandler, RouterOptions, RouterType, UniversalRoute} from "itty-router/Router";

export * from 'itty-router'

export interface Params<Env = any> {
  handle(env: Env, context: ExecutionContext): Response

  pathParamHandle(path: string, env: Env, context: ExecutionContext): Response
}

export const Router: <RequestType = IRequest, Args extends any[] = Parameters<Params['handle']>, RouteType = Equal<RequestType, IRequest> extends true ? Route : UniversalRoute<RequestType, Args>>({
                                                                                                                                                                                                      base,
                                                                                                                                                                                                      routes
                                                                                                                                                                                                    }?: RouterOptions) => RouterType<RouteType, Args> =
  ittyRouter.Router as any;

export type SubRoute = <RequestType = IRequest, Args extends Parameters<Params['pathParamHandle']> = Parameters<Params['pathParamHandle']>, RT = RouterType>(path: string, ...handlers: RouteHandler<RequestType, Args>[]) => RT;

export type UniversalSubRoute<RequestType = IRequest, Args extends Parameters<Params['pathParamHandle']> = Parameters<Params['pathParamHandle']>> = (path: string, ...handlers: RouteHandler<RequestType, Args>[]) => RouterType<UniversalRoute<RequestType, Args>, Args>;

export const SubRouter:
  <RequestType = IRequest, Args extends Parameters<Params['pathParamHandle']> = Parameters<Params['pathParamHandle']>, RouteType = Equal<RequestType, IRequest> extends true ? SubRoute : UniversalRoute<RequestType, Args>>({
                                                                                                                                                                                                                               base,
                                                                                                                                                                                                                               routes
                                                                                                                                                                                                                             }?: RouterOptions) => RouterType<RouteType, Args> =
  ittyRouter.Router as any;


export function fromHerePath(req: Request, prefixPath: string) {
  const url = new URL(req.url)
  let path = url.pathname
  if (path.startsWith(prefixPath))
    path = path.slice(prefixPath.length)
  return path
}


export function splitPath(path: string) {
  if (path.startsWith('/')) path = path.substring(1)
  if (path.endsWith('/')) path = path.substring(0, path.length - 1)
  return path.split('/')
}

