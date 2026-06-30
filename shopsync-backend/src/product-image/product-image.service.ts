import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Config } from '../config/config';
import { JwtPayload } from '../auth/auth.dto';
import axios from 'axios';
import { getApiloBaseUrl, getShoperRestBaseUrl } from '../config/service-endpoints';

@Injectable()
export class ProductImageService {
    constructor(private httpService: HttpService, private config: ConfigService<Config, true>) { }

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


    async addImgInApilo(fileData: Buffer, decodedTokens: JwtPayload) {
        try {
            const apiloResponse = await this.httpService.axiosRef.post(
                this.getApiloUrl('/media/'),
                fileData,
                {
                    headers: {
                        Authorization: `Bearer ${decodedTokens.apiloToken}`, // upewnij się, że używasz właściwego tokena
                        'Content-Type': 'application/octet-stream',
                        'Accept': 'application/json',

                    },
                }
            );

            return apiloResponse.data;
        } catch (e) {
            if (axios.isAxiosError(e) && e.response && e.response.status >= 400 && e.response.status <= 500) {
                throw new BadRequestException(e.message);
            }
            throw new InternalServerErrorException();
        }
    }

}
