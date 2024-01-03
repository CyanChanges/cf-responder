export interface BaseResponse<T = any> {
  code?: number
  message?: string
  data?: T | null
}

export type Response = BaseResponse | BodyInit

export type cfResponse = globalThis.Response

export const responseTemplate: BaseResponse = {
  code: 200,
  message: 'success',
  data: null
}

function empty() {
  return {}
}

function dupe(obj: object) {
  return Object.assign({}, obj)
}

function nl() {
  return Object.create(null)
}

export abstract class Responder {
  get defaultHeaders(): any {
    return Object.assign(empty(), this._defaultHeaders);
  }

  set defaultHeaders(value: any) {
    this._defaultHeaders = value
  }

  private readonly resp: { new(body: (BodyInit | null), init?: ResponseInit): cfResponse };
  private _defaultHeaders = Object.create(null)

  constructor(responseClass: new (body: BodyInit | null, init?: ResponseInit) => cfResponse) {
    this.resp = responseClass
  }

  get template() {
    return Object.assign(empty(), responseTemplate)
  }

  status(code: number, body?: BodyInit) {
    return new this.resp(body ?? null, {
      status: code
    })
  }

  reject404(message: string) {
    return this.respond({
      code: 404,
      message
    })
  }

  notFound(url: string): cfResponse
  notFound(url: URL): cfResponse

  notFound(url: string | URL) {
    url = url instanceof URL ? url : new URL(url)
    return this.respond({
      code: 404,
      message: `can't find route for ${url.pathname}`
    })
  }

  respondData(data: any, message: string = 'success', code: number = 200) {
    return this.respond({
      code,
      message,
      data: data ?? null
    })
  }

  respondWith(data: any, code: number = 200, contentType: string = 'text/plain') {
    return this.respond({
      code,
      message: code == 200 ? 'success' : 'error',
      data: data ?? null
    }, {
      'content-type': contentType
    })
  }

  abstract parse(obj: BaseResponse | null | object): [BodyInit | null, string?]

  respond(status: number, obj: BaseResponse, headers?: any): cfResponse
  respond(obj: BaseResponse | undefined | null, header?: any): cfResponse
  respond(...args: any[]): cfResponse {
    let headerOptions = this.defaultHeaders
    let status = null
    let obj: BaseResponse | null
    const stats = obj = args.shift()
    if (typeof stats == 'number') {
      status = stats
      obj = args.shift() ?? null
    }
    let headerUpdate = args.shift() ?? empty()
    let resp = Object.assign(this.template, obj)
    status ??= resp.code ?? 200
    if (obj) {
      headerOptions['x-code'] = obj?.code
      headerOptions['x-message'] = obj?.message
    }
    const [body, contentType] = this.parse(obj)
    if (contentType) headerOptions['content-type'] = contentType
    const headers = Object.assign(dupe(headerOptions), dupe(headerUpdate)) as HeadersInit

    return new this.resp(body, {
      status, headers
    })
  }

  json(obj: object, status = 200) {
    const [body, contentType] = this.parse(obj)
    return new this.resp(body, {
      status, headers: Object.assign(this.defaultHeaders, {
        'content-type': contentType
      })
    })
  }

  async forward(target: URL | string | Request, init?: RequestInit) {
    const res = await fetch(target, init)

    return this.respond({
      code: res.status,
      message: res.statusText,
      data: res.body,
    }, res.headers)
  }

  async cachedForward(context: ExecutionContext, request: Request, target: URL | string | Request, init?: RequestInit) {
    const response = await this.forward(target, init)
    context.waitUntil(caches.default.put(request as any, response.clone()))
    return response
  }

  redirect(location: string, code: 301 | 302 = 302) {
    const headers = this.defaultHeaders
    headers['location'] = location
    return new this.resp(null, {
      status: code, headers
    })
  }
}

export class ContentLikeResponder extends Responder {
  parse(obj: BaseResponse | null): [BodyInit | null, string | undefined] {
    if (obj)
      return [obj.data ?? 'No data.', undefined];
    return [null, undefined]
  }
}

class JSONLikeResponder extends Responder {
  parse(obj: BaseResponse | object): [BodyInit, string | undefined] {
    return [JSON.stringify(obj), ""];
  }
}

export namespace Responder {
  export let it: Responder

  export function init(type: 'content' | 'json') {
    switch (type) {
      case "json":
        it = new JSONLikeResponder(Response)
        break
      case "content":
      default:
        it = new ContentLikeResponder(Response)
    }
  }

  function _checkInit() {
    if (typeof it === 'undefined')
      throw new Error("Router has not been initialized yet. Use Route.init() to initialize.")
  }

  function _checkStatic() {
    if (!staticBase)
      throw new Error("staticBase has not set yet. Use Route.setStatic() to set it.")
  }

  export function servStatic(part = 'content', path: string, init?: RequestInit) {
    _checkInit()
    _checkStatic()
    return it.forward(staticBase + `/${part}${path}`, init)
  }

  export function cachedServStatic(req: Request, ctx: ExecutionContext, part = 'static', path: string, init?: RequestInit) {
    _checkInit()
    _checkStatic()
    return it.cachedForward(ctx, req, staticBase + `/${part}${path}`, init)
  }

  export let staticBase: string = ''

  export function setStatic(newStaticBase: string) {
    staticBase = newStaticBase
  }
}

export default Responder
