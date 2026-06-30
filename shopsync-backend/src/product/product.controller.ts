import { Body, Controller, Post, Headers, UnauthorizedException, UseGuards, Param, Put, Get, Query, Delete, Patch } from '@nestjs/common';
import { ProductService } from './product.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { DecodedAuthTokens } from '../decorators';
import { JwtPayload } from '../auth/auth.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) { }


  @Post('shoper')
  @UseGuards(JwtAuthGuard)
  addInShoper(
    @Body() dto: Record<string, string>,
    @DecodedAuthTokens() decodedTokens: JwtPayload
  ) {
    return this.productService.addInShoper(dto, decodedTokens);
  }


  @Post('apilo')
  @UseGuards(JwtAuthGuard)
  addInApilo(
    @Body() dto: Record<string, string>,
    @DecodedAuthTokens() decodedTokens: JwtPayload
  ) {

    return this.productService.addInApilo(dto, decodedTokens);
  }

  @Put('apilo')
  @UseGuards(JwtAuthGuard)
  updateInApilo(
    @Body() dto: Record<string, any>,
    @DecodedAuthTokens() decodedTokens: JwtPayload
  ) {
    return this.productService.updateApiloProduct(dto, decodedTokens);
  }


  @Patch('attributes')
  @UseGuards(JwtAuthGuard)
  addAttributes(
    @Body() dto: Record<string, string>,
    @DecodedAuthTokens() decodedTokens: JwtPayload
  ) {

    return this.productService.addAttributes(dto, decodedTokens);
  }


  @Put(':productId')
  @UseGuards(JwtAuthGuard)
  updateOne(
    @Param('productId') productId: string,
    @Body() dto: Record<string, string>,
    @DecodedAuthTokens() decodedTokens: JwtPayload
  ) {
    return this.productService.updateOne(Number(productId), dto, decodedTokens);
  }

  @Get('apiloProductsList')
  @UseGuards(JwtAuthGuard)
  apiloProductslist(
    @Query() query: Record<string, string>,
    @DecodedAuthTokens() decodedTokens: JwtPayload
  ) {
    return this.productService.apiloProductslist(query, decodedTokens);
  }

  @Get('shoper-deliveries')
  @UseGuards(JwtAuthGuard)
  getShoperDeliveryTimes(
    @DecodedAuthTokens() decodedTokens: JwtPayload
  ) {
    return this.productService.getShoperDeliveryTimes(decodedTokens);
  }

  @Get('shoper-products/search')
  @UseGuards(JwtAuthGuard)
  searchShoperProducts(
    @Query('phrase') phrase: string,
    @DecodedAuthTokens() decodedTokens: JwtPayload
  ) {
    return this.productService.searchShoperProducts(phrase, decodedTokens);
  }

  @Post('shoper-delivery-time/bulk-update')
  @UseGuards(JwtAuthGuard)
  bulkUpdateShoperDeliveryTime(
    @Body() dto: {
      categoryId?: number | string;
      categoryIds?: Array<number | string>;
      deliveryId?: number | string;
      limit?: number | string;
      includeInactive?: boolean;
      onlyInStock?: boolean;
    },
    @DecodedAuthTokens() decodedTokens: JwtPayload
  ) {
    return this.productService.bulkUpdateShoperDeliveryTime(dto, decodedTokens);
  }

  @Get('shoper-delivery-time/jobs/:jobId')
  @UseGuards(JwtAuthGuard)
  getShoperDeliveryTimeJob(
    @Param('jobId') jobId: string,
  ) {
    return this.productService.getShoperDeliveryTimeJob(jobId);
  }


  @Delete('apiloProductDelete/:id')
  @UseGuards(JwtAuthGuard)
  async apiloProductsDelete(
    @Param('id') id: string,
    @DecodedAuthTokens() decodedTokens: JwtPayload
  ) {
    return this.productService.apiloProductDelete(id, decodedTokens);
  }

  @Post('allegroProduct')
  async createProduct(
    @Body() body: any,
    @Headers('authorization') authHeader: string
  ) {
    const token = authHeader.replace('Bearer ', '');
    return this.productService.createProductOffer(token, body);
  }

  @Post('allegroProductProposals')
  async createProductproposals(
    @Body() body: any,
    @Headers('authorization') authHeader: string
  ) {
    const token = authHeader.replace('Bearer ', '');
    return this.productService.createProductProposal(token, body);
  }

  @Get('category-parameters')
  async getCategoryParams(
    @Query('categoryId') categoryId: string,
    @Headers('authorization') authHeader: string
  ) {
    const token = authHeader.replace('Bearer ', '');
    return this.productService.getCategoryParameters(token, categoryId);
  }

  @Get('search')
  async searchProduct(
    @Query('searchName') searchName: string,
    @Headers('authorization') authHeader: string
  ) {
    const token = authHeader.replace('Bearer ', '');
    return this.productService.searchProductByGTIN(searchName, token);
  }

  @Get('responsibleProducers')
  async getResponsiblePersons(@Headers() headers: Record<string, string | undefined>) {
    const authHeader = headers['authorization'] || headers['Authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }
    const token = authHeader.slice('Bearer '.length).trim();
    return this.productService.getResponsiblePersons(token);
  }

  @Get(':productId')
  @UseGuards(JwtAuthGuard)
  getShoperProduct(
    @Param('productId') productId: string,
    @DecodedAuthTokens() decodedTokens: JwtPayload
  ) {
    return this.productService.getShoperProductById(Number(productId), decodedTokens);
  }

}
