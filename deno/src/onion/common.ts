const COMMON_HEADERS = {
  "Content-Type": "application/json",
};

const NO_RESPONSE_BODY = JSON.stringify({ message: "No Response!" });

export const NO_RESPONSE = () => {
  return new Response(NO_RESPONSE_BODY, {
    headers: COMMON_HEADERS,
  });
};

export const NOT_FOUND = (path: string) => {
  return new Response(
    JSON.stringify({
      message: `Not Found: ${path}`,
    }),
    {
      status: 404,
      headers: COMMON_HEADERS,
    }
  );
};

export const NOT_SUPPORTED = (method: string) => {
  return new Response(
    JSON.stringify({
      message: `Method <${method}> is not supported!`,
    }),
    {
      status: 404,
      headers: COMMON_HEADERS,
    }
  );
};

export const UNEXPECTED_ERR = (err: Error) => {
  return new Response(
    JSON.stringify({
      message: `Internal error: ${err.message}`,
    }),
    {
      status: 500,
      headers: COMMON_HEADERS,
    }
  );
};
