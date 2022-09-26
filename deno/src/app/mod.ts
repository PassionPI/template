import { COMMON_HEADERS } from "@/app/help.ts";
import { MongoClient } from "@/libs/mongo.ts";
import { createContext } from "@/onion/binding/deno.ts";
import { createXVX } from "@/onion/createXVX.ts";

type Body = Record<string, unknown> | null | undefined;

const mongoClient = new MongoClient();
await mongoClient.connect("mongodb://docker:mongopw@localhost:55000");
const mongoDB = mongoClient.database("front");
const mongo = {
  schema: mongoDB.collection("schema"),
} as const;

const context = (request: Request) => {
  const ctx = createContext({ request });
  return {
    ...ctx,
    mongo,
    ok<T extends Record<string, unknown>>(data: T) {
      Object.assign(ctx.response.headers, COMMON_HEADERS);
      return {
        code: 1000,
        message: "ok",
        data,
      };
    },
    bad({
      code,
      status,
      message,
    }: {
      code: number;
      status?: number;
      message: string;
    }) {
      Object.assign(ctx.response.headers, COMMON_HEADERS);
      ctx.response.status = status;
      return {
        code,
        message,
      };
    },
  };
};

export const app = createXVX<
  Parameters<typeof context>,
  ReturnType<typeof context>,
  Body,
  Response
>({
  context,
  notFound({ method, pathname, bad }) {
    return bad({
      code: 4000,
      status: 404,
      message: `Not Found: ${method} ${pathname}`,
    });
  },
  responseOk({ response }, result) {
    const { stream, text, blob, ...rest } = response;
    const body = stream ?? blob ?? text;
    if (body) {
      return new Response(body, rest);
    }
    if (result == null) {
      return new Response(result, rest);
    }
    return new Response(JSON.stringify(result), rest);
  },
  responseErr(_, { message }) {
    return new Response(
      JSON.stringify({
        code: 5000,
        message,
      }),
      {
        status: 500,
      }
    );
  },
});
