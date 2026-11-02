import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { DecodedAuthTokens } from '../decorators';
import { JwtPayload } from '../auth/auth.dto';

@Controller('categories')
export class CategoriesController {
    constructor(private readonly CategoriesService: CategoriesService) { }

    @UseGuards(JwtAuthGuard)
    @Get('shoper')
    async getCategories(
        @Query('limit') limit: number,
        @Query('page') page: number,
        @Query('filters') filters: string,
        @Query('include') include: string,
        @DecodedAuthTokens() decodedTokens: JwtPayload,
    ) {
        return this.CategoriesService.getCategoriesFromShoper(decodedTokens, limit, page, filters, include);
    }

    @UseGuards(JwtAuthGuard)
    @Get('shoper/:id')
    async getCategory(
        @Param('id') id: string,
        @DecodedAuthTokens() decodedTokens: JwtPayload,
    ) {
        return this.CategoriesService.getCategoryFromShoper(decodedTokens, id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('producers') // Zmieniono nazwę trasy
    async getProducers( // Zmieniono nazwę metody
        @Query('limit') limit: number,
        @Query('page') page: number,
        @DecodedAuthTokens() decodedTokens: JwtPayload,
    ) {
        return this.CategoriesService.getProducers(decodedTokens, limit, page); // Zmieniono nazwę metody
    }

    @UseGuards(JwtAuthGuard)
    @Get('product-safety-producers')
    async getProductSafetyProducers(
        @Query('limit') limit: number,
        @Query('page') page: number,
        @DecodedAuthTokens() decodedTokens: JwtPayload,
    ) {
        return this.CategoriesService.getProductSafetyProducers(decodedTokens, limit, page);
    }

    @UseGuards(JwtAuthGuard)
    @Get('product-safety-certificates')
    async getProductSafetyCertificates(
        @Query('limit') limit: number,
        @Query('page') page: number,
        @DecodedAuthTokens() decodedTokens: JwtPayload,
    ) {
        return this.CategoriesService.getProductSafetyCertificates(decodedTokens, limit, page);
    }
}
