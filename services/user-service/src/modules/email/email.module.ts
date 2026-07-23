import { Module, Global } from '@nestjs/common';
import { MailerModule, TemplateAdapter } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';
import { join, basename, extname } from 'path';
import { readFileSync, existsSync } from 'fs';
import * as handlebars from 'handlebars';
import { ConfigModule, ConfigService } from '@nestjs/config';

class CustomHandlebarsAdapter implements TemplateAdapter {
  private templates: Record<string, handlebars.TemplateDelegate> = {};

  constructor(helpers?: Record<string, any>) {
    handlebars.registerHelper('concat', (...args) => {
      args.pop();
      return args.join('');
    });
    if (helpers) {
      handlebars.registerHelper(helpers);
    }
  }

  public compile(mail: any, callback: any, mailerOptions: any): void {
    if (!mail || !mail.template) {
      return callback();
    }
    const templateBaseDir = mailerOptions?.template?.dir || '';
    const templateName = mail.template;
    const ext = extname(templateName) || '.hbs';
    const baseName = basename(templateName, ext);
    const templatePath = join(templateBaseDir, baseName + ext);

    if (!this.templates[templateName]) {
      try {
        if (!existsSync(templatePath)) {
          return callback(new Error(`Template file not found: ${templatePath}`));
        }
        const source = readFileSync(templatePath, 'utf-8');
        this.templates[templateName] = handlebars.compile(source);
      } catch (err) {
        return callback(err);
      }
    }

    try {
      mail.data.html = this.templates[templateName](mail.data.context);
      return callback();
    } catch (err) {
      return callback(err);
    }
  }
}

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        const port = parseInt(config.get('SMTP_PORT', '465'), 10);
        const secure = port === 465;
        return {
          transport: {
            host: config.get('SMTP_HOST', 'smtp.gmail.com'),
            port,
            secure,
            auth: {
              user: config.get('SMTP_USER'),
              pass: config.get('SMTP_PASS'),
            },
            tls: {
              rejectUnauthorized: false, // Allow self-signed certs in dev
            },
            connectionTimeout: 10000, // 10 seconds to connect
            greetingTimeout: 10000,   // 10 seconds to receive greeting
          },
          defaults: {
            from: `"MicroCart No-Reply" <${config.get('SMTP_USER')}>`,
          },
          template: {
            dir: join(__dirname, 'templates'),
            adapter: new CustomHandlebarsAdapter({
              eq: (v1, v2) => v1 === v2,
            }),
            options: {
              strict: true,
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}

