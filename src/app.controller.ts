import { Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { MessagePattern, RmqContext, Ctx, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from './utils/multer/multer.options';
@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    getHello(): string {
        return 'Files Microservice is functional.';
    }

    @UseInterceptors(FileInterceptor('file', multerOptions))
    @Post('import-cars')
    async addCars(@UploadedFile() file: Express.Multer.File): Promise<void> {
        return await this.appService.addCars(file);
    }

    // @MessagePattern('rabbit-mq-producer')
    // public async execute(@Payload() data: any, @Ctx() context: RmqContext) {
    //     const channel = context.getChannelRef();
    //     const orginalMessage = context.getMessage();
    //     console.log('data', data);
    //     channel.ack(orginalMessage);
    // }

    @MessagePattern('save-to-file')
    async saveToFile(@Payload() data: string[], @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const orginalMessage = context.getMessage();
        const result = this.appService.saveToFile(data);
        // console.log('data', data);
        channel.ack(orginalMessage);
        return result;
    }

    @MessagePattern('test')
    test(@Payload() data: string[], @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const orginalMessage = context.getMessage();
        console.log('data from ms:', data);
        channel.ack(orginalMessage);
        return { data: 'test received.' };
    }

    // @MessagePattern('hello')
    // async hello(@Payload() data: string[], @Ctx() context: RmqContext) {
    //     const channel = context.getChannelRef();
    //     const orginalMessage = context.getMessage();
    //     console.log('Received message:', data);
    //     channel.ack(orginalMessage);
    //     return 'Hello from car service';
    // }
}
