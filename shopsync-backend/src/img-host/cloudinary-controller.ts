import { Controller, Post, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary-service';


@Controller('upload')
export class CloudinaryController {
    constructor(private readonly cloudinaryService: CloudinaryService) { }

    @Post()
    @UseInterceptors(FilesInterceptor('images', 50))
    async uploadFile(@UploadedFiles() files: Express.Multer.File[]) {

        const uploadPromises = files.map(file => this.cloudinaryService.uploadImage(file));
        const uploadedImages = await Promise.all(uploadPromises);

        return { fileUrls: uploadedImages };
    }
}
