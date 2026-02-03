import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as path from 'path';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';

interface MyCloudfrontProps {
  readonly myVpc: ec2.IVpc;
}

export class MyCloudfront extends Construct {
  constructor(scope: Construct, id: string, props : MyCloudfrontProps) {
    super(scope, id);

    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
    });

    const sslCert = acm.Certificate.fromCertificateArn(
      this, 
      'MyCertCloudFront', 
      process.env['CERT_ARN']!,
    );

    // TODO: update to move domain to .env file
    const redirectFunction = new cloudfront.Function(this, 'RedirectFunction', {
      code: cloudfront.FunctionCode.fromInline(`
        function handler(event) {
          const request = event.request;
          const host = request.headers.host.value;

          if (host === '${process.env['PROD_DOMAIN']}') {
            return {
              statusCode: 301,
              statusDescription: 'Moved Permanently',
              headers: {
                location: {value: "https://www.${process.env['PROD_DOMAIN']}" + request.uri}
              }
            }
          }

          return request;
        }  
      `),
      runtime: cloudfront.FunctionRuntime.JS_2_0,
    });

    const distribution = new cloudfront.Distribution(this, 'WebsiteDistribution', {
      domainNames: [`www.${process.env['PROD_DOMAIN']!}`, process.env['PROD_DOMAIN']!],
      certificate: sslCert,
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        functionAssociations: [
          {
            function: redirectFunction,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          },
        ],
      },
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        }
      ]
    });

    const myHostedZone = route53.HostedZone.fromLookup(this, 'MyZone', {
      domainName: process.env['PROD_DOMAIN']!,
    });

    new route53.ARecord(this, 'WwwAliasARecord', {
      zone: myHostedZone,
      recordName: 'www', // This keeps the 'api' prefix
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      ),
    });

    new route53.AaaaRecord(this, 'WwwAliasAaaaRecord', {
      zone: myHostedZone,
      recordName: 'www', // This keeps the 'api' prefix
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      ),
    });

    new route53.ARecord(this, 'AliasARecord', {
      zone: myHostedZone,
      recordName: '',
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      ),
    });

    new route53.AaaaRecord(this, 'AliasAaaaRecord', {
      zone: myHostedZone,
      recordName: '', 
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      ),
    });

    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [
        s3deploy.Source.asset(path.join(__dirname, '../../../frontend-ts/dist'))
      ],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'],
    });
  }
}