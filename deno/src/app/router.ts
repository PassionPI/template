import { app } from "@/app/mod.ts";
import { controller } from "@/controller/mod.ts";
import { serveDir } from "@/libs/file_server.ts";
import { middleware } from "@/middleware/mod.ts";
import { service } from "@/service/mod.ts";

export const base_routes = app.defineRoutes((register) => {
  register.all("/", [middleware.logger.path("/")], controller.echo.path);
  register.all("/aa", [middleware.logger.path("/aa")], controller.echo.path);
});

export const scope_routes = app.defineScopes({
  "/static": {
    routes(register) {
      register.get(
        "/*path",
        [middleware.logger.path("/*path")],
        async ({ response, request }) => {
          response.stream = await serveDir(request, {
            fsRoot: new URL("../", import.meta.url).pathname,
          });
          return null;
        }
      );
    },
  },
  "/api": {
    middleware: [middleware.auth.jwt(), middleware.logger.path("/api")],
    scopes: {
      "/fib": {
        middleware: [middleware.logger.path("/fib")],
        routes(register) {
          register.get(
            "index",
            [middleware.logger.path("index", "GET")],
            controller.echo.path
          );
          register.get(
            "/",
            [middleware.logger.path("/", "GET")],
            controller.echo.path
          );
          register.get(
            "/:x",
            [middleware.logger.path("/:x", "GET")],
            controller.fib.cal
          );
          register.post(
            "/:x",
            [middleware.logger.path("/:x", "POST")],
            controller.fib.cal
          );
        },
      },
      "/v1": {
        middleware: [middleware.logger.path("/v1")],
        scopes: {
          "/config": {
            middleware: [middleware.logger.path("/config")],
            scopes: {
              "/field": {
                middleware: [middleware.logger.path("/field")],
                routes(register) {
                  register.post(
                    "/get/list",
                    [middleware.logger.path("/get/list")],
                    controller.field.get_list
                  );
                  register.post(
                    "/post",
                    [
                      middleware.logger.path("/post"),
                      middleware.validator.body(service.field.zodField),
                    ],
                    controller.field.post
                  );
                  register.post(
                    "/post/many",
                    [middleware.logger.path("/post/many")],
                    controller.field.post_many
                  );
                  register.post(
                    "/put",
                    [
                      middleware.logger.path("/put"),
                      middleware.validator.body(service.field.zodField.array()),
                    ],
                    controller.field.put
                  );
                  register.post(
                    "/put_many",
                    [middleware.logger.path("/put_many")],
                    controller.field.put_many
                  );
                  register.post(
                    "/del/:id",
                    [middleware.logger.path("/del/:id")],
                    controller.field.del
                  );
                },
              },
              "/schema": {
                middleware: [middleware.logger.path("/schema")],
                routes(register) {
                  register.post(
                    "/get/:key",
                    [middleware.logger.path("/get/:key")],
                    controller.schema.get
                  );
                  register.post(
                    "/get/list",
                    [middleware.logger.path("/get/list")],
                    controller.schema.get_list
                  );
                  register.post(
                    "/get/form",
                    [middleware.logger.path("/get/form")],
                    controller.schema.get_parsed_form
                  );
                  register.post(
                    "/get/columns",
                    [middleware.logger.path("/get/columns")],
                    controller.schema.get_parsed_columns
                  );
                  register.post(
                    "/post",
                    [middleware.logger.path("/post")],
                    controller.schema.post
                  );
                  register.post(
                    "/post/many",
                    [middleware.logger.path("/post/many")],
                    controller.schema.post_many
                  );
                  register.post(
                    "/put",
                    [middleware.logger.path("/put")],
                    controller.schema.put
                  );
                  register.post(
                    "/put_many",
                    [
                      middleware.logger.path("/put_many"),
                      middleware.validator.body(
                        service.schema.zodSchema.array()
                      ),
                    ],
                    controller.schema.put_many
                  );
                  register.post(
                    "/del/:id",
                    [middleware.logger.path("/del/:id")],
                    controller.schema.del
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
    middleware: [middleware.cors.cors()],
  },
});
