import { HttpService } from '@nestjs/axios';
import { BadRequestException, HttpException, HttpStatus, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Config } from '../config/config';
import { JwtPayload } from '../auth/auth.dto';
import { ApiloTokenService } from '../auth/apilo-token.service';
import axios from 'axios';
import { getApiloBaseUrl, getShoperRestBaseUrl } from '../config/service-endpoints';

@Injectable()
export class ProductImageService {
    constructor(private httpService: HttpService, private config: ConfigService<Config, true>, private readonly apiloTokenService: ApiloTokenService) { }

    private getShoperRestUrl(path: string) {
        return `${getShoperRestBaseUrl()}${path}`;
    }

    private getApiloUrl(path: string) {
        return `${getApiloBaseUrl()}${path}`;
    }

    async addOne(dto: Record<string, string>, decodedTokens: JwtPayload) {
        try {
            const response = await this.httpService.axiosRef.post(
                this.getShoperRestUrl('/product-images'),
                dto,
                {
                    headers: {
                        Authorization: `Bearer ${decodedTokens.shoperToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );


            return response.data;
        } catch (e) {
            if (axios.isAxiosError(e) && e.status >= 400 && e.status <= 500) {
                throw new BadRequestException(e.message)
            }
            throw new InternalServerErrorException()
        }


    }


    async addImgInApilo(fileData: Buffer, _decodedTokens: JwtPayload) {
        try {
            const apiloToken = await this.apiloTokenService.getAccessToken();
            const apiloResponse = await this.httpService.axiosRef.post(
                this.getApiloUrl('/media/'),
                fileData,
                {
                    headers: {
                        Authorization: `Bearer ${apiloToken}`,
                        'Content-Type': 'application/octet-stream',
                        'Accept': 'application/json',
                    },
                    timeout: 60_000,
                }
            );

            return apiloResponse.data;
        } catch (e) {
            if (axios.isAxiosError(e)) {
                const status = e.response?.status;
                const data = e.response?.data;
                const detail = status === 401 ? 'Apilo odrzuciło token. Odnów połączenie w panelu Apilo.' :
                    status === 429 ? 'Przekroczono limit zapytań Apilo. Spróbuj ponownie za chwilę.' :
                        typeof data?.message === 'string' ? data.message :
                    typeof data?.description === 'string' ? data.description :
                        status ? `Apilo zwróciło HTTP ${status}.` : 'Brak odpowiedzi z Apilo.';
                const code = status && status >= 400 && status < 500 ? HttpStatus.BAD_REQUEST :
                    e.code === 'ECONNABORTED' || e.code === 'ETIMEDOUT' ? HttpStatus.GATEWAY_TIMEOUT : HttpStatus.BAD_GATEWAY;
                throw new HttpException(`Przesyłanie zdjęcia do Apilo: ${detail}${status ? ` (HTTP ${status})` : ''}`, code);
            }
            if (e instanceof HttpException) throw e;
            throw new InternalServerErrorException('Nieoczekiwany błąd podczas przesyłania zdjęcia do Apilo.');
        }
    }

}
