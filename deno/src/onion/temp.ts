const route = (
  path: string,
  ...args: [...head: Middleware[], call: () => Response]
) => {
  const p = path;
  // const [...head, call] = args;
  // const head = args.slice(-1);
  if (args?.length > 1) {
    const head = args.slice(0, -1) as number[];
    const call = args.slice(-1)[0];
  }
  // console.log(head, call);
};

route("asdf", 1, 3, () => new Response());

const ss: ScopeConfig = {
  routes(builder) {
    builder.any("/*not_found", 1, 3, () => new Response());
  },
  scopes: {
    "/api": {
      middleware: [],
      routes(builder) {
        builder.get("/hello", 1, 3, () => new Response());
      },
      scopes: {
        "/v1": {
          middleware: [],
          scopes: {
            "/feature1": {
              middleware: [],
              routes(builder) {
                builder.get("/get", 1, 3, () => new Response());
              },
              scopes: {
                "/feature11": {
                  middleware: [],
                  routes(builder) {
                    builder.get("/get", 1, 3, () => new Response());
                  },
                },
              },
            },
            "/feature2": {
              middleware: [],
              routes(builder) {
                builder.get("/get", 1, 3, () => new Response());
              },
              scopes: {
                "/feature21": {
                  middleware: [],
                  routes(builder) {
                    builder.get("/get", 1, 3, () => new Response());
                  },
                },
              },
            },
          },
        },
        "/v2": {
          middleware: [],
          scopes: {
            "/feature1": {
              middleware: [],
              routes(builder) {
                builder.get("/get", 1, 3, () => new Response());
              },
              scopes: {
                "/feature11": {
                  middleware: [],
                  routes(builder) {
                    builder.get("/get", 1, 3, () => new Response());
                  },
                },
              },
            },
            "/feature2": {
              middleware: [],
              routes(builder) {
                builder.get("/get", 1, 3, () => new Response());
              },
              scopes: {
                "/feature21": {
                  middleware: [],
                  routes(builder) {
                    builder.get("/get", 1, 3, () => new Response());
                  },
                },
              },
            },
          },
        },
        openAPI: {
          middleware: [],
          scopes: {
            "/feature1": {
              middleware: [],
              routes(builder) {
                builder.get("/get", 1, 3, () => new Response());
              },
              scopes: {
                "/feature11": {
                  middleware: [],
                  routes(builder) {
                    builder.get("/get", 1, 3, () => new Response());
                  },
                },
              },
            },
            "/feature2": {
              middleware: [],
              routes(builder) {
                builder.get("/get", 1, 3, () => new Response());
              },
              scopes: {
                "/feature21": {
                  middleware: [],
                  routes(builder) {
                    builder.get("/get", 1, 3, () => new Response());
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

type Middleware = () => void;

type ScopeConfig = {
  middleware?: Middleware[];
  routes?: (builder) => void;
  scopes?: Record<string, ScopeConfig>;
};
