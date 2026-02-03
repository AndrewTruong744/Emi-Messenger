import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cdk from 'aws-cdk-lib';

interface MyElasticacheProps {
  readonly myVpc: ec2.IVpc;
  readonly elasticacheSG: ec2.SecurityGroup;
  readonly mySecretsmanager: secretsmanager.ISecret;
}

// TODO: implement IAM Auth
export class MyElasticache extends Construct {
  public readonly myElasticache: elasticache.CfnReplicationGroup;

  constructor(scope: Construct, id: string, props : MyElasticacheProps) {
    super(scope, id);

    const subnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'subnets for redis',
      subnetIds: props.myVpc.privateSubnets.map(s => s.subnetId),
    });

    this.myElasticache = new elasticache.CfnReplicationGroup(this, 'ElasticacheService', {
      replicationGroupDescription: 'redis instance',
      engine: 'redis',
      engineVersion: '7.1',
      cacheNodeType: 'cache.t3.micro',
      numCacheClusters: 1,
      automaticFailoverEnabled: false,
      cacheSubnetGroupName: subnetGroup.ref,
      securityGroupIds: [props.elasticacheSG.securityGroupId],
      transitEncryptionEnabled: true,
      atRestEncryptionEnabled: true,
    });

    this.myElasticache.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
  }
}