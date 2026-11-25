import {BadRequestException, Injectable} from '@nestjs/common';
import * as dns from 'dns/promises';

export interface ValidationResult {
  email: string | null,
  isValidSyntax: boolean,
  domain: string | null,
  hasMxRecords: boolean,
  mxRecords: string[],
  isDisposable: boolean,
  isFreeProvider: boolean,
  didYouMean: string | null,
  score: number,
  isDeliverable: boolean,
};

export interface DomainValidationResult {
  domain: string | null,
  isValidSyntax: boolean,
  hasMxRecords: boolean,
  mxRecords: string[],
  isDisposable: boolean,
  isFreeProvider: boolean,
  canReceiveEmail: boolean,
}

@Injectable()
export class AppService {

  private readonly disposableDomains = new Set([
    '10minutemail.com',
    'tempmail.com',
    'guerrillamail.com',
    'mailinator.com',
    'yopmail.com',
    'throwawaymail.com',
    'temp-mail.org',
    'getnada.com',
  ]);

  private readonly freeProvider = new Set([
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'icloud.com',
    'aol.com',
    'protonmail.com',
    'abv.bg',
    'mail.bg',
    'dir.bg',
    'gbg.bg',
  ]);

  private readonly domainTypos: Record<string, string> = {
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'gamil.com': 'gmail.com',
    'gmail.co': 'gmail.com',
    'gnail.com': 'gmail.com',
    'yaho.com': 'yahoo.com',
    'yahooo.com': 'yahoo.com',
    'hotmal.com': 'hotmail.com',
    'hotmial.com': 'hotmail.com',
    'outlok.com': 'outlook.com',
    'abv.gb': 'abv.bg',
    'abv.com': 'abv.bg',
    'avb.bg': 'abv.bg',
    'mail.gb': 'mail.bg',
  };

  async validateEmail(email?: string): Promise<ValidationResult> {
    if (!email || typeof email !== 'string') {
      return this.createInvalidResult(null);
    }

    const cleanEmail = email.trim().toLocaleLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidSyntax = emailRegex.test(cleanEmail);

    if (!isValidSyntax) {
      return this.createInvalidResult(cleanEmail);
    }
    ;

    const [localPart, domain] = cleanEmail.split('@');

    const suggestedDomain = this.domainTypos[domain];
    const didYouMean = suggestedDomain ? `${localPart}@${suggestedDomain}` : null;

    const isDisposable = this.disposableDomains.has(domain);
    const isFreeProvider = this.freeProvider.has(domain);
    const mxRecords = await this.checkMxRecords(domain);
    const hasMxRecords = mxRecords.length > 0;

    const {score, isDeliverable} = this.calculateScore(
      hasMxRecords,
      isDisposable,
      didYouMean !== null
    );
    return {
      email: cleanEmail,
      isValidSyntax: true,
      domain,
      hasMxRecords,
      mxRecords,
      isDisposable,
      isFreeProvider,
      didYouMean,
      score,
      isDeliverable,
    };
  }

  async validateBulk(emails: string[]): Promise<{ total: number, results: ValidationResult[] }> {
    if (!Array.isArray(emails)) {
      throw new BadRequestException('Emails must be an array');
    }
    ;

    if (emails.length > 50) {
      throw new BadRequestException('Maximum emails per order is 50')
    }
    ;

    const results = await Promise.all(
      emails.map((email) => this.validateEmail(email))
    );

    return {
      total: results.length,
      results
    }
  }

  async validateDomain(domain?: string): Promise<DomainValidationResult> {
    if (!domain || typeof domain !== 'string') {
      return {
        domain: null,
        isValidSyntax: false,
        hasMxRecords: false,
        mxRecords: [],
        isDisposable: false,
        isFreeProvider: false,
        canReceiveEmail: false,
      };
    }


    const cleanDomain = domain
      .trim()
      .toLocaleLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];

    const domainRegex = /^[a-z0-9.-]+\.[a-z]{2,}$/;
    const isValidSyntax = domainRegex.test(cleanDomain);

    if (!isValidSyntax) {
      return {
        domain: cleanDomain,
        isValidSyntax: false,
        hasMxRecords: false,
        mxRecords: [],
        isDisposable: false,
        isFreeProvider: false,
        canReceiveEmail: false,
      };
    }

    const mxRecords = await this.checkMxRecords(cleanDomain);
    const hasMxRecords = mxRecords.length > 0;
    const isDisposable = this.disposableDomains.has(cleanDomain);
    const isFreeProvider = this.freeProvider.has(cleanDomain);

    return {
      domain: cleanDomain,
      isValidSyntax: true,
      hasMxRecords: hasMxRecords,
      mxRecords: mxRecords,
      isDisposable: isDisposable,
      isFreeProvider: isFreeProvider,
      canReceiveEmail: hasMxRecords && !isDisposable,
    };
  }

  private calculateScore(hasMxRecords: boolean, isDisposable: boolean, hasTypo: boolean): {
    score: number;
    isDeliverable: boolean
  } {
    if (!hasMxRecords) {
      return {score: 10, isDeliverable: false}; // Верен синтаксис, но няма пощенски сървър
    }

    if (isDisposable) {
      return {score: 20, isDeliverable: false}; // Временен имейл - рисков за бизнеса
    }

    if (hasTypo) {
      return {score: 40, isDeliverable: false}; // Вероятна правописна грешка (напр. gmial.com)
    }

    // Има верен синтаксис, има MX сървъри, не е временен и няма грешка
    return {score: 100, isDeliverable: true};
  }

  private createInvalidResult(email: string | null): ValidationResult {
    return {
      email: email,
      isValidSyntax: false,
      domain: null,
      hasMxRecords: false,
      mxRecords: [],
      isDisposable: false,
      isFreeProvider: false,
      didYouMean: null,
      score: 0,
      isDeliverable: false,
    }
  }

  private async checkMxRecords(domain: string): Promise<string[]> {
    try {
      const records = await dns.resolveMx(domain);

      return records.sort(((a, b) => a.priority - b.priority)).map((record) => record.exchange);
    } catch (error) {
      return [];
    }
  }


}
