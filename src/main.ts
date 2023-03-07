import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const microserviceRabbitMQ = app.connectMicroservice({
        transport: Transport.RMQ,
        options: {
            urls: ['amqp://user:password@localhost:5672'],
            queue: 'CloudRMQ',
            // false = manual acknowledgement; true = automatic acknowledgment
            noAck: false,
            // Get one by one
            prefetchCount: 1,
        },
    });

    await app.startAllMicroservices();
    await app.listen(4000);
}
bootstrap();
