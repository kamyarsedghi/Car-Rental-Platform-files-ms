import { Injectable } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ObjectsToCsv = require('objects-to-csv');

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
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
      const filePathJson = path.join(
        dir,
        `${dateFrom.split('T')[0]}-${dateTo.split('T')[0]}-carsUsage.json`,
      );
      const json = JSON.stringify(toFile);
      fs.writeFileSync(filePathJson, json);
    } else if (exportType === 'csv') {
      const filePathCSV = path.join(
        dir,
        `${dateFrom.split('T')[0]}-${dateTo.split('T')[0]}-carsUsage.csv`,
      );
      const csv = new ObjectsToCsv(toFile);
      await csv.toDisk(filePathCSV);
    }

    // console.log('data:', data);
    return { status: 'ok' };
  }
}
