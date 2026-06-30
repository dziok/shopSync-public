import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';
import { AttributeGroupsService } from './attributes.service';
import { AttributeGroupsController, AttributesController } from './attributes.controller';

@Module({
    imports: [HttpModule, AuthModule],
    controllers: [AttributeGroupsController, AttributesController],
    providers: [AttributeGroupsService],
})
export class AttributeGroupsModule { }
