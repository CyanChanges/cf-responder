# cf-responder

## Examples


### Hello World!

```typescript
// src/index.ts
import r, {Router} from '@cyancy/cf-responder'
r.init("json") // Use `json` if your target is api
const {it} = r

const router = Router<Request, Parameters<Params<Env>['handle']>>()

router.get('/', (req) => r.respondData("Hello World"))

export interface Env {
  // Your Cloudflare Workers Env typing
}

export default {
  handle: router.handle
}
```

###
