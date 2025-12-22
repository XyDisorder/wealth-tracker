import { Injectable } from '@nestjs/common';
import { APP_NAME, APP_VERSION } from '../../common/constants/config.constants';

@Injectable()
export class AppService {
  healthCheck(): string {
    return `${APP_NAME} v${APP_VERSION} is running!`;
  }

  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
