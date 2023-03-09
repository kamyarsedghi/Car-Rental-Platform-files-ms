/* eslint-disable @typescript-eslint/no-var-requires */
import { Inject, Injectable } from '@nestjs/common';
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

    async addCars(file: Express.Multer.File): Promise<void> {
        try {
            let list: string[] = [];
            const readableStream = fs.createReadStream(file.path as string);
            readableStream
                .pipe(csv())
                .on('data', (row: string) => {
                    list.push(row);
                    if (list.length === 100) {
                        // csv().pause();
                        this.client
                            .send('import-cars-from-ms', { list, done: false })
                            .toPromise()
                            .catch(err => console.log(err));
                        console.log('list:', list.length);
                        list = [];
                    }
                })
                .on('end', async () => {
                    this.client
                        .send('import-cars-from-ms', { list, done: true })
                        .toPromise()
                        .then(res => console.log('Response:', res.status))
                        .catch(err => console.log(err));
                    fs.unlink(file.path, () => console.log('import ended'));
                    console.log('CSV file successfully processed');
                })
                .on('error', error => {
                    console.log('CSV error:', error);
                });
        } catch (error) {
            console.log(error);
        }
    }
}
