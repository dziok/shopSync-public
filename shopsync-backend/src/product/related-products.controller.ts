import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  Get,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/auth.guard";
import { DecodedAuthTokens } from "../decorators";
import { JwtPayload } from "../auth/auth.dto";
import { RelatedProductsService } from "./related-products.service";

@Controller("related-products")
@UseGuards(JwtAuthGuard)
export class RelatedProductsController {
  constructor(
    private readonly relatedProductsService: RelatedProductsService,
  ) {}

  @Get()
  getState() {
    return this.relatedProductsService.getState();
  }

  @Post("packs")
  createPack(@Body() body: { name?: unknown; productIds?: unknown }) {
    return this.relatedProductsService.createPack(body);
  }

  @Patch("packs/:packId")
  updatePack(
    @Param("packId") packId: string,
    @Body() body: { name?: unknown; productIds?: unknown },
  ) {
    return this.relatedProductsService.updatePack(packId, body);
  }

  @Delete("packs/:packId")
  deletePack(@Param("packId") packId: string) {
    return this.relatedProductsService.deletePack(packId);
  }

  @Patch("autorun")
  patchAutoRun(@Body() body: Record<string, unknown>) {
    return this.relatedProductsService.patchAutoRun(body);
  }

  @Post("assign")
  assignPackToProduct(
    @Body() body: { productId?: number | string; packId?: string },
    @DecodedAuthTokens() decodedTokens: JwtPayload,
  ) {
    return this.relatedProductsService.assignPackToProduct(
      Number(body.productId),
      String(body.packId ?? "").trim(),
      decodedTokens,
    );
  }

  @Post("sync-due")
  syncDue(@DecodedAuthTokens() decodedTokens: JwtPayload) {
    return this.relatedProductsService.syncDueAssignments(decodedTokens);
  }
}
