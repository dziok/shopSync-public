import { Body, Controller, Post, Headers, UnauthorizedException, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ProductImageService } from './product-image.service';
import { JwtPayload } from '../auth/auth.dto';
import { DecodedAuthTokens } from '../decorators';
import { JwtAuthGuard } from '../auth/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('product-image')
export class ProductImageController {
  constructor(private readonly productImageService: ProductImageService) { }

  @Post('')
  @UseGuards(JwtAuthGuard)
  addOne(
    @Body() dto: Record<string, string>,
    @DecodedAuthTokens() decodedTokens: JwtPayload
  ) {
    return this.productImageService.addOne(dto, decodedTokens);
  }


  @Post('apilo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file')) // Musi być ten interceptor!
  async addImgInApilo(
    @DecodedAuthTokens() decodedTokens: JwtPayload,
    @UploadedFile() file: Express.Multer.File, // Pobiera przesłany plik
  ) {
    if (!file) {
      throw new BadRequestException('Brak pliku w zapytaniu!');
    }

    // Jeśli plik jest w formacie Buffer (jak w przypadku Multer), przekazujemy go do usługi
    const buffer = file.buffer;

    // Przekazujemy do metody addImgInApilo w serwisie
    return this.productImageService.addImgInApilo(buffer, decodedTokens);
  }
}
