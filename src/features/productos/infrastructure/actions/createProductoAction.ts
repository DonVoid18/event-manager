"use server";

import { prisma } from "@/shared/infrastructure/libs/prisma";
import { CreateProducto, CreateProductoSchema } from "../../domain/validations/createProducto";
import { LocalFileRepository } from "@/shared/infrastructure/repository/LocalFileRepository";
import { FileService } from "@/shared/infrastructure/services/S3FileService";
import { validateImageFile } from "@/shared/infrastructure/utils/imageValidation";
import { logServerError } from "@/shared/infrastructure/logging/serverLogger";

export const createProductoAction = async (data: CreateProducto | FormData) => {
  try {
    const { productData, image } = parseProductoPayload(data);
    const validatedData = CreateProductoSchema.parse(productData);
    const imageKey = image ? await uploadProductoImage(image) : null;

    const producto = await prisma.product.create({
      data: {
        name: validatedData.name,
        price: validatedData.price,
        imageKey,
      },
    });

    return {
      success: true,
      message: "Producto creado correctamente",
      data: producto,
    };
  } catch (error) {
    await logServerError({
      error,
      event: "products.create.failed",
      feature: "products",
      operation: "create_product",
    });
    return {
      success: false,
      message: "No se pudo crear el producto. Inténtalo nuevamente.",
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
