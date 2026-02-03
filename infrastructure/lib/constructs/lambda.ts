import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Trigger } from 'aws-cdk-lib/triggers';
import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as rds from 'aws-cdk-lib/aws-rds';
import path from 'path';
import * as lambda from 'aws-cdk-lib/aws-lambda';

interface MyLambdaProps {
  readonly myVpc: ec2.IVpc;
  readonly myRds: rds.DatabaseInstance;
  readonly myEcs: ecs.Ec2Service;
}

export class MyLambda extends Construct {

  constructor(scope: Construct, id: string, props : MyLambdaProps) {
    super(scope, id);

    const migrationSG = new ec2.SecurityGroup(this, 'MigrationLambdaSG', {
      vpc: props.myVpc,
      allowAllOutbound: true,
    });
    
    const migrationLambda = new lambda.DockerImageFunction(this, 'MigrationLambda', {
      code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, '../../../backend-ts'), {
        file: 'Dockerfile.migration',
        cmd: ["./migrate.sh"],
      }), 
      architecture: lambda.Architecture.X86_64,
      vpc: props.myVpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      memorySize: 512,
      timeout: cdk.Duration.minutes(2),
      securityGroups: [migrationSG],

      // DB_USER and DB_PASSWORD is fetched from prisma-migrate.ts using AWS SDK
      environment: {
        DB_HOST: props.myRds.dbInstanceEndpointAddress,
        DB_PORT: props.myRds.dbInstanceEndpointPort.toString(),
        DB_NAME: 'emimessenger',
        DB_PASSWORD: props.myRds.secret!.secretValueFromJson('password').unsafeUnwrap(),
        DB_USER: props.myRds.secret!.secretValueFromJson('username').unsafeUnwrap(),
        DB_PARAMS: 'sslrootcert=global-bundle.pem&sslmode=verify-full'
      }
    });
    props.myRds.secret?.grantRead(migrationLambda);
    props.myRds.connections.allowFrom(migrationLambda, ec2.Port.tcp(5432));

    new Trigger(this, 'RunMigration', {
      handler: migrationLambda,
      timeout: cdk.Duration.minutes(5),
      executeBefore: [props.myEcs],
      executeAfter: [props.myRds],
      invocationType: cdk.triggers.InvocationType.EVENT,
    });
  }
}