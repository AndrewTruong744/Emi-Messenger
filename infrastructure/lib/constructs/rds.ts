import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as cdk from 'aws-cdk-lib'

interface MyRdsProps {
  readonly myVpc: ec2.IVpc;
  readonly rdsSG: ec2.ISecurityGroup;
}

export class MyRds extends Construct {
  public readonly myRds: rds.DatabaseInstance;

  constructor(scope: Construct, id: string, props : MyRdsProps) {
    super(scope, id);

    const parameterGroup = new rds.ParameterGroup(this, 'RdsParameterGroup', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_17_7,
      }),
      parameters: {
        'rds.accepted_password_auth_method': 'scram',
        'password_encryption': 'scram-sha-256'
      },
    });

    this.myRds = new rds.DatabaseInstance(this, 'RdsInstance', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_17_7,
      }),
      parameterGroup: parameterGroup,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc: props.myVpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      credentials: rds.Credentials.fromGeneratedSecret('postgres'),
      databaseName: 'emimessenger',
      allocatedStorage: 20,
      securityGroups: [props.rdsSG],
      publiclyAccessible: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // destroy this with cdk destroy,
      deleteAutomatedBackups: true,
    });
  }
}