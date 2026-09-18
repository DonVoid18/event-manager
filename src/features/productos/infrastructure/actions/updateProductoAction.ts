"use server";

import { prisma } from "@/shared/infrastructure/libs/prisma";
import { CreateProducto, CreateProductoSchema } from "../../domain/validations/createProducto";
import { LocalFileRepository } from "@/shared/infrastructure/repository/LocalFileRepository";
import { FileService } from "@/shared/infrastructure/services/S3FileService";
import { validateImageFile } from "@/shared/infrastructure/utils/imageValidation";
import { logServerError } from "@/shared/infrastructure/logging/serverLogger";

export const updateProductoAction = async (id: number, data: CreateProducto | FormData) => {
  try {
    const currentProduct = await prisma.product.findUnique({
      where: { id },
      select: { imageKey: true },
    });

    const { productData, image } = parseProductoPayload(data);
    const validatedData = CreateProductoSchema.parse(productData);
    const imageKey = image ? await uploadProductoImage(image) : currentProduct?.imageKey;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: validatedData.name,
        price: validatedData.price,
        imageKey,
      },
    });

    if (image && currentProduct?.imageKey && currentProduct.imageKey !== updatedProduct.imageKey) {
      await deleteProductoImage(currentProduct.imageKey);
    }

    return {
      success: true,
      message: "Producto actualizado correctamente",
      data: updatedProduct,
    };
  } catch (error) {
    await logServerError({
      error,
      event: "products.update.failed",
      feature: "products",
      operation: "update_product",
      context: { productId: id },
    });
    return {
      success: false,
      error: "No se pudo actualizar el producto. Inténtalo nuevamente.",
    };
  }
};

const parseProductoPayload = (data: CreateProducto | FormData) => {
  if (!(data instanceof FormData)) {
    return { productData: data, image: null };
  }

  const image = data.get("image");

  return {
    productData: {
      name: String(data.get("name") ?? ""),
      price: Number(data.get("price")),
    },
    image: image instanceof File && image.size > 0 ? image : null,
  };
};

const uploadProductoImage = async (image: File) => {
  const validation = await validateImageFile(image);

  if (!validation.success) {
    throw new Error(validation.error);
  }

  const fileRepository = new LocalFileRepository();
  const fileService = new FileService(fileRepository);
  const metadata = await fileService.uploadFile({
    file: validation.buffer,
    fileName: image.name,
    mimeType: image.type,
    folder: "productos",
  });

  return metadata.key;
};

const deleteProductoImage = async (imageKey: string) => {
  try {
    const fileService = new FileService(new LocalFileRepository());
    await fileService.deleteFile(imageKey);
  } catch (error) {
    await logServerError({
      error,
      event: "products.previous_image_delete.failed",
      feature: "products",
      operation: "delete_previous_product_image",
      context: { imageKey },
    });
  }
};
