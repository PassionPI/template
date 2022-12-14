const getConfigFile = <T extends object>(path = "../../env.json") => {
  const config = JSON.parse(
    new TextDecoder("utf-8").decode(
      Deno.readFileSync(new URL(path, import.meta.url))
    )
  );
  return config as T;
};

export interface Config {
  port: number;
  mongo: {
    url: string;
  };
}

export const config = getConfigFile<Config>();
export const env = Deno.env.get("ENV");
