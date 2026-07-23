"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailModule = void 0;
const common_1 = require("@nestjs/common");
const mailer_1 = require("@nestjs-modules/mailer");
const email_service_1 = require("./email.service");
const path_1 = require("path");
const fs_1 = require("fs");
const handlebars = require("handlebars");
const config_1 = require("@nestjs/config");
class CustomHandlebarsAdapter {
    constructor(helpers) {
        this.templates = {};
        handlebars.registerHelper('concat', (...args) => {
            args.pop();
            return args.join('');
        });
        if (helpers) {
            handlebars.registerHelper(helpers);
        }
    }
    compile(mail, callback, mailerOptions) {
        const templateBaseDir = mailerOptions?.template?.dir || '';
        const templateName = mail.template;
        const ext = (0, path_1.extname)(templateName) || '.hbs';
        const baseName = (0, path_1.basename)(templateName, ext);
        const templatePath = (0, path_1.join)(templateBaseDir, baseName + ext);
        if (!this.templates[templateName]) {
            try {
                if (!(0, fs_1.existsSync)(templatePath)) {
                    return callback(new Error(`Template file not found: ${templatePath}`));
                }
                const source = (0, fs_1.readFileSync)(templatePath, 'utf-8');
                this.templates[templateName] = handlebars.compile(source);
            }
            catch (err) {
                return callback(err);
            }
        }
        try {
            mail.data.html = this.templates[templateName](mail.data.context);
            return callback();
        }
        catch (err) {
            return callback(err);
        }
    }
}
let EmailModule = class EmailModule {
};
exports.EmailModule = EmailModule;
exports.EmailModule = EmailModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            mailer_1.MailerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (config) => {
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
                                rejectUnauthorized: false,
                            },
                            connectionTimeout: 10000,
                            greetingTimeout: 10000,
                        },
                        defaults: {
                            from: `"MicroCart No-Reply" <${config.get('SMTP_USER')}>`,
                        },
                        template: {
                            dir: (0, path_1.join)(__dirname, 'templates'),
                            adapter: new CustomHandlebarsAdapter({
                                eq: (v1, v2) => v1 === v2,
                            }),
                            options: {
                                strict: true,
                            },
                        },
                    };
                },
                inject: [config_1.ConfigService],
            }),
        ],
        providers: [email_service_1.EmailService],
        exports: [email_service_1.EmailService],
    })
], EmailModule);
//# sourceMappingURL=email.module.js.map