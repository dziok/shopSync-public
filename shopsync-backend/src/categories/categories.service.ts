import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { JwtPayload } from '../auth/auth.dto';
import axios from 'axios';
import { getShoperRestBaseUrl } from '../config/service-endpoints';

@Injectable()
export class CategoriesService {
    constructor(private httpService: HttpService) { }

    private getShoperRestUrl(path: string) {
        return `${getShoperRestBaseUrl()}${path}`;
    }

    async getCategoriesFromShoper(
        decodedTokens: JwtPayload,
        limit: number = 50,
        page: number = 1,
        filters: string = JSON.stringify({ 'translations.pl_PL.active': 1 }),
        include: string = 'translations',
    ) {
        try {
            const response = await this.httpService.axiosRef.get(
                this.getShoperRestUrl('/categories'),
                {
                    params: {
                        limit: limit,
                        page: page,
                        filters: filters,
                        include: include,
                    },
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

    async getCategoryFromShoper(decodedTokens: JwtPayload, id: string) {
        try {
            const response = await this.httpService.axiosRef.get(
                this.getShoperRestUrl(`/categories/${encodeURIComponent(id)}`),
                {
                    params: { include: 'translations' },
                    headers: {
                        Authorization: `Bearer ${decodedTokens.shoperToken}`,
                        'Content-Type': 'application/json',
                    },
                },
            );
            return response.data;
        } catch (e) {
            if (axios.isAxiosError(e) && e.response) {
                throw new BadRequestException(e.response.data);
            }
            throw new InternalServerErrorException();
        }
    }

    async getProducers( // Zmieniono nazwę metody
        decodedTokens: JwtPayload,
        limit: number = 50,
        page: number = 1,
    ) {
        try {
            const response = await this.httpService.axiosRef.get(
                this.getShoperRestUrl('/producers'),
                {
                    params: {
                        limit: limit,
                        page: page,
                    },
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

    async getProductSafetyProducers(
        decodedTokens: JwtPayload,
        limit: number = 50,
        page: number = 1,
    ) {
        try {
            const response = await this.httpService.axiosRef.get(
                this.getShoperRestUrl('/product-safety-producers'),
                {
                    params: {
                        limit: limit,
                        page: page,
                    },
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

    async getProductSafetyCertificates(
        decodedTokens: JwtPayload,
        limit: number = 50,
        page: number = 1,
    ) {
        try {
            const response = await this.httpService.axiosRef.get(
                this.getShoperRestUrl('/product-safety-certificates'),
                {
                    params: {
                        limit: limit,
                        page: page,
                    },
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
}
