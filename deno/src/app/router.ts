import { app } from "@/app/mod.ts";
import { echo_path } from "@/controller/echo_path.ts";
import { control_fib } from "@/controller/fib.ts";
import * as controller_field from "@/controller/field.ts";
import * as controller_schema from "@/controller/schema.ts";
import { access } from "@/middleware/access.ts";
import { auth } from "@/middleware/auth.ts";
import { cors } from "@/middleware/cors.ts";
import { validator } from "@/middleware/validator.ts";
import { zodField } from "@/service/mongo/field.ts";
import { zodSchema } from "../service/mongo/schema.ts";

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
      "/v1": {
        middleware: [access("/v1")],
        scopes: {
          "/config": {
            middleware: [access("/config")],
            scopes: {
              "/field": {
                middleware: [access("/field")],
                routes(register) {
                  register.post(
                    "/get/list",
                    [access("/get/list")],
                    controller_field.get_list
                  );
                  register.post(
                    "/post",
                    [access("/post"), validator.body(zodField)],
                    controller_field.post
                  );
                  register.post(
                    "/post/many",
                    [access("/post/many")],
                    controller_field.post_many
                  );
                  register.post(
                    "/put",
                    [access("/put"), validator.body(zodField.array())],
                    controller_field.put
                  );
                  register.post(
                    "/put_many",
                    [access("/put_many")],
                    controller_field.put_many
                  );
                  register.post(
                    "/del/:id",
                    [access("/del/:id")],
                    controller_field.del
                  );
                },
              },
              "/schema": {
                middleware: [access("/schema")],
                routes(register) {
                  register.post(
                    "/get/:key",
                    [access("/get/:key")],
                    controller_schema.get
                  );
                  register.post(
                    "/get/list",
                    [access("/get/list")],
                    controller_schema.get_list
                  );
                  register.post(
                    "/get/form",
                    [access("/get/form")],
                    controller_schema.get_parsed_form
                  );
                  register.post(
                    "/get/columns",
                    [access("/get/columns")],
                    controller_schema.get_parsed_columns
                  );
                  register.post(
                    "/post",
                    [access("/post")],
                    controller_schema.post
                  );
                  register.post(
                    "/post/many",
                    [access("/post/many")],
                    controller_schema.post_many
                  );
                  register.post(
                    "/put",
                    [access("/put")],
                    controller_schema.put
                  );
                  register.post(
                    "/put_many",
                    [access("/put_many"), validator.body(zodSchema.array())],
                    controller_schema.put_many
                  );
                  register.post(
                    "/del/:id",
                    [access("/del/:id")],
                    controller_schema.del
                  );
                },
              },
            },
          },
        },
      },
    },
  },
  "/openAPI": {
    middleware: [cors()],
  },
});
