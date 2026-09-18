"use server";

import { prisma } from "@/shared/infrastructure/libs/prisma";
import { LocalFileRepository } from "@/shared/infrastructure/repository/LocalFileRepository";
import { FileService } from "@/shared/infrastructure/services/S3FileService";
import { logServerError } from "@/shared/infrastructure/logging/serverLogger";

export const deleteProductoAction = async (id: number) => {
  try {
    const deletedProduct = await prisma.product.delete({
      where: { id },
    });

    if (deletedProduct.imageKey) {
      const fileService = new FileService(new LocalFileRepository());
      await fileService.deleteFile(deletedProduct.imageKey);
    }

    return {
      success: true,
      message: "Producto eliminado correctamente",
      data: deletedProduct,
    };
  } catch (error) {
    await logServerError({
      error,
      event: "products.delete.failed",
      feature: "products",
      operation: "delete_product",
      context: { productId: id },
    });
    return {
      success: false,
      error: "No se pudo eliminar el producto. Inténtalo nuevamente.",
    };
  }
};
