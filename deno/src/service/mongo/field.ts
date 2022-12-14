import { zodEnum, zodFieldComponent } from "@/common/types.ts";
import { ObjectId } from "@/libs/mongo.ts";
import { z } from "@/libs/zod.ts";
import { mongo } from "@/service/mongo/mod.ts";

/**
 * Field 类型
 *
 * Input
 * Select
 * Date
 * Business Fields「以文本的形式注册?」
 */

export const zodFieldCommon = z.object({
  // 字段所属空间
  space: z.string(),
  // 展示名称
  name: z.string(),
  // 后端使用的字段名「在字段所属空间内, 唯一标识」
  key: z.string(),
  // 字段更新版本
  version: z.number(),
  // 是否废弃
  deprecated: z.boolean().optional(),
  // 备注
  remark: z.string().optional(),
});

export const zodField = z
  .object({
    // 组件类型
    component: zodFieldComponent,
    // 枚举值
    enum: zodEnum,
  })
  .and(zodFieldCommon);

export type Field = z.infer<typeof zodField>;

export async function getFieldItem(id: string): Promise<Field> {
  return (await mongo.field.findOne({ _id: ObjectId(id) })) as Field;
}
