import { Construct } from 'constructs';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

interface MyEcsProps {
  readonly myVpc: ec2.IVpc;
  readonly myElasticache: elasticache.CfnReplicationGroup;
  readonly myRds: rds.DatabaseInstance
  readonly ecsSG: ec2.ISecurityGroup;
  readonly mySecretsmanager: secretsmanager.ISecret;
}

export class MyEcs extends Construct {
  public readonly myEcs: ecs.Ec2Service;

  constructor(scope: Construct, id: string, props : MyEcsProps) {
    super(scope, id);

    const cluster = new ecs.Cluster(this, 'MyCluster', {vpc: props.myVpc});
    
    const asg = new autoscaling.AutoScalingGroup(this, 'MyAsg', {
      vpc: props.myVpc,
      securityGroup: props.ecsSG,
      instanceType: new ec2.InstanceType('t3.micro'),
      machineImage: ecs.EcsOptimizedImage.amazonLinux2023(),
      minCapacity: 1,
      maxCapacity: 3,
      // allow asg to scale down properly
      newInstancesProtectedFromScaleIn: false,
    });

    // connects asg to cluster
    const capacityProvider = new ecs.AsgCapacityProvider(this, 'AsgProvider', {
      autoScalingGroup: asg,
      enableManagedScaling: true,
      enableManagedTerminationProtection: false,
    });
    cluster.addAsgCapacityProvider(capacityProvider);

    // TODO: get FRONTEND_URL from .env
    const taskDef = new ecs.Ec2TaskDefinition(this, 'MyTaskDef', {
      // each instance of backend has its own private ip address
      networkMode: ecs.NetworkMode.AWS_VPC,
    });

    // allows ecs to read secrets from secretsmanager
    const executionRole = taskDef.obtainExecutionRole();
    props.myRds.secret?.grantRead(executionRole);
    props.mySecretsmanager.grantRead(executionRole);

    taskDef.addContainer('ExpressApp', {
      image: ecs.ContainerImage.fromAsset(path.join(__dirname, '../../../backend-ts'), {
        file: 'Dockerfile',
      }),
      memoryLimitMiB: 256,
      cpu: 256,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'BackendLogs',
        logRetention: 7, // Keep logs for 7 days (saves money)
      }),
      portMappings: [{ containerPort: 3000 }],
      environment: {
        DB_HOST: props.myRds.dbInstanceEndpointAddress,
        DB_PORT: props.myRds.dbInstanceEndpointPort,
        DB_NAME: 'emimessenger',
        DB_PARAMS: 'sslrootcert=global-bundle.pem&sslmode=verify-full',
        REDIS_HOST: props.myElasticache.attrPrimaryEndPointAddress,
        REDIS_PORT: props.myElasticache.attrPrimaryEndPointPort,
        ORIGIN: `https://www.${process.env['PROD_DOMAIN']!}`,
        BACKEND: `https://api.${process.env['PROD_DOMAIN']!}`,
        MODE: 'production',
      },
      secrets: {
        DB_PASSWORD: ecs.Secret.fromSecretsManager(props.myRds.secret!, 'password'),
        DB_USER: ecs.Secret.fromSecretsManager(props.myRds.secret!, 'username'),
        GOOGLE_CLIENT_ID: ecs.Secret.fromSecretsManager(props.mySecretsmanager, 'GOOGLE_CLIENT_ID'),
        GOOGLE_CLIENT_SECRET: ecs.Secret.fromSecretsManager(props.mySecretsmanager, 'GOOGLE_CLIENT_SECRET'),
        ACCESS_TOKEN_SECRET: ecs.Secret.fromSecretsManager(props.mySecretsmanager, 'ACCESS_TOKEN_SECRET'),
        REFRESH_TOKEN_SECRET: ecs.Secret.fromSecretsManager(props.mySecretsmanager, 'REFRESH_TOKEN_SECRET'),
        REDIS_PASSWORD: ecs.Secret.fromSecretsManager(props.mySecretsmanager, 'REDIS_PASSWORD'),
      }
    });

    this.myEcs = new ecs.Ec2Service(this, 'EcsService', {
      cluster,
      taskDefinition: taskDef,
      securityGroups: [props.ecsSG],
      placementStrategies: [
        ecs.PlacementStrategy.spreadAcross(ecs.BuiltInAttributes.INSTANCE_ID)
      ],
      healthCheckGracePeriod: cdk.Duration.seconds(120),

      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      capacityProviderStrategies: [
        {
          capacityProvider: capacityProvider.capacityProviderName,
          weight: 1,
        },
      ],
    });

    this.myEcs.node.addDependency(capacityProvider);
  }
}