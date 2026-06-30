import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { DecodedAuthTokens } from '../decorators';
import { JwtPayload } from '../auth/auth.dto';
import { AttributeGroupsService } from './attributes.service';

const parseOptionalNumber = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};

@Controller('attribute-groups')
export class AttributeGroupsController {
    constructor(private readonly attributeGroupsService: AttributeGroupsService) { }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async getAttributeGroup(
        @Param('id') id: number,
        @DecodedAuthTokens() decodedTokens: JwtPayload,
    ) {
        return this.attributeGroupsService.getAttributeGroupFromShoper(id, decodedTokens);
    }

    @UseGuards(JwtAuthGuard)
    @Post("createAttributes")
    async createAttribute(
        @Body() body: any,
        @DecodedAuthTokens() decodedTokens: JwtPayload,
    ) {
        return await this.attributeGroupsService.createAttributeInShoper(body, decodedTokens);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    async getAttributesList(
        @Query('limit') limit: number,
        @Query('page') page: number,
        @Query('offset') offset: number,
        @Query('filters') filters: string,
        @DecodedAuthTokens() decodedTokens: JwtPayload,
    ) {
        const parsedLimit = parseOptionalNumber(limit);
        const parsedPage = parseOptionalNumber(page);
        const parsedOffset = parseOptionalNumber(offset);
        return this.attributeGroupsService.getAttributesListFromShoper(decodedTokens, {
            limit: parsedLimit,
            page: parsedPage,
            offset: parsedOffset,
            filters,
        });
    }

    @UseGuards(JwtAuthGuard)
    @Get('by-ids')
    async getAttributesByIds(
        @Query('ids') ids: string,
        @DecodedAuthTokens() decodedTokens: JwtPayload,
    ) {
        const parsedIds = (ids || '')
            .split(',')
            .map((s) => Number(s.trim()))
            .filter((n) => Number.isFinite(n));
        return this.attributeGroupsService.getAttributesByIds(parsedIds, decodedTokens);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async getAttributeById(
        @Param('id') id: number,
        @DecodedAuthTokens() decodedTokens: JwtPayload,
    ) {
        return this.attributeGroupsService.getAttributeByIdFromShoper(id, decodedTokens);
    }
}

@Controller('attributes')
export class AttributesController {
    constructor(private readonly attributeGroupsService: AttributeGroupsService) { }

    @UseGuards(JwtAuthGuard)
    @Get()
    async getAttributesList(
        @Query('limit') limit: number,
        @Query('page') page: number,
        @Query('offset') offset: number,
        @Query('filters') filters: string,
        @DecodedAuthTokens() decodedTokens: JwtPayload,
    ) {
        const parsedLimit = parseOptionalNumber(limit);
        const parsedPage = parseOptionalNumber(page);
        const parsedOffset = parseOptionalNumber(offset);
        return this.attributeGroupsService.getAttributesListFromShoper(decodedTokens, {
            limit: parsedLimit,
            page: parsedPage,
            offset: parsedOffset,
            filters,
        });
    }
}
