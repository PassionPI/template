export const getConfigFile = (path = "../../env.json") => {
  const config = JSON.parse(
    new TextDecoder("utf-8").decode(
      Deno.readFileSync(new URL(path, import.meta.url))
    )
  );
  console.log(config);
  // if (typeof config.env !=)
};
