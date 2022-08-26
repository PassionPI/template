const COMMON_HEADERS = {
  "Content-Type": "application/json",
};

export const ok = <T extends Record<string, unknown>>(data: T) =>
  new Response(
    JSON.stringify({
      code: 1000,
      message: "ok",
      data,
    }),
    {
      headers: COMMON_HEADERS,
    }
  );

export const bad = ({
  code,
  status = 200,
  message,
}: {
  code: number;
  status?: number;
  message: string;
}) =>
  new Response(
    JSON.stringify({
      code,
      message,
    }),
    {
      status,
      headers: COMMON_HEADERS,
    }
  );
