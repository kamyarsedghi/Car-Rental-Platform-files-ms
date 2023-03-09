import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: '.env',
            isGlobal: true,
        }),
        ClientsModule.register([
            {
                name: 'CAR_SERVICE',
                transport: Transport.RMQ,
                options: {
                    urls: ['amqp://user:password@localhost:5672'],
                    queue: 'the-main-queue',
                    queueOptions: {
                        durable: true,
                    },
                },
            },
        ]),
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
