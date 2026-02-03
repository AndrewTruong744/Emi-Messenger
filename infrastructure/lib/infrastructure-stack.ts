import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { MyVpc } from './constructs/vpc';
import { MyEcs } from './constructs/ecs';
import { MyAlb } from './constructs/alb';
import { MyRds } from './constructs/rds';
import { MyElasticache } from './constructs/elasticache';
import { MySecretsmanager } from './constructs/secretsmanager';
import { MyLambda } from './constructs/lambda';
import { MyCloudfront } from './constructs/cloudfront';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const secretsmanagerInstance = new MySecretsmanager(this, 'MySecretsmanager');

    const vpcInstance = new MyVpc(this, 'MyVpc');

    new MyCloudfront(this, 'MyCloudfront', {
      myVpc: vpcInstance.myVpc
    });

    const elasticacheInstance = new MyElasticache(this, 'MyElasticache', {
      myVpc: vpcInstance.myVpc,
      elasticacheSG: vpcInstance.elasticacheSG,
      mySecretsmanager: secretsmanagerInstance.mySecretsmanager
    });

    const rdsInstance = new MyRds(this, 'MyRds', {
      myVpc: vpcInstance.myVpc,
      rdsSG: vpcInstance.rdsSG
    })

    const ecsInstance = new MyEcs(this, 'MyEcs', {
      myVpc: vpcInstance.myVpc,
      ecsSG: vpcInstance.ecsSG,
      myElasticache: elasticacheInstance.myElasticache,
      myRds: rdsInstance.myRds,
      mySecretsmanager: secretsmanagerInstance.mySecretsmanager
    });

    new MyAlb(this, 'MyAlb', {
      myVpc: vpcInstance.myVpc,
      myEcs: ecsInstance.myEcs
    });

    new MyLambda(this, 'MyLambda', {
      myVpc: vpcInstance.myVpc,
      myEcs: ecsInstance.myEcs,
      myRds: rdsInstance.myRds,
    })
  }
}
