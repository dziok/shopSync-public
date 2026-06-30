import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { JwtPayload } from '../auth/auth.dto';
import axios from 'axios';
import { getShoperRestBaseUrl } from '../config/service-endpoints';

@Injectable()
export class AttributeGroupsService {
    constructor(private httpService: HttpService) { }

    private getShoperRestUrl(path: string) {
        return `${getShoperRestBaseUrl()}${path}`;
    }

    async getAttributeGroupFromShoper(id: number, decodedTokens: JwtPayload) {
        try {
            const response = await this.httpService.axiosRef.get(
                this.getShoperRestUrl(`/attribute-groups/${id}`),
                {
                    headers: {
                        Authorization: `Bearer ${decodedTokens.shoperToken}`,
                        'Content-Type': 'application/json',
                    },
                },
            );
            return response.data;
        } catch (e) {
            if (axios.isAxiosError(e) && e.response) {
                console.error('Błąd API Shoper:', e.response.status, e.response.data);
                throw new BadRequestException(e.response.data);
            }
            console.error('Nieznany błąd:', e);
            throw new InternalServerErrorException();
        }
    }

    async createAttributeInShoper(data: any, decodedTokens: JwtPayload) {
        try {
            const response = await axios.post(
                this.getShoperRestUrl('/attributes'),
                data,
                {
                    headers: {
                        Authorization: `Bearer ${decodedTokens.shoperToken}`,
                        'Content-Type': 'application/json',
                    },
                },
            );
            return response.data; // Zwraca ID nowego atrybutu
        } catch (e) {
            if (axios.isAxiosError(e) && e.response) {
                console.error('Błąd API Shoper:', e.response.status, e.response.data);
                throw new BadRequestException(e.response.data);
            }
            console.error('Nieznany błąd:', e);
            throw new InternalServerErrorException();
        }
    }

    async getAttributesListFromShoper(
        decodedTokens: JwtPayload,
        params: {
            limit?: number;
            page?: number;
            offset?: number;
            filters?: string;
        } = {},
    ) {
        try {
            const { limit, page, offset, filters } = params;
            const requestParams: Record<string, string | number> = {};
            if (typeof limit === 'number') {
                requestParams.limit = limit;
            }
            if (typeof offset === 'number') {
                requestParams.offset = offset;
            } else if (typeof page === 'number') {
                requestParams.page = page;
            }
            if (filters) {
                requestParams.filters = filters;
            }
            const response = await this.httpService.axiosRef.get(
                this.getShoperRestUrl('/attributes'),
                {
                    params: requestParams,
                    headers: {
                        Authorization: `Bearer ${decodedTokens.shoperToken}`,
                        'Content-Type': 'application/json',
                    },
                },
            );
            return response.data;
        } catch (e) {
            if (axios.isAxiosError(e) && e.response) {
                console.error('Błąd API Shoper:', e.response.status, e.response.data);
                throw new BadRequestException(e.response.data);
            }
            console.error('Nieznany błąd:', e);
            throw new InternalServerErrorException();
        }
    }

    async getAttributeByIdFromShoper(id: number, decodedTokens: JwtPayload) {
        try {
            const response = await this.httpService.axiosRef.get(
                this.getShoperRestUrl(`/attributes/${id}`),
                {
                    headers: {
                        Authorization: `Bearer ${decodedTokens.shoperToken}`,
                        'Content-Type': 'application/json',
                    },
                },
            );

            return response.data;
        } catch (e) {
            if (axios.isAxiosError(e) && e.response) {
                console.error('Błąd API Shoper:', e.response.status, e.response.data);
                throw new BadRequestException(e.response.data);
            }
            console.error('Nieznany błąd:', e);
            throw new InternalServerErrorException();
        }
    }

    async getAttributesByIds(ids: number[], decodedTokens: JwtPayload) {
        const uniqueIds = Array.from(new Set(ids.filter((n) => Number.isFinite(n))));
        if (!uniqueIds.length) {
            throw new BadRequestException('Brak poprawnych identyfikatorów atrybutów');
        }

        const results = await Promise.all(
            uniqueIds.map(async (id) => {
                try {
                    return await this.getAttributeByIdFromShoper(id, decodedTokens);
                } catch (error) {
                    console.error(`Nie udało się pobrać atrybutu ${id}:`, error);
                    return null;
                }
            }),
        );

        const list = results.filter((v): v is Record<string, any> => !!v);
        return { list, count: list.length };
    }
}
