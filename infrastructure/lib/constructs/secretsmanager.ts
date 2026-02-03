import { Construct } from 'constructs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';

export class MySecretsmanager extends Construct {
  public readonly mySecretsmanager : secretsmanager.Secret;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    dotenv.config({ path: path.join(__dirname, '../../../backend-ts/.env') });

    this.mySecretsmanager = new secretsmanager.Secret(this, 'Secrets' , {
      secretName: 'production/secrets',
      secretObjectValue: {
        REFRESH_TOKEN_SECRET: cdk.SecretValue.unsafePlainText(process.env['REFRESH_TOKEN_SECRET']!),
        ACCESS_TOKEN_SECRET: cdk.SecretValue.unsafePlainText(process.env['ACCESS_TOKEN_SECRET']!),
        GOOGLE_CLIENT_ID: cdk.SecretValue.unsafePlainText(process.env['GOOGLE_CLIENT_ID']!),
        GOOGLE_CLIENT_SECRET: cdk.SecretValue.unsafePlainText(process.env['GOOGLE_CLIENT_SECRET']!),
        REDIS_PASSWORD: cdk.SecretValue.unsafePlainText(process.env['REDIS_PASSWORD']!),
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}