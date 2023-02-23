import { app } from "@/app/mod.ts";

// const jwt_token_header = { algorithm: "RS256" } as const;
// // { alg: "HS512", typ: "JWT" } as const;
// const jwt_token_key =
//   "NXWb36Pp8xbepmNyrxowt-kbh7SJg3pfXwBPgFnAEmFWCe-Ec6_qgMKBiioqGwmSgSnXAPfyKWy4kTHTkqZXSEfrOowqoYs7zeNuBkv4WV0-8UnX5pxgHzXwqsZ2zHWg4ikDPBJNvi67G9BbSRAmej1wQvtUNis_s7DmjrIv8HU";
// const x = await crypto.subtle.generateKey(
//   {
//     name: "HMAC",
//     hash: "SHA-512",
//   },
//   true,
//   ["sign", "verify"]
// );
// console.log("???", (await crypto.subtle.exportKey("jwk", x)).k);
// type Action = {
//   type: string;
//   payload?: Record<string, string>;
// };
// const create_jwt_token = (action: Action) => {
//   return sign(action, "shhhhh");
// };

// const jwt_token = create_jwt_token({
//   type: "bar",
//   payload: {
//     user_id: "qqqq",
//   },
// });
// const payload = decode(jwt_token);

// console.log("???", jwt_token, payload);

export const jwt = () =>
  app.defineMiddleware(async (_, next) => {
    return await next();
  });
