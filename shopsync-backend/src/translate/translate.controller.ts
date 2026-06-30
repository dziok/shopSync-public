import { Controller, Post, Body, BadRequestException, HttpException, HttpStatus, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

@Controller('translate')
export class TranslateController {
    @Post()
    async translate(@Body() body: { text: string; targetLang: string }) {
        const { text, targetLang } = body;
        const apiKey = process.env.DEEPL_API_KEY?.trim();

        if (!apiKey) {
            throw new InternalServerErrorException('Missing DEEPL_API_KEY');
        }
        if (!text || !text.trim()) {
            throw new BadRequestException('Missing text');
        }
        if (!targetLang || !targetLang.trim()) {
            throw new BadRequestException('Missing targetLang');
        }

        const params = new URLSearchParams();
        params.append('text', text);
        params.append('target_lang', targetLang);

        const baseUrl =
            process.env.DEEPL_API_URL?.trim() ??
            (apiKey.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com');

        try {
            const response = await axios.post(`${baseUrl}/v2/translate`, params, {
                headers: {
                    Authorization: `DeepL-Auth-Key ${apiKey}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            return { translated: response.data.translations[0].text };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const providerMessage =
                    (error.response?.data as any)?.message ||
                    (error.response?.data as any)?.error ||
                    error.message;
                if (status === 456) {
                    throw new HttpException(`DeepL quota exceeded: ${providerMessage}`, HttpStatus.TOO_MANY_REQUESTS);
                }
                if (status === 400) {
                    throw new BadRequestException(`DeepL request invalid: ${providerMessage}`);
                }
                throw new HttpException(`DeepL error (${status ?? 'unknown'}): ${providerMessage}`, HttpStatus.BAD_GATEWAY);
            }
            throw new InternalServerErrorException('Translation failed');
        }
    }
}
