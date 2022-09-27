import { app } from "@/app/mod.ts";
import { echo_path } from "@/controller/echo_path.ts";
import { control_fib } from "@/controller/fib.ts";
import { access } from "@/middleware/access.ts";
import { auth } from "@/middleware/auth.ts";
import { cors } from "@/middleware/cors.ts";
import {
  db_del,
  db_get,
  db_get_list,
  db_post,
  db_post_many,
  db_put,
} from "../controller/crud.ts";

export const base_routes = app.defineRoutes((register) => {
  register.all("/", [access("/")], echo_path);
  register.all("/aa", [access("/aa")], echo_path);
  register.all("/*notFound", [access("/*notFound")], ({ pathParams, bad }) => {
    return bad({
      code: 4000,
      status: 404,
      message: `Global! Not Found: ${pathParams.notFound}`,
    });
  });
});

export const scope_routes = app.defineScopes({
  "/api": {
    middleware: [auth(), access("/api")],
    scopes: {
      "/fib": {
        middleware: [access("/fib")],
        routes(register) {
          register.get("index", [access("index", "GET")], echo_path);
          register.get("/", [access("/", "GET")], echo_path);
          register.get("/:x", [access("/:x", "GET")], control_fib);
          register.post("/:x", [access("/:x", "POST")], control_fib);
        },
      },
      "/config": {
        middleware: [access("/config")],
        routes(register) {
          register.post("/get/:id", [access("/get/:id")], db_get);
          register.post("/get/list", [access("/get/list")], db_get_list);
          register.post("/post", [access("/post")], db_post);
          register.post("/post/many", [access("/post/many")], db_post_many);
          register.post("/put", [access("/put")], db_put);
          register.post("/del/:id", [access("/del/:id")], db_del);
        },
      },
    },
  },
  "/openAPI": {
    middleware: [cors()],
  },
});
