import { z } from "zod";

export const CreateProductoSchema = z.object({
  name: z.string().min(1, "El nombre del producto es obligatorio"),
  price: z.number().positive("El precio debe ser mayor a 0"),
  imageKey: z.string().optional().nullable(),
});

export type CreateProducto = z.infer<typeof CreateProductoSchema>;
