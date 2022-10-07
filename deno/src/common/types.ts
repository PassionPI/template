import { z } from "@/libs/zod.ts";

export const zodID = z.object({
  _id: z.string(),
});

export type ID = z.infer<typeof zodID>;

export const zodIDS = z.object({
  ids: z.string().array(),
});
export type IDS = z.infer<typeof zodIDS>;

export const zodPagination = z.object({
  page: z.number(),
  size: z.number(),
});

export type Pagination = z.infer<typeof zodPagination>;

export const zodEnumItem = z.object({
  label: z.string(),
  value: z.string(),
});
export type EnumItem = z.infer<typeof zodEnumItem>;

export type Enum = (EnumItem & { children?: Enum })[];

export const zodEnum: z.ZodType<Enum> = z.lazy(() =>
  z
    .object({
      children: zodEnum.optional(),
    })
    .and(zodEnumItem)
    .array()
);

export const zodValidator = z.object({
  pattern: z.string(),
  message: z.string(),
});

export type Validator = z.infer<typeof zodValidator>;

export const zodFieldComponent = z.enum(["Select", "Input", "Date"]);
export type FieldComponent = z.infer<typeof zodFieldComponent>;
export type FieldComponentType = FieldComponent | string;
