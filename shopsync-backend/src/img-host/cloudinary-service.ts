import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ folder: 'uploads' }, (error, result) => {
        if (error) return reject(error);
        resolve(result?.secure_url || '');
      }).end(file.buffer);
    });
  }

  async uploadRawFeed(path: string): Promise<string> {
    const publicId = 'shopsync-chatgpt-ads-feed.csv.gz';
    const result = await cloudinary.uploader.upload(path, {
      resource_type: 'raw', public_id: publicId, overwrite: true, invalidate: true,
    });
    if (result.resource_type !== 'raw' || result.public_id !== publicId || !result.secure_url) {
      throw new Error('Cloudinary did not return the expected raw feed asset.');
    }
    return cloudinary.url(publicId, { resource_type: 'raw', secure: true });
  }
}
