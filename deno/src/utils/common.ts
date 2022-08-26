const COMMON_HEADERS = {
  "Content-Type": "application/json",
};

const _NO_RESPONSE = JSON.stringify({ message: "No Response!" });
export const NO_RESPONSE = () => new Response(_NO_RESPONSE);

export const NOT_FOUND = (path: string) =>
  new Response(
    JSON.stringify({
      message: `Not Found: ${path}`,
    }),
    {
      status: 404,
      headers: COMMON_HEADERS,
    }
  );

export const NOT_SUPPORTED = (method: string) =>
  new Response(
    JSON.stringify({
      message: `Method <${method}> is not supported!`,
    }),
    {
      status: 404,
      headers: COMMON_HEADERS,
    }
  );

export const UNEXPECTED_ERR = (err: Error) =>
  new Response(
    JSON.stringify({
      message: `Internal error: ${err.message}`,
    }),
    {
      status: 500,
      headers: COMMON_HEADERS,
    }
  );
