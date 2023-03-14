import { z } from "@/libs/zod.ts";

const zodConfigSchema = z.object({
  port: z.number().int().positive(),
  mongo: z.object({
    url: z.string().url(),
  }),
});

type ZodConfigSchema = z.infer<typeof zodConfigSchema>;

const getConfigFile = <T extends object>(path = "../../env.json") => {
  const config = JSON.parse(
    new TextDecoder("utf-8").decode(
      Deno.readFileSync(new URL(path, import.meta.url))
    )
  );
  return config as T;
};

export const config = zodConfigSchema.parse(getConfigFile<ZodConfigSchema>());
export const env = Deno.env.get("ENV");
