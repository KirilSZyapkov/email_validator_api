import {Controller, Get, Query, Post, Body, UseGuards} from '@nestjs/common';
import {AppService, ValidationResult, DomainValidationResult} from './app.service.js';
import {RapidApiGuard} from "./rapidapi.guard.js";

@Controller('v1/validate')
@UseGuards(RapidApiGuard)
export class AppController {
  constructor(private readonly appService: AppService) {
  }

  @Get('email')
  async checkEmail(@Query('email') email: string): Promise<ValidationResult> {
    return this.appService.validateEmail(email);
  }

  @Post('bulk')
  async checkBulkEmails(@Body('emails') emails: string[]) {
    return this.appService.validateBulk(emails);
  }

  @Get('domain')
  async checkDomain(@Query('domain') domain?: string): Promise<DomainValidationResult> {
    return  this.appService.validateDomain(domain);
  }
}
