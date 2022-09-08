export const NO_RESPONSE = () => {
  return new Response("No Response!");
};

export const NOT_FOUND = (path: string) => {
  return new Response(`Not Found: ${path}`, {
    status: 404,
  });
};

export const NOT_SUPPORTED = (method: string) => {
  return new Response(`Method <${method}> is not supported!`, {
    status: 404,
  });
};

export const UNEXPECTED_ERR = (err: Error) => {
  return new Response(`Internal error: ${err.message}`, {
    status: 500,
  });
};
