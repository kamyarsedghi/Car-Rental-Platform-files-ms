/* eslint-disable @typescript-eslint/no-var-requires */
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import * as fs from 'fs-extra';
import * as path from 'path';

const ObjectsToCsv = require('objects-to-csv');
const csv = require('csv-parser');

@Injectable()
export class AppService {
    private cars: any[] = [];

    constructor(@Inject('CAR_SERVICE') private readonly client: ClientProxy) {}

    async onApplicationBootstrap() {
        await this.client.connect();
    }

    async saveToFile(data: any) {
        const { dateFrom, dateTo, sortedAllCarsUsage, exportType } = data;

        const dir = path.join(__dirname, '../reports');

        !fs.existsSync(dir) ? fs.mkdirSync(dir) : null;

        const toFile = Object.entries(sortedAllCarsUsage).map(([key, value]) => {
            return {
                month: key,
                cars: Object.entries(value).map(([key, value]) => {
                    return {
                        car_id: key,
                        ...value,
                    };
                }),
            };
        });

        if (exportType === 'json') {
            const filePathJson = path.join(dir, `${dateFrom.split('T')[0]}-${dateTo.split('T')[0]}-carsUsage.json`);
            const json = JSON.stringify(toFile);
            fs.writeFileSync(filePathJson, json);
            return { status: `Reports saved: ${filePathJson}` };
        } else if (exportType === 'csv') {
            const filePathCSV = path.join(dir, `${dateFrom.split('T')[0]}-${dateTo.split('T')[0]}-carsUsage.csv`);
            const csv = new ObjectsToCsv(toFile);
            await csv.toDisk(filePathCSV);
            return { status: `Reports saved: ${filePathCSV}` };
        }

        return { Error: 'Could not save into file' };
    }

    async addCars(file: Express.Multer.File): Promise<any> {
        try {
            let list: string[] = [];
            const readableStream = fs.createReadStream(file.path as string);

            const tmp = await new Promise((resolve, reject) => {
                readableStream
                    .pipe(csv())
                    .on('data', (row: string) => {
                        list.push(row);
                        if (list.length === 100) {
                            this.client
                                .send('import-cars-from-ms', { list, done: false })
                                .toPromise()
                                .catch(err => console.log(err));
                            console.log('list:', list.length);
                            list = [];
                        }
                    })
                    .on('end', async () => {
                        try {
                            const result = await this.client.send('import-cars-from-ms', { list, done: true }).toPromise();
                            result.status === 'Import DONE' ? (console.log('Import DONE'), fs.unlink(file.path, () => console.log('Import ended'))) : console.log('Import ERROR');
                            resolve({ status: 'Import DONE' });
                        } catch (err) {
                            console.log(err);
                            reject(err);
                        }
                    })
                    .on('error', error => {
                        console.log('CSV error:', error);
                        reject(error);
                    });
            });
            return await tmp;
        } catch (error) {
            console.log(error);
            throw new InternalServerErrorException(error.message);
        }
    }
}
